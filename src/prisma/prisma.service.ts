import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'child_process';

/**
 * Resuelve el CLI de Prisma dentro de la imagen. Se ejecuta con `node` para no
 * depender de `npx`, que podría intentar descargar el paquete si falta.
 */
function resolveCli(pkg: string): string {
  return require.resolve(pkg);
}

function errorOutput(error: unknown): string {
  const e = error as {
    stderr?: Buffer | string;
    stdout?: Buffer | string;
    message?: string;
  };
  const stderr = e?.stderr?.toString?.() ?? '';
  const stdout = e?.stdout?.toString?.() ?? '';

  return `${stderr}\n${stdout}`.trim() || e?.message || 'Error desconocido';
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      this.fail(
        `No se pudo conectar a PostgreSQL: ${errorOutput(error)}. Revisa DATABASE_URL y que la base de datos esté levantada.`,
      );
    }

    await this.applyMigrations();
    await this.checkSeeding();
  }

  /**
   * Solo el proceso que gestiona la base de datos aplica migraciones y seed.
   * El worker arranca con RUN_MIGRATIONS=false (ver `npm run start:worker`)
   * para que api y worker no compitan por migrar a la vez.
   */
  private managesDatabase(): boolean {
    return process.env.RUN_MIGRATIONS !== 'false';
  }

  /**
   * Aplica las migraciones pendientes de `prisma/migrations` con
   * `prisma migrate deploy`:
   *
   *  - solo ejecuta los SQL que todavía no están registrados en
   *    `_prisma_migrations`; los datos existentes no se tocan;
   *  - nunca resetea la base de datos;
   *  - si algo falla, el proceso termina con error en lugar de "arreglar" el
   *    esquema con `prisma db push --accept-data-loss`, que podía borrar
   *    columnas y tablas con sus datos. La versión anterior sigue sirviendo
   *    mientras se corrige la migración.
   */
  async applyMigrations(): Promise<void> {
    if (!this.managesDatabase()) {
      this.logger.log(
        'RUN_MIGRATIONS=false: este proceso no aplica migraciones.',
      );
      return;
    }

    let output = '';

    try {
      output = this.execNode(resolveCli('prisma/build/index.js'), [
        'migrate',
        'deploy',
      ]);
    } catch (error) {
      const detail = errorOutput(error);

      this.logger.error(
        'Falló `prisma migrate deploy`. La base de datos NO se ha modificado y la API no arrancará.',
      );
      this.logger.error(detail);
      this.logger.error(this.migrationHint(detail));
      this.fail(
        'Corrige la migración pendiente y vuelve a desplegar. La versión anterior sigue funcionando con sus datos intactos.',
      );
    }

    if (/no pending migrations/i.test(output)) {
      this.logger.log('Migraciones al día.');
    } else {
      this.logger.log('Migraciones aplicadas con `prisma migrate deploy`:');
      this.logger.log(output.trim());
    }

    await this.warnIfRequiredVersionOutdated();
  }

  /**
   * Traduce los errores más habituales de Prisma a instrucciones concretas
   * para el log del despliegue.
   */
  private migrationHint(detail: string): string {
    if (/P3009|found failed migrations/i.test(detail)) {
      return (
        'Hay una migración marcada como fallida en `_prisma_migrations`. Revisa `npx prisma migrate status` y ' +
        'resuélvela a mano: `npx prisma migrate resolve --rolled-back <nombre>` si no llegó a aplicarse, o ' +
        '`npx prisma migrate resolve --applied <nombre>` si sí se aplicó.'
      );
    }

    if (/P3018/i.test(detail)) {
      return (
        'Una migración falló al ejecutarse. Corrige su SQL en `prisma/migrations/<nombre>/migration.sql` ' +
        '(Prisma no reintenta una migración marcada como fallida: resuélvela antes con `prisma migrate resolve`).'
      );
    }

    if (/P3005/i.test(detail) || /schema is not empty/i.test(detail)) {
      return (
        'La base de datos tiene tablas pero no historial de migraciones. Marca la migración inicial como ' +
        'aplicada (`npx prisma migrate resolve --applied <primera migración>`) sin borrar datos.'
      );
    }

    if (/P1001|P1000|can't reach database|ECONNREFUSED/i.test(detail)) {
      return 'No se puede llegar a PostgreSQL. Revisa DATABASE_URL y que el contenedor de la base de datos esté sano.';
    }

    return 'Revisa el SQL pendiente y el estado con `npx prisma migrate status`.';
  }

  /**
   * Comprueba si falta el catálogo base (construcciones, hormigas, recursos) y,
   * solo en ese caso, ejecuta el seed. Nunca borra ni sobrescribe partidas.
   */
  async checkSeeding(): Promise<void> {
    if (!this.managesDatabase()) {
      return;
    }

    let catalogueSize: number;

    try {
      const [constructions, ants, resources] = await Promise.all([
        this.construction.count(),
        this.ant.count(),
        this.resource.count(),
      ]);
      catalogueSize = constructions + ants + resources;
    } catch (error) {
      this.logger.error(
        `No se pudo comprobar el catálogo base: ${errorOutput(error)}`,
      );
      return;
    }

    if (catalogueSize > 0) {
      this.logger.log('Catálogo base presente: no se ejecuta el seed.');
      return;
    }

    this.logger.warn(
      'Base de datos sin catálogo (construcciones, hormigas y recursos vacíos): ejecutando seed...',
    );

    try {
      const output = this.execNode(resolveCli('tsx/cli'), ['prisma/seed.ts']);
      this.logger.log('Seed ejecutado con éxito.');

      if (output.trim()) {
        this.logger.log(output.trim());
      }
    } catch (error) {
      // El seed solo rellena catálogo; si falla no se bloquea el arranque,
      // pero queda el aviso para ejecutarlo a mano con `npm run seed`.
      this.logger.error('El seed falló. Ejecútalo a mano con `npm run seed`.');
      this.logger.error(errorOutput(error));
    }
  }

  /**
   * `REQUIRED_DB_VERSION` ya no bloquea el arranque (antes provocaba que se
   * ejecutaran migraciones en cada reinicio). Solo se avisa si quedó obsoleto.
   */
  private async warnIfRequiredVersionOutdated(): Promise<void> {
    const required = process.env.REQUIRED_DB_VERSION?.trim();

    if (!required) {
      return;
    }

    try {
      const rows = await this.$queryRawUnsafe<
        Array<{ migration_name: string }>
      >(
        'SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1',
      );
      const lastMigration = rows[0]?.migration_name;

      if (lastMigration && !lastMigration.startsWith(required)) {
        this.logger.warn(
          `REQUIRED_DB_VERSION=${required} está desactualizado (última migración: ${lastMigration}). ` +
            'Ya no bloquea el arranque; puedes borrar la variable del .env.',
        );
      }
    } catch {
      // Si la tabla de migraciones no existe todavía, no hay nada que avisar.
    }
  }

  private execNode(cli: string, args: string[]): string {
    return execFileSync(process.execPath, [cli, ...args], {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 5 * 60 * 1000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  private fail(message: string): never {
    this.logger.error(message);
    process.exit(1);

    // Inalcanzable en producción; mantiene el tipo `never` si los tests
    // mockean process.exit.
    throw new Error(message);
  }
}

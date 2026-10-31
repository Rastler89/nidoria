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
    colonies: any;

    async onModuleInit() {
        await this.$connect();
        await this.checkDbVersion();
        await this.checkSeeding();
    }

    async checkDbVersion() {
        const requiredVersion = process.env.REQUIRED_DB_VERSION;
        if (!requiredVersion) {
            this.logger.warn("REQUIRED_DB_VERSION no está definido en .env. Saltando verificación.");
            return;
        }

        try {
            // Consultamos la tabla de migraciones de Prisma
            const result: any[] = await this.$queryRawUnsafe(
                `SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1`
            );

            const lastMigration = result[0]?.migration_name || "";
            this.logger.log(`Versión actual de la DB (última migración): ${lastMigration}`);

            if (!lastMigration.startsWith(requiredVersion)) {
                this.logger.warn(`LA VERSIÓN DE LA DB NO COINCIDE. Esperada: ${requiredVersion}. Ejecutando migraciones...`);
                this.runMigrations();
            } else {
                this.logger.log("✅ Versión de la base de datos correcta.");
            }
        } catch (error) {
            this.logger.error("Error al verificar la versión de la base de datos:", error);
            // Si la tabla no existe, probablemente sea la primera vez, intentamos migrar
            if (error.code === 'P2010' || error.message.includes('relation "_prisma_migrations" does not exist')) {
                 this.logger.warn("La tabla de migraciones no existe. Intentando migración inicial...");
                 this.runMigrations();
            }
        }
    }

    async checkSeeding() {
        try {
            // Comprobamos si la tabla de construcciones está vacía
            const count = await this.construction.count();
            if (count === 0) {
                this.logger.warn("⚠️ La base de datos parece estar vacía (sin construcciones). Ejecutando seed...");
                this.runSeed();
            } else {
                this.logger.log("✅ Datos base (seed) detectados.");
            }
        } catch (error) {
            this.logger.error("Error al comprobar el estado del seed:", error);
        }
    }

    private runSeed() {
        try {
            this.logger.log("Ejecutando 'npx tsx prisma/seed.ts'...");
            const output = execSync("npx tsx prisma/seed.ts", { stdio: ['pipe', 'pipe', 'pipe'] });
            this.logger.log("✅ Seed ejecutado con éxito.");
            this.logger.log(output.toString());
        } catch (error: any) {
            this.logger.error("Error crítico al ejecutar el seed.");
            this.logger.error(error.stderr?.toString() || error.message);
        }
    }

    private runMigrations() {
        try {
            this.logger.log("Ejecutando 'npx prisma migrate deploy'...");
            const output = execSync("npx prisma migrate deploy", { stdio: ['pipe', 'pipe', 'pipe'] });
            this.logger.log("✅ Migraciones aplicadas con éxito.");
            this.logger.log(output.toString());
        } catch (error: any) {
            const stderr = error.stderr?.toString() || error.message || "";
            this.logger.error("Error en migrate deploy detectado.");

            // CASO 1: Migración fallida (P3009)
            if (stderr.includes("P3009") || stderr.includes("found failed migrations")) {
                this.logger.warn("⚠️ Se detectó una migración fallida en el historial. Intentando resolver...");
                
                const match = stderr.match(/The `([^`]+)` migration/);
                if (match) {
                    const failedMigration = match[1];
                    this.logger.log(`Intentando marcar como resuelta (rolled-back): ${failedMigration}`);
                    try {
                        execSync(`npx prisma migrate resolve --rolled-back ${failedMigration}`, { stdio: 'inherit' });
                        this.logger.log("🔄 Migración resuelta. Reintentando deploy...");
                        execSync("npx prisma migrate deploy", { stdio: 'inherit' });
                        this.logger.log("✅ Reintento de deploy exitoso.");
                        return;
                    } catch {
                        this.logger.error("No se pudo resolver automáticamente la migración.");
                    }
                }
            }

            // CASO 2: Error general o resolución fallida -> Fallback a db push
            this.logger.warn("🚀 Intentando 'npx prisma db push' como último recurso para sincronizar la DB...");
            try {
                // --accept-data-loss es agresivo pero asegura que la DB coincida con el schema.prisma actual
                execSync("npx prisma db push --accept-data-loss", { stdio: 'inherit' });
                this.logger.log("✅ Base de datos sincronizada mediante 'db push'.");
            } catch (pushError: any) {
                this.logger.error("❌ ERROR CRÍTICO: Falló incluso el 'db push'. Revisa la conexión y permisos de la DB.");
                this.logger.error(pushError.message);
                process.exit(1);
            }
        }
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

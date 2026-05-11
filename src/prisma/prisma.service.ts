import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

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
                    } catch (resolveError) {
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
}

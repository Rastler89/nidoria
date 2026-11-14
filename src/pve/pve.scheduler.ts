import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PveService } from './pve.service';
import { PVE_SPAWN_CRON } from './pve.constants';

/**
 * Lanza apariciones de monstruos de forma aleatoria.
 *
 * Solo corre en el proceso de la API (`ENABLE_CRON=true`): el worker no debe
 * duplicar spawns. Además del cron, se ejecuta una vez al arrancar para que un
 * servidor recién levantado no se quede sin presas hasta el siguiente ciclo.
 */
@Injectable()
export class PveScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(PveScheduler.name);

  constructor(private readonly pveService: PveService) {}

  async onApplicationBootstrap() {
    if (!this.cronEnabled()) return;

    try {
      await this.pveService.ensureSpawns();
    } catch (error) {
      this.logger.error(`No se pudieron generar apariciones iniciales: ${error}`);
    }
  }

  @Cron(PVE_SPAWN_CRON)
  async handleSpawnCron() {
    if (!this.cronEnabled()) return;

    try {
      await this.pveService.ensureSpawns();
    } catch (error) {
      this.logger.error(`Falló el cron de apariciones de PvE: ${error}`);
    }
  }

  private cronEnabled(): boolean {
    return process.env.ENABLE_CRON === 'true';
  }
}

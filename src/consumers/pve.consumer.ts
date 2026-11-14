import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { PveService } from '../pve/pve.service';

/**
 * Resuelve los ataques PvE cuando termina el viaje. El job se encola con el
 * retardo del trayecto (`travelSeconds`), así que aquí ya toca combatir.
 */
@Processor('pve')
export class PveConsumer {
  private readonly logger = new Logger(PveConsumer.name);

  constructor(
    @InjectQueue('pve') private readonly queue: Queue,
    private readonly pveService: PveService,
  ) {}

  @Process('pve_attack')
  async handleAttack(job: Job<{ battleId: number }>) {
    const { battleId } = job.data;
    this.logger.log(`Resolviendo batalla PvE ${battleId}`);

    await this.pveService.resolveBattle(battleId);
  }
}

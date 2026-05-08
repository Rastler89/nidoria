import { InjectQueue } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { Queue } from "bullmq";

@Injectable()
export class AntConsumptionService {
  constructor (
    @InjectQueue('consumo') private antQueue: Queue,
  ) {}

  @Cron('*/10 * * * *')
  async handleCron() {
    /*console.log('Adding ant consumption job to the queue');
    await this.antQueue.add('calculate-consumption', {
        timestamp: Date.now(),
    });*/

    const jobId = `consumption-${Date.now()}`;
    // **Punto 1: Log de Ejecución del Cron**
    console.log(`[CRON] 🐜 Iniciando ejecución cron a las ${new Date().toLocaleTimeString('es-ES')}.`);
    
    // Añadimos el trabajo a la cola
    await this.antQueue.add('calculate-consumption', {
        timestamp: Date.now(),
    }, {
        jobId: jobId // Damos un ID único al trabajo para rastrearlo
    });

    // **Punto 2: Log de Puesta en Cola**
    console.log(`[CRON] ✅ Trabajo ${jobId} añadido a la cola 'consumo'.`);
  }
}

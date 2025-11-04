import { InjectQueue } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { Queue } from "bullmq";

@Injectable()
export class AntConsumptionService {
  constructor (
    @InjectQueue('consumo') private antQueue: Queue,
  ) {}

  @Cron('* * * * *')
  async handleCron() {
    console.log('Adding ant consumption job to the queue');
    await this.antQueue.add('callculate-consumption', {
        timestamp: Date.now(),
    });
  }
}
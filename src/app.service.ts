import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class AppService {
  constructor(
    @InjectQueue('cria') private cria: Queue
  ) { }
  getHello(): string {
    return 'Hello World!';
  }
}

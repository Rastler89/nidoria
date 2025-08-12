import { OnQueueActive, OnQueueCompleted, Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";

@Processor('queens')
export class QueenDataConsumer {
    @Process('queen_data')
    async processqueenData() {
        setTimeout(() => {
            console.log('Processing queen data...');
            
        }, 5000);
    }

    @OnQueueActive()
      onActive(job: Job<unknown>) {
        // Log that job is starting
        Logger.log(`Starting job ${job.id} : ${job.data['custom_id']}`);
      }
    
      @OnQueueCompleted()
      onCompleted(job: Job<unknown>) {
        // Log job completion status
        Logger.log(`Job ${job.id} has been finished`);
      }
}
import { Global, Module } from '@nestjs/common';
import { ColoniesService } from './colonies.services';

@Module({
  providers: [ColoniesService],
  exports: [ColoniesService],
})
export class ColoniesModule {}
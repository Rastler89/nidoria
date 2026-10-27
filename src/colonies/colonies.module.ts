import { Module } from '@nestjs/common';
import { ColoniesService } from './colonies.service';
import { BullModule } from '@nestjs/bull';
import { ResourcesModule } from '../resources/resources.module';

@Module({
  imports: [
    ResourcesModule,
    BullModule.registerQueue({
      name: 'cria',
    }),
  ],
  providers: [ColoniesService],
  exports: [ColoniesService],
})
export class ColoniesModule {}

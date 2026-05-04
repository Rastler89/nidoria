import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ArmyService } from './army.service';
import { ArmyController } from './army.controller';
import { ResourcesModule } from '../resources/resources.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'reclutamiento',
        }),
        ResourcesModule
    ],
    providers: [ArmyService],
    controllers: [ArmyController],
    exports: [ArmyService],
})
export class ArmyModule {}

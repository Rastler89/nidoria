import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { AntConsumptionService } from "./ant-consumption.service";



@Module({
    imports: [
        BullModule.registerQueue({
            name: 'consumo',
        })
    ],
    providers: [ AntConsumptionService ]
})
export class AntConsumptionModule {}
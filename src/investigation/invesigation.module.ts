import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { InvestigationService } from "./investigations.service";

@Module({
    imports: [
        BullModule.forRoot({
            redis: {
                host: '127.0.0.1',
                port: 6379,
            }
        }),
        BullModule.registerQueue({
            name: 'investigacion',
        })
    ],
    providers: [InvestigationService],
    exports: [InvestigationService]
})
export class InvestigationModule { }
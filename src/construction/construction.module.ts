import { Module } from "@nestjs/common";
import { ConstructionService } from "./construction.service";
import { BullModule } from "@nestjs/bull";

@Module({
    imports: [
        BullModule.forRoot({
            redis: {
                host: '127.0.0.1',
                port: 6379,
            },
        }),
        BullModule.registerQueue({
            name: 'construccion',
        })
    ],
    providers: [ConstructionService],
    exports: [ConstructionService]
})
export class ConstructionModule { }
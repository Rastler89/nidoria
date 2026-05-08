import { Module } from "@nestjs/common";
import { ConstructionService } from "./construction.service";
import { BullModule } from "@nestjs/bull";
import { ResourcesModule } from "src/resources/resources.module";

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'construccion',
        }),
        ResourcesModule
    ],
    providers: [ConstructionService],
    exports: [ConstructionService]
})
export class ConstructionModule { }

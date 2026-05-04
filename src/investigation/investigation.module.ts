import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { InvestigationService } from "./investigation.service";
import { ResourcesModule } from "src/resources/resources.module";

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'investigation',
        }),
        ResourcesModule
    ],
    providers: [InvestigationService],
    exports: [InvestigationService]
})
export class InvestigationModule { }
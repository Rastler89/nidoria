import { Module } from "@nestjs/common";
import { ResourcesService } from "./resources.service";
import { EngineModule } from "../engine/engine.module";

@Module({
    imports: [EngineModule],
    providers: [ ResourcesService ],
    exports: [ ResourcesService ],
})
export class ResourcesModule {}

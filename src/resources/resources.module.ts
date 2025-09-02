import { Module } from "@nestjs/common";
import { ResourcesService } from "./resources.services";

@Module({
    imports: [],
    providers: [ ResourcesService ],
    exports: [ ResourcesService ],
})
export class ResourcesModule {}
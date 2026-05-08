import { Module } from "@nestjs/common";
import { AnthillGateway } from "./anthill.gateway";
import { JwtModule } from "@nestjs/jwt";
import { jwtConstants } from "src/auth/constants";
import { BullModule } from "@nestjs/bull";
import { EngineModule } from "../engine/engine.module";

@Module({
    imports: [
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '1d' },
        }),
        BullModule.registerQueue({
            name: 'cria',
        }),
        EngineModule
    ],
    providers: [AnthillGateway],
    exports: [AnthillGateway],
})
export class GatewayModule { }

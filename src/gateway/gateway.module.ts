import { Module } from "@nestjs/common";
import { AnthillGateway } from "./stats.controller";
import { JwtModule } from "@nestjs/jwt";
import { jwtConstants } from "src/auth/constants";


@Module({
    imports: [
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '1d' },
        })
    ],
    providers: [AnthillGateway],
    exports: [AnthillGateway],
})
export class GatewayModule { }
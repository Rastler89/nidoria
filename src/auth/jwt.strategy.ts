import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { jwtConstants } from "./constants";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private prismaService: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        });
    }

    async validate(payload: any) {
        // Check if the user exists and is active
        const user = await this.prismaService.user.findUnique({
            where: { id: payload.sub },
            select: { isActive: true, email: true, role: true }
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException("El usuario no está activo o no existe.");
        }
        
        // Note: We return the data needed by subsequent parts of the application. 
        // We rely on the fact that if the user exists and is active, they are valid.
        return { 
            userId: payload.sub, 
            username: payload.username, 
            role: payload.role,
            isActive: user.isActive 
        };
    }
}

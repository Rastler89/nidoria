import { BadRequestException, Injectable } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class UsersService {
    constructor(private readonly prismaService: PrismaService) {}
    
    async user(
        userWhereUniqueInput: Prisma.UserWhereUniqueInput,
    ): Promise<User | null> {
        return this.prismaService.user.findUnique({
            where: userWhereUniqueInput,
        });
    }
    
    async findByUsernameOrEmail(usernameorEmail: string): Promise<User | null> {
        return this.prismaService.user.findFirst({
            where: {
                OR: [
                    { username: usernameorEmail },
                    { email: usernameorEmail }
                ]
            }
        })
    }
    
    async createUser(data: Prisma.UserCreateInput): Promise<User> {
        return this.prismaService.user.create({
            data,
        });
    }
    
    async verifyAccount(id, token) {
        const user = await this.prismaService.user.findUnique({
            where: {id},
        });
        
        if (!user) {
            throw new BadRequestException('El enlace de verificación no es válido o ha expirado');
        }
        
        if (user.token !== token) {
            throw new BadRequestException('El enlace de verificación no es válido o ha expirado');
        }
        
        await this.prismaService.user.update({
            where: {id},
            data: {
                verified: new Date(),
                token: 'verified'
                }
            })
            
        return 'ok';
    }

    async setRefreshToken(id: any, refresh_token: string) {
        await this.prismaService.user.update({
            where: {id},
            data: {
                refresh_token: refresh_token
                }
            })
    }

    async findRefresh(refresh: string): Promise<User | null> {
        return this.prismaService.user.findFirst({
            where: { refresh_token: refresh }
        });
    }
}        
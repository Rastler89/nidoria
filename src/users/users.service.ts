import { Injectable } from '@nestjs/common';
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

}

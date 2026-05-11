import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { ColoniesService } from '../colonies/colonies.service';
import { MailerService } from '../mail/mailer.service';
import * as crypto from 'crypto';

import { ConfigService } from '../config.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly coloniesService: ColoniesService,
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService
    ) { }

    async validateUser(username: string, password: string): Promise<any> {
        const user = await this.usersService.findByUsernameOrEmail(username);
        if (!user) {
            return null;
        }

        if (!user.verified) {
            return null;
        }

        const match = await bcrypt.compare(password, user.password);
        return match ? user : null;
    }

    async login(user: any) {
        const payload = { username: user.username, sub: user.id, role: user.role };

        return {
            access_token: this.jwtService.sign(payload, {
                expiresIn: '1h',
            }),
            refresh_token: await this.createRefreshToken(user),
            user: { id: user.id, username: user.username, email: user.email, role: user.role },
        }
    }

    async createRefreshToken(user: any) {
        const refresh_token = this.jwtService.sign({}, {
            expiresIn: '7d'
        });

        user.refresh_token = refresh_token;
        await this.usersService.setRefreshToken(user.id, refresh_token);
        return refresh_token;
    }

    async refreshAccessToken(refreshToken: string) {
        try {
            const decoded = this.jwtService.verify(refreshToken);
            const user = await this.usersService.findRefresh(refreshToken);

            if (!user) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const payload = { email: user.email, sub: user.id, role: user.role };
            return { access_token: this.jwtService.sign(payload) };
        } catch (e) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async preRegister(user: any) {
        const pre = await this.usersService.createPre({
            email: user.email
        });

        return pre;
    }

    async register(user: any) {
        var token = crypto.randomBytes(32).toString('hex');
        const existingUser = await this.usersService.findByUsernameOrEmail(user.username);
        if (existingUser) {
            return 'exist';
        }

        const hashedPassword = await bcrypt.hash(user.password, 10);

        const newUser = await this.usersService.createUser({
            username: user.username,
            email: user.email,
            password: hashedPassword,
            token: token
        });

        const userCount = await this.usersService.count();
        if (userCount <= 100) {
            await this.usersService.ensureTitleExists('Fundador', 'Uno de los primeros 100 usuarios en registrarse.');
            await this.usersService.assignTitle(newUser.id, 'Fundador');
        }

        let url = `${this.configService.appUrl}/verifyAccount/${newUser.id}/${token}`;

        await this.coloniesService.createColonyForUser(newUser.id);

        await this.mailerService.validationMail(
            user.email,
            url
        );

        return newUser;
    }

    async verifyAccount(id, token) {
        let status = await this.usersService.verifyAccount(id, token);
        let anthill;

        if (status == 'ok') {
            anthill = await this.coloniesService.initQueen(id);
        }

        return 'Thanks, your email is validated';
    }
}

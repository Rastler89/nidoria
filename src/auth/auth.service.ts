import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { ColoniesService } from '../colonies/colonies.service';
import { MailerService } from '../mail/mailer.service';
import * as crypto from 'crypto';

import { ConfigService } from '../config.service';
import { AppUrlHints, resolvePublicAppUrl } from '../config/public-url';

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

        // La reina se pausa si el usuario lleva 7 días sin actividad: sin esto,
        // cualquier usuario nuevo cuenta como inactivo y su colonia se congela.
        await this.usersService.updateLastLogin(user.id);

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
            this.jwtService.verify(refreshToken);
            const user = await this.usersService.findRefresh(refreshToken);

            if (!user) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const payload = { email: user.email, sub: user.id, role: user.role };
            return { access_token: this.jwtService.sign(payload) };
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async preRegister(user: any) {
        const pre = await this.usersService.createPre({
            email: user.email
        });

        return pre;
    }

    async register(user: any, urlHints: AppUrlHints = {}) {
        const username = typeof user?.username === 'string' ? user.username.trim() : '';
        const email = typeof user?.email === 'string' ? user.email.trim() : '';
        const password = typeof user?.password === 'string' ? user.password : '';

        const missingFields = [
            !username ? 'username' : null,
            !email ? 'email' : null,
            !password ? 'password' : null,
        ].filter((field): field is string => field !== null);

        if (missingFields.length > 0) {
            throw new BadRequestException({
                message: 'Faltan campos obligatorios para el registro.',
                details: `Campos requeridos: ${missingFields.join(', ')}.`,
            });
        }

        var token = crypto.randomBytes(32).toString('hex');
        const existingUser = await this.usersService.findByUsernameOrEmail(username);
        if (existingUser) {
            return 'exist';
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await this.usersService.createUser({
            username: username,
            email: email,
            password: hashedPassword,
            token: token
        });

        const userCount = await this.usersService.count();
        if (userCount <= 100) {
            await this.usersService.ensureTitleExists('Fundador', 'Uno de los primeros 100 usuarios en registrarse.');
            await this.usersService.assignTitle(newUser.id, 'Fundador');
        }

        // El enlace debe apuntar al frontend de este entorno, no a localhost:
        // se usa APP_URL si está bien configurada y, si no, el origen real de
        // la petición (el proxy de Next reenvía x-app-origin).
        const appUrl = resolvePublicAppUrl(this.configService.appUrl, urlHints);
        const url = `${appUrl}/verifyAccount/${newUser.id}/${token}`;

        await this.coloniesService.createColonyForUser(newUser.id);

        if (process.env.NODE_ENV === 'development') {
            // En local no se envían correos reales: el enlace queda en la consola de la API.
            console.log(`[Registro] Enlace de verificación para ${email}: ${url}`);
        } else {
            await this.mailerService.validationMail(
                email,
                url
            );
        }

        // No devolver nunca el hash de la contraseña ni el token de verificación.
        return {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt,
        };
    }

    async verifyAccount(id, token) {
        let status = await this.usersService.verifyAccount(id, token);
        if (status == 'ok') {
            await this.coloniesService.initQueen(id);
        }

        return 'Thanks, your email is validated';
    }
}

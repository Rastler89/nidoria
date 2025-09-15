import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { ColoniesService } from 'src/colonies/colonies.services';
import { MailerService } from 'src/mail/mailer.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly coloniesService: ColoniesService,
        private readonly mailerService: MailerService
    ) {}

    async validateUser(username: string, password: string): Promise<any> {
        const user = await this.usersService.findByUsernameOrEmail(username);
        const match = await bcrypt.compare(password, user.password);
        return match ? user : null;
    }

    async login(user: any) {
        const payload = { username: user.username, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload, {
                expiresIn: '1h',
            }),
            refresh_token: await this.createRefreshToken(user),
            user: { id: user.id, username: user.username, email: user.email},
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

            const payload = { email: user.email, sub: user.id };
            return { access_token: this.jwtService.sign(payload) };
        } catch (e) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async register(user: any) {
        var token = crypto.randomBytes(32).toString('hex');
        const existingUser = await this.usersService.findByUsernameOrEmail(user.username);
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(user.password, 10);
        const newUser = await this.usersService.createUser({
            username: user.username,
            email: user.email,
            password: hashedPassword, // In a real application, ensure to hash the password
            token: token
        });

        let url = 'https://localhost:3000/verifyAccount/'+newUser.id+'/'+token;
        
        await this.coloniesService.createColonyForUser(1);

        return await this.mailerService.validationMail(
            user.email,
            url
        )
    }

    async verifyAccount(id, token) { //Todo: falta debuggear porque hay un problema
        console.log('Iniciando validacion');
        let status = await this.usersService.verifyAccount(id,token);
        console.log('Finalizado validacion');

        let anthill;

        if (status == 'ok') {
            anthill = await this.coloniesService.initQueen(id);
        }

        console.log(anthill);

        return 'Thanks, your email is validated';
    }
}

import { Injectable } from '@nestjs/common';
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
        const payload = { username: user.username, sub: user.userId };
        return {
            access_token: this.jwtService.sign(payload),
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

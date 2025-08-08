import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';


@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
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
        console.log('Registering user:', user);
        const existingUser = await this.usersService.findByUsernameOrEmail(user.username);
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(user.password, 10);
        const newUser = await this.usersService.createUser({
            username: user.username,
            email: user.email,
            password: hashedPassword, // In a real application, ensure to hash the password
        });
        return newUser;
    }
}

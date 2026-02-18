import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { JwtStrategy } from './jwt.strategy';
import { ColoniesModule } from '../colonies/colonies.module';
import { MailerService } from '../mail/mailer.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    UsersModule,
    ColoniesModule,
    TelegramModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' }, // Token expiration time
    })
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, MailerService],
  exports: [AuthService],
})
export class AuthModule {}

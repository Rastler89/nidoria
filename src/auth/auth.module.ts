import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { JwtStrategy } from './jwt.strategy';
import { ColoniesModule } from 'src/colonies/colonies.module';
import { MailerService } from 'src/mail/mailer.service';

@Module({
  imports: [
    UsersModule,
    ColoniesModule,
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

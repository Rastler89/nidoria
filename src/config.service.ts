import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  get redisHost(): string {
    return this.configService.get<string>('REDIS_HOST', 'localhost');
  }

  get redisPort(): number {
    return this.configService.get<number>('REDIS_PORT', 6379);
  }

  get redisPassword(): string | undefined {
    return this.configService.get<string>('REDIS_PASSWORD');
  }

  get redisUser(): string | undefined {
    return this.configService.get<string>('REDIS_USER');
  }

  get mailHost(): string {
    return this.configService.get<string>('MAIL_HOST', 'sandbox.smtp.mailtrap.io');
  }

  get mailPort(): number {
    return this.configService.get<number>('MAIL_PORT', 2525);
  }

  get mailUser(): string {
    return this.configService.get<string>('MAIL_USER');
  }

  get mailPass(): string {
    return this.configService.get<string>('MAIL_PASS');
  }

  get mailFrom(): string {
    return this.configService.get<string>('MAIL_FROM', '"Nidoria Online" <no-reply@nidoria.com>');
  }

  get appUrl(): string {
    return this.configService.get<string>('APP_URL', 'http://localhost:3000');
  }
}

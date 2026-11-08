import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { isLocalUrl } from './config/public-url';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  constructor(private readonly configService: NestConfigService) {
    this.warnIfAppUrlIsUnusable();
  }

  private warnIfAppUrlIsUnusable(): void {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if (this.appUrl && !isLocalUrl(this.appUrl)) {
      return;
    }

    this.logger.warn(
      'APP_URL no está definida o apunta a localhost: los enlaces de verificación de email usarán el origen de la petición. Define APP_URL con el dominio público (por ejemplo https://nidoria.org).',
    );
  }

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

  /**
   * URL pública del frontend sin barra final. Puede ser undefined: en ese caso
   * el enlace se resuelve con el origen de la petición (ver public-url.ts).
   */
  get appUrl(): string | undefined {
    const raw = this.configService.get<string>('APP_URL')?.trim();

    return raw ? raw.replace(/\/+$/, '') : undefined;
  }
}

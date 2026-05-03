import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { MailerService } from '../src/mail/mailer.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const mailerService = app.get(MailerService);

    console.log('🐜 Preparando envío de prueba a Nidoria...');
    
    const testLink = 'http://localhost:3000/verify?id=123&token=test-token';
    
    try {
        await mailerService.validationMail('rastler89@gmail.com', testLink);
        console.log('✅ Correo enviado a Mailtrap. Revisa tu inbox de pruebas en https://mailtrap.io');
    } catch (error) {
        console.error('❌ Error al enviar:', error.message);
    } finally {
        await app.close();
    }
}

bootstrap();

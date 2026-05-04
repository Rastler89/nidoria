import { MailerService } from '../src/mail/mailer.service';

async function testEmail() {
    console.log('🐜 Iniciando motor de correo de Nidoria...');
    const mailerService = new MailerService();

    const testLink = 'http://localhost:3000/verify?id=123&token=test-token';
    const email = 'rastler89@gmail.com';

    try {
        await mailerService.validationMail(email, testLink);
        console.log('✅ ¡ÉXITO!');
        console.log(`📧 El correo ha sido enviado a: ${email}`);
        console.log('🔗 Revisa tu panel de Mailtrap en: https://mailtrap.io/inboxes');
    } catch (error) {
        console.error('❌ ERROR AL ENVIAR:', error.message);
    }
}

testEmail();

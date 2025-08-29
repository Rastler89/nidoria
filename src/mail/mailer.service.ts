import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';


@Injectable()
export class MailerService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'sandbox.smtp.mailtrap.io',
            port: 2525,
            auth:
                { 
                    user: 'e01d0fc17b6a45',
                    pass: '53c40bb4aadbb7',
                },
        });
    }

    async sendMail(to:string, subject: string, html: string) {
        return await this.transporter.sendMail({
            from: '"Mi app local" <no-reply@miapp.com>',
            to,
            subject,
            html
        });
    }

    async validationMail(to:string,verification:string) {
        const fs = require('fs').promises;
        const path = require('path');
        const templatePath = path.join(__dirname, '..', '..', 'src', 'mail', 'templates', 'verification.html');

        console.log(to);
        try {
            let htmlContent = await fs.readFile(templatePath, 'utf8');
            htmlContent = htmlContent.replace(/{{verification_link}}/g, verification);
            
            return await this.transporter.sendMail({
                from: '"Mi app local" <no-reply@miapp.com>',
                to,
                subject: '¡Bienvenido a la colonia! Confirma tu dirección de correo electrónico',
                html: htmlContent
            })
        } catch(error) {
            console.error('Error al enviar el correo: ',error);
            throw new Error('No se pudo enviar el correo de verificacion');
        }

    }
}
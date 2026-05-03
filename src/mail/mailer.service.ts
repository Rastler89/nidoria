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

    async sendMail(to: string, subject: string, html: string) {
        return await this.transporter.sendMail({
            from: '"Nidoria Online" <no-reply@nidoria.com>',
            to,
            subject,
            html
        });
    }

    async validationMail(to: string, verification: string) {
        const fs = require('fs').promises;
        const path = require('path');
        let htmlContent;
        const templatePath = path.join(process.cwd(), 'src', 'mail', 'templates', 'verification.html');
        // fallback for production if src doesn't exist
        try {
            await fs.access(templatePath);
        } catch {
            const prodPath = path.join(process.cwd(), 'dist', 'mail', 'templates', 'verification.html');
            htmlContent = await fs.readFile(prodPath, 'utf8');
        }

        try {
            if (!htmlContent) {
                htmlContent = await fs.readFile(templatePath, 'utf8');
            }
            htmlContent = htmlContent.replace(/{{verification_link}}/g, verification);

            return await this.transporter.sendMail({
                from: '"Nidoria Online" <no-reply@nidoria.com>',
                to,
                subject: '🐜 ¡Bienvenido a la colonia! Despierta a la Reina para comenzar',
                html: htmlContent
            })
        } catch (error) {
            console.error('Error al enviar el correo: ', error);
            throw new Error('No se pudo enviar el correo de verificacion');
        }

    }
}
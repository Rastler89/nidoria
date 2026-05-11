import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';


import { ConfigService } from '../config.service';

@Injectable()
export class MailerService {
    private transporter;

    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.mailHost,
            port: this.configService.mailPort,
            secure: this.configService.mailPort === 465, // true for 465, false for other ports
            auth: {
                user: this.configService.mailUser,
                pass: this.configService.mailPass,
            },
        });
    }

    async sendMail(to: string, subject: string, html: string) {
        return await this.transporter.sendMail({
            from: this.configService.mailFrom,
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
                from: this.configService.mailFrom,
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

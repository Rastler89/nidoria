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
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false
            }
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
        
        // Usamos __dirname para que funcione tanto en src como en dist
        const templatePath = path.join(__dirname, 'templates', 'verification.html');
        
        console.log(`[MailerService] Intentando enviar correo a: ${to}`);
        console.log(`[MailerService] Configuración: host=${this.configService.mailHost}, port=${this.configService.mailPort}, user=${this.configService.mailUser}`);

        let htmlContent;
        try {
            htmlContent = await fs.readFile(templatePath, 'utf8');
        } catch (readError) {
            console.error(`[MailerService] Error al leer la plantilla en ${templatePath}:`, readError.message);
            // Intento de fallback si por alguna razón la estructura es distinta
            try {
                const fallbackPath = path.join(process.cwd(), 'dist', 'mail', 'templates', 'verification.html');
                htmlContent = await fs.readFile(fallbackPath, 'utf8');
            } catch (fallbackError) {
                throw new Error(`No se pudo encontrar la plantilla de correo en ninguna ubicación.`);
            }
        }

        try {
            htmlContent = htmlContent.replace(/{{verification_link}}/g, verification);

            const info = await this.transporter.sendMail({
                from: this.configService.mailFrom,
                to,
                subject: '🐜 ¡Bienvenido a la colonia! Despierta a la Reina para comenzar',
                html: htmlContent
            });
            
            console.log(`[MailerService] Correo enviado con éxito: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error('[MailerService] ERROR DETALLADO:', error);
            throw new Error(`Error de SMTP: ${error.message}`);
        }
    }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMessage(message: string): Promise<void> {
    const token = this.configService.telegramBotToken;
    const chatId = this.configService.telegramChatId;

    if (!token || !chatId) {
      this.logger.warn('Telegram bot token or chat ID not configured. Notification not sent.');
      return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = {
      chat_id: chatId,
      text: message,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to send Telegram message: ${errorText}`);
      } else {
        this.logger.log('Telegram message sent successfully.');
      }
    } catch (error) {
      this.logger.error('Error sending Telegram message:', error);
    }
  }
}

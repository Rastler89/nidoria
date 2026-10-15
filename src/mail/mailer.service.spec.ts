import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from './mailer.service';
import { ConfigService } from '../config.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailerService', () => {
  let service: MailerService;

  const mockSendMail = jest.fn().mockResolvedValue(true);

  // El servicio ahora lee la config de correo del ConfigService (env vars)
  const mockConfigService = {
    mailHost: 'localhost',
    mailPort: 2525,
    mailUser: 'user',
    mailPass: 'pass',
    mailFrom: '"Nidoria Online" <no-reply@nidoria.com>',
  };

  beforeEach(async () => {
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
        sendMail: mockSendMail,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailerService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<MailerService>(MailerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validationMail', () => {
    it('should send a validation email', async () => {
      const to = 'test@example.com';
      const verificationLink = 'http://localhost/verify';

      await service.validationMail(to, verificationLink);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to,
          subject: '🐜 ¡Bienvenido a la colonia! Despierta a la Reina para comenzar',
        }),
      );
    });
  });
});

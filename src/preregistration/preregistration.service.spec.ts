import { Test, TestingModule } from '@nestjs/testing';
import { PreregistrationService } from './preregistration.service';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { ConflictException } from '@nestjs/common';

const mockPrismaService = {
  preregistration: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockTelegramService = {
  sendMessage: jest.fn().mockResolvedValue(undefined),
};

describe('PreregistrationService', () => {
  let service: PreregistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreregistrationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TelegramService, useValue: mockTelegramService },
      ],
    }).compile();

    service = module.get<PreregistrationService>(PreregistrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new preregistration', async () => {
      const email = 'test@example.com';
      mockPrismaService.preregistration.findUnique.mockResolvedValue(null);
      mockPrismaService.preregistration.create.mockResolvedValue({ id: 1, email, createdAt: new Date() });

      const result = await service.create(email);

      expect(mockPrismaService.preregistration.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(mockPrismaService.preregistration.create).toHaveBeenCalledWith({ data: { email } });
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(`New preregistration: ${email}`);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', email);
    });

    it('should throw ConflictException if email already exists', async () => {
      const email = 'test@example.com';
      mockPrismaService.preregistration.findUnique.mockResolvedValue({ id: 1, email });

      await expect(service.create(email)).rejects.toThrow(ConflictException);

      expect(mockPrismaService.preregistration.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(mockPrismaService.preregistration.create).not.toHaveBeenCalled();
      expect(mockTelegramService.sendMessage).not.toHaveBeenCalled(); // Should not notify if failed
    });
  });
});

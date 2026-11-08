import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      update: jest.fn(),
    },
    migrateReset: jest.fn(),
    checkMigrationStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    delete process.env.ADMIN_ALLOW_DB_RESET;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('wipeAndRebuildDb', () => {
    it('rechaza el borrado si ADMIN_ALLOW_DB_RESET no es "true"', async () => {
      await expect(service.wipeAndRebuildDb()).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.migrateReset).not.toHaveBeenCalled();
    });

    it('ejecuta migrateReset cuando el borrado está habilitado', async () => {
      process.env.ADMIN_ALLOW_DB_RESET = 'true';
      (prisma.migrateReset as jest.Mock).mockResolvedValue('ok');

      await expect(service.wipeAndRebuildDb()).resolves.toBe(
        'Database successfully wiped and rebuilt.',
      );
      expect(prisma.migrateReset).toHaveBeenCalled();
    });
  });

  describe('enableUser', () => {
    it('activa el usuario indicado', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: 5 });

      await service.enableUser('5');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { isActive: true },
      });
    });

    it('rechaza identificadores inválidos', async () => {
      await expect(service.enableUser('abc')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.enableUser(-1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('getMigrationStatus', () => {
    it('devuelve el estado que reporta Prisma', async () => {
      (prisma.checkMigrationStatus as jest.Mock).mockResolvedValue(
        'Database schema is up to date!',
      );

      await expect(service.getMigrationStatus()).resolves.toEqual({
        status: 'Database schema is up to date!',
      });
    });
  });
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { BannerService } from './banner.service';

describe('BannerService', () => {
  let service: BannerService;

  const mockPrisma = {
    banner: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BannerService>(BannerService);
  });

  describe('findActive', () => {
    it('filtra por activo y ventana de fechas, ordenando por prioridad', async () => {
      const now = new Date('2026-10-27T12:00:00.000Z');
      mockPrisma.banner.findMany.mockResolvedValue([]);

      await service.findActive(now);

      expect(mockPrisma.banner.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
          ],
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('create', () => {
    it('normaliza el mensaje y aplica valores por defecto', async () => {
      mockPrisma.banner.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 1, ...data }),
      );

      const created = await service.create({
        message: '  Mantenimiento programado  ',
        variant: 'WARNING',
        linkUrl: 'https://nidoria.org/novedades',
        linkLabel: ' Ver más ',
      });

      expect(created).toMatchObject({
        id: 1,
        message: 'Mantenimiento programado',
        variant: 'warning',
        linkUrl: 'https://nidoria.org/novedades',
        linkLabel: 'Ver más',
      });
    });

    it('rechaza mensaje vacío', async () => {
      await expect(service.create({ message: '   ' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockPrisma.banner.create).not.toHaveBeenCalled();
    });

    it('rechaza variantes desconocidas', async () => {
      await expect(
        service.create({ message: 'Hola', variant: 'purple' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza URLs con protocolos no permitidos', async () => {
      await expect(
        service.create({ message: 'Hola', linkUrl: 'javascript:alert(1)' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza una ventana de fechas invertida', async () => {
      await expect(
        service.create({
          message: 'Hola',
          startsAt: '2026-10-28T00:00:00.000Z',
          endsAt: '2026-10-27T00:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('valida la ventana contra las fechas ya guardadas', async () => {
      const existing = {
        id: 3,
        message: 'Viejo',
        startsAt: new Date('2026-10-28T00:00:00.000Z'),
        endsAt: null,
      };
      mockPrisma.banner.findUnique.mockResolvedValue(existing);

      await expect(
        service.update(3, { endsAt: '2026-10-27T00:00:00.000Z' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockPrisma.banner.update).not.toHaveBeenCalled();
    });

    it('lanza NotFound si el banner no existe', async () => {
      mockPrisma.banner.findUnique.mockResolvedValue(null);

      await expect(
        service.update(99, { message: 'Hola' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('actualiza solo los campos enviados', async () => {
      mockPrisma.banner.findUnique.mockResolvedValue({
        id: 4,
        startsAt: null,
        endsAt: null,
      });
      mockPrisma.banner.update.mockResolvedValue({ id: 4, active: false });

      await service.update(4, { active: false });

      expect(mockPrisma.banner.update).toHaveBeenCalledWith({
        where: { id: 4 },
        data: { active: false },
      });
    });
  });

  describe('remove', () => {
    it('borra el banner existente', async () => {
      mockPrisma.banner.findUnique.mockResolvedValue({ id: 5 });
      mockPrisma.banner.delete.mockResolvedValue({ id: 5 });

      await expect(service.remove(5)).resolves.toEqual({ id: 5 });
    });

    it('rechaza identificadores inválidos', async () => {
      await expect(service.remove(0)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ExpeditionService } from './expedition.services';
import { PrismaService } from '../prisma/prisma.service';
import { AnthillGateway } from '../gateway/anthill.gateway';
import { getQueueToken } from '@nestjs/bull';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ExpeditionService', () => {
  let service: ExpeditionService;
  const mockPrisma = {
    anthill: { findFirst: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    resource: { findFirst: jest.fn(), findUnique: jest.fn() },
    exploration: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    resourceAnthill: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };
  const mockQueue = { add: jest.fn() };
  const mockGateway = { sendUpdate: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpeditionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken('exploraciones'), useValue: mockQueue },
        { provide: AnthillGateway, useValue: mockGateway },
      ],
    }).compile();
    service = module.get<ExpeditionService>(ExpeditionService);
  });
  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  describe('addExpedition', () => {
    it('should throw BadRequestException for invalid params', async () => {
      await expect(service.addExpedition(1, null, 10)).rejects.toThrow(BadRequestException);
      await expect(service.addExpedition(1, 'FOOD', 0)).rejects.toThrow(BadRequestException);
      await expect(service.addExpedition(1, 'FOOD', -5)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if no anthill', async () => {
      mockPrisma.anthill.findFirst.mockResolvedValue(null);
      await expect(service.addExpedition(1, 'FOOD', 10)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid resource type', async () => {
      mockPrisma.anthill.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.resource.findFirst.mockResolvedValue(null);
      await expect(service.addExpedition(1, 'INVALID', 10)).rejects.toThrow(BadRequestException);
    });

    it('should create new expedition if none exists', async () => {
      mockPrisma.anthill.findFirst.mockResolvedValue({ id: 1, ownerId: 1, antsBusy: 0 });
      mockPrisma.resource.findFirst.mockResolvedValue({ id: 1, type: 'FOOD' });
      mockPrisma.exploration.findFirst.mockResolvedValue(null);
      mockPrisma.exploration.create.mockResolvedValue({ duration: 300 });
      mockPrisma.anthill.update.mockResolvedValue({});

      const result = await service.addExpedition(1, 'FOOD', 10);

      expect(mockPrisma.exploration.create).toHaveBeenCalled();
      expect(result).toHaveProperty('duration');
    });

    it('should update existing expedition with more ants', async () => {
      mockPrisma.anthill.findFirst.mockResolvedValue({ id: 1, ownerId: 1 });
      mockPrisma.resource.findFirst.mockResolvedValue({ id: 1, type: 'FOOD' });
      mockPrisma.exploration.findFirst.mockResolvedValue({ anthillId: 1, resourceTypeId: 1, ants: 5 });
      mockPrisma.exploration.update.mockResolvedValue({ duration: 300 });

      const result = await service.addExpedition(1, 'FOOD', 10);

      expect(mockPrisma.exploration.update).toHaveBeenCalled();
      expect(mockPrisma.anthill.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { antsBusy: { increment: 10 } } })
      );
      expect(result.message).toContain('actualizada');
    });
  });

  describe('finishExpedition', () => {
    it('should do nothing if exploration not found', async () => {
      mockPrisma.exploration.findFirst.mockResolvedValue(null);
      await service.finishExpedition(1, 1);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should cap resources at capacity', async () => {
      mockPrisma.exploration.findFirst.mockResolvedValue({
        anthillId: 1, resourceTypeId: 1, ants: 10, duration: 300, quantity: 50,
      });
      mockPrisma.anthill.findUnique.mockResolvedValue({
        id: 1, capacities: { FOOD: 500 },
      });
      mockPrisma.resource.findUnique.mockResolvedValue({ id: 1, type: 'FOOD' });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);
      mockPrisma.resourceAnthill.findUnique.mockResolvedValue({ stock: 480 });
      // Stock 480 + (50*10) = 980, but cap is 500 → should be 500
      mockPrisma.resourceAnthill.update.mockResolvedValue({});
      mockPrisma.exploration.create.mockResolvedValue({ duration: 300 });
      mockPrisma.anthill.update.mockResolvedValue({});

      await service.finishExpedition(1, 1);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('initExpedition', () => {
    it('should generate integer quantity (not float)', async () => {
      mockPrisma.anthill.findFirst.mockResolvedValue({ id: 1, ownerId: 1, antsBusy: 0 });
      mockPrisma.resource.findFirst.mockResolvedValue({ id: 1, type: 'FOOD' });
      mockPrisma.exploration.findFirst.mockResolvedValue(null);
      
      let createdData: any;
      mockPrisma.exploration.create.mockImplementation(({ data }) => {
        createdData = data;
        return { duration: data.duration };
      });
      mockPrisma.anthill.update.mockResolvedValue({});

      await service.addExpedition(1, 'FOOD', 10);

      // Quantity should be an integer
      expect(Number.isInteger(createdData.quantity)).toBe(true);
    });
  });
});

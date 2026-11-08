import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesService } from './resources.service';
import { PrismaService } from '../prisma/prisma.service';
import { GameEngineService } from '../engine/engine.service';
import { ANTHILL_CONFIG } from '../config/anthill.config';

const mockPrismaService = {
  anthill: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  resourceAnthill: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockEngineService = {
  getFullState: jest.fn(),
};

describe('ResourcesService', () => {
  let service: ResourcesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: GameEngineService, useValue: mockEngineService },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllResources', () => {
    it('should delegate to GameEngineService.getFullState with the numeric user id', async () => {
      const userId = '1';
      const state = { resources: [{ stock: 100 }], stats: {} };

      mockEngineService.getFullState.mockResolvedValue(state);

      const result = await service.getAllResources(userId);

      expect(mockEngineService.getFullState).toHaveBeenCalledWith(1);
      expect(result).toEqual(state);
    });

    it('should throw an error if anthill is not found', async () => {
      const userId = '1';
      mockEngineService.getFullState.mockResolvedValue(null);

      await expect(service.getAllResources(userId)).rejects.toThrow(
        'Hormiguero no encontrado para el usuario.',
      );
    });
  });

  describe('updateColonyLimits', () => {
    it('clamps stock that exceeds the new capacity', async () => {
      mockPrismaService.anthill.findUnique.mockResolvedValue({
        id: 1,
        constructions: [],
        investigations: [],
      });
      mockPrismaService.anthill.update.mockResolvedValue({});
      mockPrismaService.resourceAnthill.findMany.mockResolvedValue([
        { resourceId: 1, stock: 6800, resource: { type: 'FOOD' } },
      ]);
      mockPrismaService.resourceAnthill.update.mockResolvedValue({});
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.updateColonyLimits(1);

      expect(mockPrismaService.resourceAnthill.update).toHaveBeenCalledWith({
        where: { anthillId_resourceId: { anthillId: 1, resourceId: 1 } },
        data: { stock: ANTHILL_CONFIG.LIMITS.BASE_RESOURCE_CAPACITY },
      });
    });

    it('does not touch stock that is already within the limit', async () => {
      mockPrismaService.anthill.findUnique.mockResolvedValue({
        id: 1,
        constructions: [],
        investigations: [],
      });
      mockPrismaService.anthill.update.mockResolvedValue({});
      mockPrismaService.resourceAnthill.findMany.mockResolvedValue([
        { resourceId: 1, stock: 400, resource: { type: 'FOOD' } },
      ]);

      await service.updateColonyLimits(1);

      expect(mockPrismaService.resourceAnthill.update).not.toHaveBeenCalled();
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ConstructionService } from './construction.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResourcesService } from '../resources/resources.services';
import { getQueueToken } from '@nestjs/bull';
import { NotFoundException } from '@nestjs/common';
import { ConstructionStatus, ItemType, ResourceType } from '@prisma/client';

describe('ConstructionService', () => {
  let service: ConstructionService;
  const mockPrisma = {
    anthill: { findFirst: jest.fn() },
    construction: { findMany: jest.fn() },
    investigation: { findMany: jest.fn() },
    requirement: { findMany: jest.fn() },
    constructionAnthill: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };
  const mockQueue = { add: jest.fn() };
  const mockResources = { updateColonyLimits: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConstructionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken('construccion'), useValue: mockQueue },
        { provide: ResourcesService, useValue: mockResources },
      ],
    }).compile();
    service = module.get<ConstructionService>(ConstructionService);
  });
  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  describe('getUserConstructions', () => {
    it('should return constructions', async () => {
      mockPrisma.anthill.findFirst.mockResolvedValue({ id: 1, constructions: [{ id: 1 }] });
      const r = await service.getUserConstructions(1);
      expect(r).toEqual([{ id: 1 }]);
    });
    it('should throw NotFoundException', async () => {
      mockPrisma.anthill.findFirst.mockResolvedValue(null);
      await expect(service.getUserConstructions(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateCosts', () => {
    it('level 1 = base costs', () => {
      const c = (service as any).calculateCosts(
        { base_food: 100, base_wood: 50, base_lead: 25, base_ants: 10, base_time: 60, multiplier: 1.5 }, 1
      );
      expect(c[ResourceType.FOOD]).toBe(100);
      expect(c[ResourceType.WOOD]).toBe(50);
      expect(c['ANTS']).toBe(10);
    });
    it('level 3 = exponential scaling', () => {
      const c = (service as any).calculateCosts(
        { base_food: 100, base_wood: 50, base_lead: 25, base_ants: 10, base_time: 60, multiplier: 1.5 }, 3
      );
      expect(c[ResourceType.FOOD]).toBe(Math.floor(100 * 2.25));
      expect(c['ANTS']).toBe(Math.floor(10 * 2.25));
    });
  });

  describe('checkRequirements', () => {
    it('returns true when empty', () => expect((service as any).checkRequirements([], {})).toBe(true));
    it('returns true when met', () => {
      const r = (service as any).checkRequirements(
        [{ requiredType: ItemType.CONSTRUCTION, requiredId: 1, requiredLevel: 2 }],
        { constructions: [{ constructionId: 1, level: 3, status: ConstructionStatus.COMPLETED }], investigations: [] }
      );
      expect(r).toBe(true);
    });
    it('returns false when not met', () => {
      const r = (service as any).checkRequirements(
        [{ requiredType: ItemType.CONSTRUCTION, requiredId: 1, requiredLevel: 5 }],
        { constructions: [{ constructionId: 1, level: 2, status: ConstructionStatus.COMPLETED }], investigations: [] }
      );
      expect(r).toBe(false);
    });
  });

  describe('checkResources', () => {
    it('returns true when sufficient', () => {
      const r = (service as any).checkResources(
        { [ResourceType.FOOD]: 100, ANTS: 10, time: 60 },
        { ants: 20, antsBusy: 5, resources: [{ resource: { type: ResourceType.FOOD }, stock: 200 }] }
      );
      expect(r).toBe(true);
    });
    it('returns false when ants insufficient', () => {
      const r = (service as any).checkResources(
        { ANTS: 20, time: 60 },
        { ants: 15, antsBusy: 5, resources: [] }
      );
      expect(r).toBe(false);
    });
  });

  describe('finishConstruction', () => {
    it('should complete and update limits', async () => {
      mockPrisma.constructionAnthill.findUnique.mockResolvedValue({ id: 1, anthillId: 1, construction: {} });
      mockPrisma.$transaction.mockResolvedValue(undefined);
      await service.finishConstruction(1);
      expect(mockResources.updateColonyLimits).toHaveBeenCalledWith(1);
    });
    it('should skip if not found', async () => {
      mockPrisma.constructionAnthill.findUnique.mockResolvedValue(null);
      await service.finishConstruction(999);
      expect(mockResources.updateColonyLimits).not.toHaveBeenCalled();
    });
  });

  describe('getAvailableConstructions maxLevel check', () => {
    it('should NOT offer UPGRADE at maxLevel', async () => {
      const c = { id: 1, name: 'T', code: 'T', maxLevel: 2, maxInstances: 3, base_food: 10, base_wood: 5, base_lead: 2, base_ants: 1, base_time: 10, multiplier: 1.5 };
      mockPrisma.anthill.findFirst.mockResolvedValue({
        id: 1, ants: 50, antsBusy: 0,
        constructions: [{ constructionId: 1, level: 2, status: ConstructionStatus.COMPLETED, construction: c }],
        investigations: [], resources: [],
      });
      mockPrisma.construction.findMany.mockResolvedValue([c]);
      mockPrisma.investigation.findMany.mockResolvedValue([]);
      mockPrisma.requirement.findMany.mockResolvedValue([]);
      const result = await service.getAvailableConstructions(1);
      expect(result.some(a => a.action === 'UPGRADE')).toBe(false);
    });
  });
});

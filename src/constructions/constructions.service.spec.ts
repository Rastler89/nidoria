import { Test, TestingModule } from '@nestjs/testing';
import { ConstructionsService } from './constructions.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bull';
import { ConstructionStatus, ItemType, ResourceType } from '@prisma/client';

describe('ConstructionsService', () => {
  let service: ConstructionsService;
  let prisma: PrismaService;
  let queue: any;

  const mockPrisma = {
    anthill: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    construction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    requirement: {
      findMany: jest.fn(),
    },
    resourceAnthill: {
      update: jest.fn(),
    },
    constructionAnthill: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((val) => {
      if (typeof val === 'function') {
        return val(mockPrisma);
      }
      return Promise.all(val);
    }),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConstructionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken('construccion'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<ConstructionsService>(ConstructionsService);
    prisma = module.get<PrismaService>(PrismaService);
    queue = module.get(getQueueToken('construccion'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserConstructions', () => {
    it('should return user constructions', async () => {
      mockPrisma.anthill.findFirst.mockResolvedValue({
        constructions: [{ id: 1, level: 1, status: 'COMPLETED' }],
      });

      const result = await service.getUserConstructions(1);
      expect(result).toHaveLength(1);
      expect(mockPrisma.anthill.findFirst).toHaveBeenCalled();
    });
  });

  describe('startConstruction', () => {
      it('should start a new construction', async () => {
          const mockAnthill = {
              id: 1,
              ants: 100,
              antsBusy: 0,
              constructions: [],
              resources: [
                  { resource: { type: ResourceType.FOOD }, stock: 1000, resourceId: 1 },
                  { resource: { type: ResourceType.WOOD }, stock: 1000, resourceId: 2 },
                  { resource: { type: ResourceType.LEAD }, stock: 1000, resourceId: 3 },
              ]
          };
          const mockConst = {
              id: 1,
              base_food: 100,
              base_wood: 100,
              base_lead: 100,
              base_time: 60,
              base_ants: 10,
              multiplier: 1.5,
              maxInstances: 1
          };

          mockPrisma.anthill.findFirst.mockResolvedValue(mockAnthill);
          mockPrisma.construction.findUnique.mockResolvedValue(mockConst);
          mockPrisma.requirement.findMany.mockResolvedValue([]);
          mockPrisma.constructionAnthill.create.mockResolvedValue({ id: 10 });

          const result = await service.startConstruction(1, 1);

          expect(result.message).toBe('Construcción iniciada');
          expect(mockPrisma.constructionAnthill.create).toHaveBeenCalled();
          expect(mockQueue.add).toHaveBeenCalled();
      });

      it('should throw error if not enough resources', async () => {
          const mockAnthill = {
              id: 1,
              ants: 100,
              antsBusy: 0,
              constructions: [],
              resources: [
                  { resource: { type: ResourceType.FOOD }, stock: 10, resourceId: 1 },
              ]
          };
          const mockConst = {
              id: 1,
              base_food: 100,
              base_wood: 0,
              base_lead: 0,
              base_time: 60,
              base_ants: 10,
              multiplier: 1.5,
              maxInstances: 1
          };

          mockPrisma.anthill.findFirst.mockResolvedValue(mockAnthill);
          mockPrisma.construction.findUnique.mockResolvedValue(mockConst);
          mockPrisma.requirement.findMany.mockResolvedValue([]);

          await expect(service.startConstruction(1, 1)).rejects.toThrow('Recursos insuficientes');
      });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AntConsumptionProcessor } from './ant-consumption.processor';
import { PrismaService } from '../prisma/prisma.service';
import { Job } from 'bullmq';
import { ResourceType } from '@prisma/client';

describe('AntConsumptionProcessor', () => {
  let processor: AntConsumptionProcessor;

  const mockPrisma = {
    anthill: { findMany: jest.fn() },
    resource: { findFirst: jest.fn() },
    resourceAnthill: { findFirst: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AntConsumptionProcessor,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    processor = module.get<AntConsumptionProcessor>(AntConsumptionProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('handleCalculateConsumption', () => {
    const mockJob = { id: 'test-job', data: { timestamp: Date.now() } } as unknown as Job;

    it('should calculate consumption for all anthills', async () => {
      const food = { id: 1, type: ResourceType.FOOD };
      const anthills = [
        { id: 1, ants: 10, antsTotal: [{ total: 5 }] },
        { id: 2, ants: 20, antsTotal: [] },
      ];

      mockPrisma.resource.findFirst.mockResolvedValue(food);
      mockPrisma.anthill.findMany.mockResolvedValue(anthills);
      // Each $transaction call runs the callback immediately
      mockPrisma.$transaction.mockImplementation(async (cb) => {
        if (typeof cb === 'function') {
          return cb({
            resourceAnthill: {
              findFirst: jest.fn().mockResolvedValue({ stock: 500 }),
              update: jest.fn(),
            },
          });
        }
      });

      await processor.handleCalculateConsumption(mockJob);

      expect(mockPrisma.resource.findFirst).toHaveBeenCalledWith({
        where: { type: ResourceType.FOOD },
      });
      expect(mockPrisma.anthill.findMany).toHaveBeenCalled();
      // Should process both anthills
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
    });

    it('should handle anthill with sufficient food — uses decrement', async () => {
      const food = { id: 1, type: ResourceType.FOOD };
      const anthills = [{ id: 1, ants: 10, antsTotal: [] }];
      const mockUpdate = jest.fn();

      mockPrisma.resource.findFirst.mockResolvedValue(food);
      mockPrisma.anthill.findMany.mockResolvedValue(anthills);
      mockPrisma.$transaction.mockImplementation(async (cb) => {
        if (typeof cb === 'function') {
          return cb({
            resourceAnthill: {
              findFirst: jest.fn().mockResolvedValue({ stock: 500 }),
              update: mockUpdate,
            },
          });
        }
      });

      await processor.handleCalculateConsumption(mockJob);

      // Civil consumption = 10 * 1 = 10
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { stock: { decrement: 10 } },
        }),
      );
    });

    it('should set stock to 0 when food is insufficient', async () => {
      const food = { id: 1, type: ResourceType.FOOD };
      const anthills = [{ id: 1, ants: 100, antsTotal: [] }];
      const mockUpdate = jest.fn();

      mockPrisma.resource.findFirst.mockResolvedValue(food);
      mockPrisma.anthill.findMany.mockResolvedValue(anthills);
      mockPrisma.$transaction.mockImplementation(async (cb) => {
        if (typeof cb === 'function') {
          return cb({
            resourceAnthill: {
              findFirst: jest.fn().mockResolvedValue({ stock: 5 }), // Only 5 food, needs 100
              update: mockUpdate,
            },
          });
        }
      });

      await processor.handleCalculateConsumption(mockJob);

      // Should set to 0 since stock (5) < consumption (100)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { stock: 0 },
        }),
      );
    });

    it('should calculate military consumption at 2x rate', async () => {
      const food = { id: 1, type: ResourceType.FOOD };
      const anthills = [{
        id: 1,
        ants: 5, // 5 civil ants * 1 = 5
        antsTotal: [{ total: 10 }, { total: 5 }], // (10+5) * 2 = 30
      }];
      const mockUpdate = jest.fn();

      mockPrisma.resource.findFirst.mockResolvedValue(food);
      mockPrisma.anthill.findMany.mockResolvedValue(anthills);
      mockPrisma.$transaction.mockImplementation(async (cb) => {
        if (typeof cb === 'function') {
          return cb({
            resourceAnthill: {
              findFirst: jest.fn().mockResolvedValue({ stock: 1000 }),
              update: mockUpdate,
            },
          });
        }
      });

      await processor.handleCalculateConsumption(mockJob);

      // Total: 5 (civil) + 30 (military) = 35
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { stock: { decrement: 35 } },
        }),
      );
    });

    it('should skip anthill if no food resource found', async () => {
      const food = { id: 1, type: ResourceType.FOOD };
      const anthills = [{ id: 1, ants: 10, antsTotal: [] }];

      mockPrisma.resource.findFirst.mockResolvedValue(food);
      mockPrisma.anthill.findMany.mockResolvedValue(anthills);
      mockPrisma.$transaction.mockImplementation(async (cb) => {
        if (typeof cb === 'function') {
          return cb({
            resourceAnthill: {
              findFirst: jest.fn().mockResolvedValue(null), // No food resource
              update: jest.fn(),
            },
          });
        }
      });

      // Should not throw
      await expect(processor.handleCalculateConsumption(mockJob)).resolves.not.toThrow();
    });
  });
});

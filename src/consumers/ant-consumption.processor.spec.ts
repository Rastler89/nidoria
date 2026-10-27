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

  // Simula la paginación: devuelve el primer lote y luego vacío para salir del while.
  function mockPaginatedAnthills(anthills: any[]) {
    mockPrisma.anthill.findMany
      .mockResolvedValueOnce(anthills)
      .mockResolvedValueOnce([]);
  }

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

    it('should process all anthills and stop when no more pages', async () => {
      const food = { id: 1, type: ResourceType.FOOD };
      const anthills = [
        { id: 1, ants: 10, antsTotal: [] },
        { id: 2, ants: 20, antsTotal: [] },
      ];

      mockPrisma.resource.findFirst.mockResolvedValue(food);
      mockPaginatedAnthills(anthills);
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
      // Dos hormigueros => dos transacciones
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
    });

    it('should set stock to the decremented value when there is enough food', async () => {
      const food = { id: 1, type: ResourceType.FOOD };
      const anthills = [{ id: 1, ants: 10, antsTotal: [] }];
      const mockUpdate = jest.fn();

      mockPrisma.resource.findFirst.mockResolvedValue(food);
      mockPaginatedAnthills(anthills);
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

      // Consumo civil = 10 * 1 = 10; stock nuevo = 500 - 10 = 490
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { stock: 490 },
        }),
      );
    });

    it('should clamp stock to 0 when food is insufficient', async () => {
      const food = { id: 1, type: ResourceType.FOOD };
      const anthills = [{ id: 1, ants: 100, antsTotal: [] }];
      const mockUpdate = jest.fn();

      mockPrisma.resource.findFirst.mockResolvedValue(food);
      mockPaginatedAnthills(anthills);
      mockPrisma.$transaction.mockImplementation(async (cb) => {
        if (typeof cb === 'function') {
          return cb({
            resourceAnthill: {
              findFirst: jest.fn().mockResolvedValue({ stock: 5 }), // Solo 5, necesita 100
              update: mockUpdate,
            },
          });
        }
      });

      await processor.handleCalculateConsumption(mockJob);

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
        ants: 5, // 5 hormigas civiles * 1 = 5
        antsTotal: [{ total: 10 }, { total: 5 }], // (10+5) * 2 = 30
      }];
      const mockUpdate = jest.fn();

      mockPrisma.resource.findFirst.mockResolvedValue(food);
      mockPaginatedAnthills(anthills);
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

      // Total: 5 (civil) + 30 (militar) = 35; stock nuevo = 1000 - 35 = 965
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { stock: 965 },
        }),
      );
    });

    it('should skip anthill if no food resource row is found', async () => {
      const food = { id: 1, type: ResourceType.FOOD };
      const anthills = [{ id: 1, ants: 10, antsTotal: [] }];
      const mockUpdate = jest.fn();

      mockPrisma.resource.findFirst.mockResolvedValue(food);
      mockPaginatedAnthills(anthills);
      mockPrisma.$transaction.mockImplementation(async (cb) => {
        if (typeof cb === 'function') {
          return cb({
            resourceAnthill: {
              findFirst: jest.fn().mockResolvedValue(null), // Sin fila de recurso
              update: mockUpdate,
            },
          });
        }
      });

      await processor.handleCalculateConsumption(mockJob);

      // No debe intentar actualizar
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});

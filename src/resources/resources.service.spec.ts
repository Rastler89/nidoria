import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesService } from './resources.service';
import { PrismaService } from '../prisma/prisma.service';
import { GameEngineService } from '../engine/engine.service';

const mockPrismaService = {
  anthill: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  resourceAnthill: {
    findMany: jest.fn(),
  },
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
});

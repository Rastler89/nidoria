import { Test, TestingModule } from '@nestjs/testing';
import { ColoniesService } from './colonies.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResourcesService } from '../resources/resources.service';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bullmq';

const mockPrismaService = {
  anthill: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  resource: {
    findFirst: jest.fn(),
  },
  resourceAnthill: {
    createMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  world: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockResourcesService = {
  updateColonyLimits: jest.fn(),
};

const mockQueue = {
  add: jest.fn(),
};

describe('ColoniesService', () => {
  let service: ColoniesService;
  let prisma: PrismaService;
  let queue: Queue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColoniesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ResourcesService, useValue: mockResourcesService },
        { provide: getQueueToken('cria'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<ColoniesService>(ColoniesService);
    prisma = module.get<PrismaService>(PrismaService);
    queue = module.get<Queue>(getQueueToken('cria'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createColonyForUser', () => {
    it('should create a colony for a user', async () => {
      const userId = 1;
      const anthill = { id: 1, ownerId: userId };
      const foodResource = { id: 1, type: 'F' };
      const woodResource = { id: 2, type: 'W' };
      const leafResource = { id: 3, type: 'L' };

      mockPrismaService.anthill.create.mockResolvedValue(anthill);
      mockPrismaService.resource.findFirst
        .mockResolvedValueOnce(foodResource)
        .mockResolvedValueOnce(woodResource)
        .mockResolvedValueOnce(leafResource);
      mockPrismaService.world.findFirst.mockResolvedValue({ id: 1, currentPlayers: 0 });
      mockPrismaService.resourceAnthill.createMany.mockResolvedValue({ count: 3 });

      await service.createColonyForUser(userId);

      expect(mockPrismaService.anthill.create).toHaveBeenCalled();
      expect(mockPrismaService.resourceAnthill.createMany).toHaveBeenCalled();
    });
  });

  describe('addEggToColony', () => {
    it('should add an egg to the colony if there is enough food', async () => {
      const userId = '1';
      const anthill = { id: 1, ownerId: 1 };
      const foodResource = { id: 1, type: 'F' };
      const resourceAnthill = { anthillId: 1, resourceId: 1, stock: 100 };

      mockPrismaService.anthill.findFirst.mockResolvedValue(anthill);
      mockPrismaService.resource.findFirst.mockResolvedValue(foodResource);
      mockPrismaService.resourceAnthill.findFirst.mockResolvedValue(resourceAnthill);

      const result = await service.addEggToColony(userId);

      expect(result).toBe(true);
      expect(mockPrismaService.resourceAnthill.update).toHaveBeenCalled();
      expect(mockPrismaService.anthill.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { eggs: { increment: 1 } },
        }),
      );
    });

    it('should not add an egg if there is not enough food', async () => {
      const userId = '1';
      const anthill = { id: 1, ownerId: 1 };
      const foodResource = { id: 1, type: 'F' };
      const resourceAnthill = { anthillId: 1, resourceId: 1, stock: 30 };

      mockPrismaService.anthill.findFirst.mockResolvedValue(anthill);
      mockPrismaService.resource.findFirst.mockResolvedValue(foodResource);
      mockPrismaService.resourceAnthill.findFirst.mockResolvedValue(resourceAnthill);

      const result = await service.addEggToColony(userId);

      expect(result).toBe(false);
      expect(mockPrismaService.resourceAnthill.update).not.toHaveBeenCalled();
      expect(mockPrismaService.anthill.update).not.toHaveBeenCalled();
    });
  });
});

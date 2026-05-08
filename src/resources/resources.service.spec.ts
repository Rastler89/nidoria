import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesService } from './resources.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  anthill: {
    findFirst: jest.fn(),
  },
  resourceAnthill: {
    findMany: jest.fn(),
  },
};

describe('ResourcesService', () => {
  let service: ResourcesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllResources', () => {
    it('should return all resources for a user', async () => {
      const userId = 1;
      const anthill = { 
        id: 1, 
        ownerId: userId, 
        eggs: 0, 
        larva: 0, 
        ants: 10, 
        antsBusy: 0,
        resources: [{ stock: 100, resource: { type: 'FOOD', name: 'Comida' } }],
        constructions: [],
        investigations: [],
        antsTotal: []
      };
      const resources = [{ resourceId: 1, stock: 100 }];

      mockPrismaService.anthill.findFirst.mockResolvedValue(anthill);
      mockPrismaService.resourceAnthill.findMany.mockResolvedValue(resources);

      const result = await service.getAllResources(userId);

      expect(result).toHaveProperty('resources');
      expect(result).toHaveProperty('stats');
      expect(result.resources).toEqual(expect.arrayContaining([
        expect.objectContaining({ stock: 100 })
      ]));
      expect(mockPrismaService.anthill.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: userId },
        })
      );
      expect(mockPrismaService.resourceAnthill.findMany).toHaveBeenCalledWith({
        where: { anthillId: anthill.id },
      });
    });

    it('should throw an error if anthill is not found', async () => {
        const userId = 1;
        mockPrismaService.anthill.findFirst.mockResolvedValue(null);

        await expect(service.getAllResources(userId)).rejects.toThrow(
          'Hormiguero no encontrado para el usuario.',
        );
      });
  });
});

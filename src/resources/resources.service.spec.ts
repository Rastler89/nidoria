import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesService } from './resources.services';
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
      const anthill = { id: 1, ownerId: userId };
      const resources = [{ resourceId: 1, stock: 100 }];

      mockPrismaService.anthill.findFirst.mockResolvedValue(anthill);
      mockPrismaService.resourceAnthill.findMany.mockResolvedValue(resources);

      const result = await service.getAllResources(userId);

      expect(result).toEqual(resources);
      expect(mockPrismaService.anthill.findFirst).toHaveBeenCalledWith({
        where: { ownerId: userId },
      });
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
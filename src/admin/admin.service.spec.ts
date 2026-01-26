import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bull';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    anthill: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    resourceAnthill: {
      update: jest.fn(),
    },
    antsAnthill: {
      update: jest.fn(),
    },
  };

  const mockQueue = {
    getJobCounts: jest.fn().mockResolvedValue({ completed: 0, failed: 0 }),
    clean: jest.fn(),
    empty: jest.fn(),
    getFailed: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: getQueueToken('cria'), useValue: mockQueue },
        { provide: getQueueToken('construccion'), useValue: mockQueue },
        { provide: getQueueToken('investigacion'), useValue: mockQueue },
        { provide: getQueueToken('ataques'), useValue: mockQueue },
        { provide: getQueueToken('exploraciones'), useValue: mockQueue },
        { provide: getQueueToken('consumo'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should call prisma.user.findMany', async () => {
      await service.getAllUsers();
      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
    });
  });

  describe('getQueuesStats', () => {
    it('should return stats for all queues', async () => {
      const stats = await service.getQueuesStats();
      expect(stats).toHaveProperty('cria');
      expect(stats).toHaveProperty('consumo');
      expect(mockQueue.getJobCounts).toHaveBeenCalled();
    });
  });
});

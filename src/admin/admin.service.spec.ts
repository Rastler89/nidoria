import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bull';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    anthill: {
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    resourceAnthill: { deleteMany: jest.fn() },
    antsAnthill: { deleteMany: jest.fn() },
    constructionAnthill: { deleteMany: jest.fn() },
    investigationAnthill: { deleteMany: jest.fn() },
    exploration: { deleteMany: jest.fn() },
    construction: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    investigation: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    ant: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    resource: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    requirement: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };

  const mockQueue = {
    getJobCounts: jest.fn().mockResolvedValue({ active: 0, waiting: 0, completed: 0, failed: 0 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
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

  it('getUsers should call prisma.user.findMany', async () => {
    await service.getUsers();
    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  it('getSummary should return counts', async () => {
    (prisma.user.count as jest.Mock).mockResolvedValue(10);
    (prisma.anthill.count as jest.Mock).mockResolvedValue(5);
    const summary = await service.getSummary();
    expect(summary.userCount).toBe(10);
    expect(summary.anthillCount).toBe(5);
  });

  it('getConstructions should call prisma.construction.findMany', async () => {
    await service.getConstructions();
    expect(prisma.construction.findMany).toHaveBeenCalled();
  });

  it('createAnt should call prisma.ant.create', async () => {
    const data = { name: 'Warrior' };
    await service.createAnt(data);
    expect(prisma.ant.create).toHaveBeenCalledWith({ data });
  });
});

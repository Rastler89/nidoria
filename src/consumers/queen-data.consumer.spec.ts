import { Test, TestingModule } from '@nestjs/testing';
import { QueenDataConsumer } from './queen-data.consumer';
import { ColoniesService } from '../colonies/colonies.services';
import { AnthillGateway } from '../gateway/stats.controller';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bull';
import { Job } from 'bull';
import { ResourceType } from '@prisma/client';

describe('QueenDataConsumer', () => {
  let consumer: QueenDataConsumer;

  const mockColoniesService = {
    addEggToColony: jest.fn(),
    getNewEggTimeInMinutes: jest.fn(),
    convertEggToLarva: jest.fn(),
    convertLarvaToAnt: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockAnthillGateway = {
    sendUpdate: jest.fn(),
  };

  const mockPrisma = {
    anthill: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueenDataConsumer,
        { provide: ColoniesService, useValue: mockColoniesService },
        { provide: getQueueToken('cria'), useValue: mockQueue },
        { provide: AnthillGateway, useValue: mockAnthillGateway },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    consumer = module.get<QueenDataConsumer>(QueenDataConsumer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  describe('processqueenData (new_egg)', () => {
    const createJob = (userId: string) => ({ data: { userId } } as Job<{ userId: string }>);

    it('should add egg and schedule next jobs when egg is created', async () => {
      mockPrisma.anthill.findFirst.mockResolvedValue({
        id: 1, ownerId: 1,
        owner: { lastLogin: new Date() },
        resources: [{ resource: { type: ResourceType.FOOD }, stock: 500 }],
      });
      mockColoniesService.addEggToColony.mockResolvedValue(true);
      mockColoniesService.getNewEggTimeInMinutes.mockResolvedValue(1);

      await consumer.processqueenData(createJob('1'));

      expect(mockColoniesService.addEggToColony).toHaveBeenCalledWith('1');
      expect(mockQueue.add).toHaveBeenCalledTimes(2); // new_egg + egg_to_larva
    });

    it('should schedule next egg but NOT egg_to_larva when egg fails', async () => {
      mockPrisma.anthill.findFirst.mockResolvedValue({
        id: 1, ownerId: 1,
        owner: { lastLogin: new Date() },
        resources: [{ resource: { type: ResourceType.FOOD }, stock: 500 }],
      });
      mockColoniesService.addEggToColony.mockResolvedValue(false);
      mockColoniesService.getNewEggTimeInMinutes.mockResolvedValue(1);

      await consumer.processqueenData(createJob('1'));

      expect(mockQueue.add).toHaveBeenCalledTimes(1); // Only new_egg
      expect(mockQueue.add).toHaveBeenCalledWith(
        'new_egg',
        expect.anything(),
        expect.objectContaining({ removeOnComplete: true }),
      );
    });

    it('should PAUSE colony if no food and user inactive 7+ days', async () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      mockPrisma.anthill.findFirst.mockResolvedValue({
        id: 1, ownerId: 1,
        owner: { lastLogin: eightDaysAgo },
        resources: [{ resource: { type: ResourceType.FOOD }, stock: 10 }],
      });

      await consumer.processqueenData(createJob('1'));

      expect(mockColoniesService.addEggToColony).not.toHaveBeenCalled();
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should NOT pause if no food but user is active', async () => {
      mockPrisma.anthill.findFirst.mockResolvedValue({
        id: 1, ownerId: 1,
        owner: { lastLogin: new Date() },
        resources: [{ resource: { type: ResourceType.FOOD }, stock: 10 }],
      });
      mockColoniesService.addEggToColony.mockResolvedValue(false);
      mockColoniesService.getNewEggTimeInMinutes.mockResolvedValue(1);

      await consumer.processqueenData(createJob('1'));

      expect(mockColoniesService.addEggToColony).toHaveBeenCalled();
    });

    it('should NOT pause if user inactive but has plenty of food', async () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      mockPrisma.anthill.findFirst.mockResolvedValue({
        id: 1, ownerId: 1,
        owner: { lastLogin: eightDaysAgo },
        resources: [{ resource: { type: ResourceType.FOOD }, stock: 500 }],
      });
      mockColoniesService.addEggToColony.mockResolvedValue(true);
      mockColoniesService.getNewEggTimeInMinutes.mockResolvedValue(1);

      await consumer.processqueenData(createJob('1'));

      expect(mockColoniesService.addEggToColony).toHaveBeenCalled();
    });
  });

  describe('processEggToLarva (egg_to_larva)', () => {
    it('should convert egg to larva and schedule larva_to_ant', async () => {
      const job = { data: { userId: '1' } } as Job<{ userId: string }>;
      mockColoniesService.convertEggToLarva.mockResolvedValue(true);

      await consumer.processEggToLarva(job);

      expect(mockColoniesService.convertEggToLarva).toHaveBeenCalledWith('1');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'larva_to_ant',
        { userId: '1' },
        expect.objectContaining({ delay: 2 * 60 * 1000 }),
      );
    });

    it('should NOT schedule larva_to_ant if conversion fails', async () => {
      const job = { data: { userId: '1' } } as Job<{ userId: string }>;
      mockColoniesService.convertEggToLarva.mockResolvedValue(false);

      await consumer.processEggToLarva(job);

      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('processLarvaToAnt (larva_to_ant)', () => {
    it('should convert larva to ant and send WebSocket update', async () => {
      const job = { data: { userId: '1' } } as Job<{ userId: string }>;

      await consumer.processLarvaToAnt(job);

      expect(mockColoniesService.convertLarvaToAnt).toHaveBeenCalledWith('1');
      expect(mockAnthillGateway.sendUpdate).toHaveBeenCalledWith('1');
    });
  });
});
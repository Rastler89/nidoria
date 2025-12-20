import { Test, TestingModule } from '@nestjs/testing';
import { QueenDataConsumer } from './queen-data.consumer';
import { ColoniesService } from '../colonies/colonies.services';
import { getQueueToken } from '@nestjs/bull';
import { Job, Queue } from 'bull';

const mockColoniesService = {
  addEggToColony: jest.fn(),
  getNewEggTimeInMinutes: jest.fn(),
  convertEggToLarva: jest.fn(),
  convertLarvaToAnt: jest.fn(),
};

const mockQueue = {
  add: jest.fn(),
};

describe('QueenDataConsumer', () => {
  let consumer: QueenDataConsumer;
  let coloniesService: ColoniesService;
  let queue: Queue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueenDataConsumer,
        { provide: ColoniesService, useValue: mockColoniesService },
        { provide: getQueueToken('cria'), useValue: mockQueue },
      ],
    }).compile();

    consumer = module.get<QueenDataConsumer>(QueenDataConsumer);
    coloniesService = module.get<ColoniesService>(ColoniesService);
    queue = module.get<Queue>(getQueueToken('cria'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  describe('processqueenData', () => {
    it('should process new egg and schedule next jobs', async () => {
      const job = { data: { userId: '1' } } as Job<{ userId: string }>;
      mockColoniesService.addEggToColony.mockResolvedValue(true);
      mockColoniesService.getNewEggTimeInMinutes.mockResolvedValue(1);

      await consumer.processqueenData(job);

      expect(mockColoniesService.addEggToColony).toHaveBeenCalledWith('1');
      expect(mockColoniesService.getNewEggTimeInMinutes).toHaveBeenCalledWith('1');
      expect(mockQueue.add).toHaveBeenCalledTimes(2);
    });
  });

  describe('processEggToLarva', () => {
    it('should process egg to larva and schedule next job', async () => {
        const job = { data: { userId: '1' } } as Job<{ userId: string }>;
        mockColoniesService.convertEggToLarva.mockResolvedValue(true);

        await consumer.processEggToLarva(job);

        expect(mockColoniesService.convertEggToLarva).toHaveBeenCalledWith('1');
        expect(mockQueue.add).toHaveBeenCalledTimes(1);
      });
  });

  describe('processLarvaToAnt', () => {
    it('should process larva to ant', async () => {
        const job = { data: { userId: '1' } } as Job<{ userId: string }>;
        await consumer.processLarvaToAnt(job);
        expect(mockColoniesService.convertLarvaToAnt).toHaveBeenCalledWith('1');
      });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bullmq';

const mockQueue = {
    add: jest.fn(),
};

describe('AppService', () => {
    let service: AppService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AppService,
                { provide: getQueueToken('cria'), useValue: mockQueue },
            ],
        }).compile();

        service = module.get<AppService>(AppService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getHello', () => {
        it('should return "Hello World!"', () => {
            expect(service.getHello()).toBe('Hello World!');
        });
    });
});
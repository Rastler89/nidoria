import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getQueueToken } from '@nestjs/bullmq';
import { AnthillGateway } from './anthill.gateway';
import { GameEngineService } from '../engine/engine.service';

describe('AnthillGateway', () => {
  let gateway: AnthillGateway;

  const mockJwtService = { verify: jest.fn() };

  const mockEngineService = {
    getFullState: jest.fn(),
    calculateDelta: jest.fn(),
  };

  const mockQueue = { add: jest.fn(), getJobs: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnthillGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: GameEngineService, useValue: mockEngineService },
        { provide: getQueueToken('cria'), useValue: mockQueue },
      ],
    }).compile();

    gateway = module.get<AnthillGateway>(AnthillGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('envía el estado completo al cliente que se conecta', async () => {
      const emit = jest.fn();
      const client = {
        handshake: { auth: { token: 'Bearer token-valido' } },
        join: jest.fn(),
        data: {} as Record<string, unknown>,
        emit,
        disconnect: jest.fn(),
      };

      mockJwtService.verify.mockReturnValue({ sub: 2 });
      // Ya hay ciclo de reina activo: no encolamos uno nuevo.
      mockQueue.getJobs.mockResolvedValue([{ data: { userId: '2' } }]);

      const state = { stats: { eggs: 1, larva: 0, ants: 0, antsBusy: 0 } };
      mockEngineService.getFullState.mockResolvedValue(state);

      await gateway.handleConnection(client as any);

      expect(client.join).toHaveBeenCalledWith('anthill_2');
      expect(emit).toHaveBeenCalledWith('anthill_update', state);
    });
  });

  describe('sendUpdate', () => {
    it('no hace nada en el worker, donde no hay servidor WebSocket', async () => {
      // En main.worker.ts el gateway se instancia pero nunca se le asigna `server`.
      gateway.server = undefined as any;

      await expect(gateway.sendUpdate('1')).resolves.toBeUndefined();

      expect(mockEngineService.getFullState).not.toHaveBeenCalled();
    });

    it('emite el delta al usuario cuando hay servidor', async () => {
      const emit = jest.fn();
      const to = jest.fn().mockReturnValue({ emit });
      gateway.server = { to } as any;

      const state = { food: 10 };
      mockEngineService.getFullState.mockResolvedValue(state);
      mockEngineService.calculateDelta.mockReturnValue({ food: 10 });

      await gateway.sendUpdate('1');

      expect(mockEngineService.getFullState).toHaveBeenCalledWith(1);
      expect(to).toHaveBeenCalledWith('anthill_1');
      expect(emit).toHaveBeenCalledWith('anthill_update', { food: 10 });
    });

    it('no emite nada si no hay cambios', async () => {
      const emit = jest.fn();
      const to = jest.fn().mockReturnValue({ emit });
      gateway.server = { to } as any;

      mockEngineService.getFullState.mockResolvedValue({ food: 10 });
      mockEngineService.calculateDelta.mockReturnValue({});

      await gateway.sendUpdate('1');

      expect(to).not.toHaveBeenCalled();
    });
  });
});

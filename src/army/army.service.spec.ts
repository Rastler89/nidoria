import { BadRequestException } from '@nestjs/common';
import { ArmyService } from './army.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResourcesService } from '../resources/resources.service';

describe('ArmyService', () => {
  let service: ArmyService;

  const prisma = {
    anthill: { findFirst: jest.fn() },
    ant: { findUnique: jest.fn() },
    requirement: { findMany: jest.fn() },
    resource: { findFirst: jest.fn() },
    resourceAnthill: { update: jest.fn() },
    $transaction: jest.fn(),
  };

  const queue = { add: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ArmyService(
      prisma as unknown as PrismaService,
      queue as any,
      {} as ResourcesService,
    );
  });

  describe('startRecruitment', () => {
    it('rechaza una cantidad 0', async () => {
      await expect(service.startRecruitment(1, 1, 0)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.anthill.findFirst).not.toHaveBeenCalled();
    });

    it('rechaza una cantidad no numérica (p. ej. undefined)', async () => {
      await expect(service.startRecruitment(1, 1, undefined as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('rechaza una cantidad decimal', async () => {
      await expect(service.startRecruitment(1, 1, 1.5)).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});

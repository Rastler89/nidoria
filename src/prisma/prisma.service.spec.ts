import { Logger } from '@nestjs/common';
import { execFileSync } from 'child_process';
import { PrismaService } from './prisma.service';

jest.mock('child_process');

jest.mock('@prisma/client', () => {
  class PrismaClient {
    $connect = jest.fn().mockResolvedValue(undefined);
    $queryRawUnsafe = jest.fn().mockResolvedValue([]);
    construction = { count: jest.fn().mockResolvedValue(1) };
    ant = { count: jest.fn().mockResolvedValue(1) };
    resource = { count: jest.fn().mockResolvedValue(1) };
  }

  return { PrismaClient };
});

// `execFileSync` viene auto-mockeado por `jest.mock('child_process')`.
const execFileSyncMock = execFileSync as unknown as jest.Mock;

describe('PrismaService', () => {
  let service: PrismaService;
  let exitSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  const counts = () =>
    service as unknown as {
      construction: { count: jest.Mock };
      ant: { count: jest.Mock };
      resource: { count: jest.Mock };
      $queryRawUnsafe: jest.Mock;
    };

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    exitSpy = jest.spyOn(process, 'exit').mockImplementation(((
      code?: number,
    ) => {
      throw new Error(`process.exit(${code})`);
    }) as never);

    delete process.env.RUN_MIGRATIONS;
    delete process.env.REQUIRED_DB_VERSION;

    execFileSyncMock.mockReset();
    execFileSyncMock.mockReturnValue('');

    service = new PrismaService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('aplica las migraciones pendientes al arrancar', async () => {
    await service.onModuleInit();

    expect(execFileSyncMock).toHaveBeenCalledTimes(1);
    const [bin, args] = execFileSyncMock.mock.calls[0];

    expect(bin).toBe(process.execPath);
    expect(args).toEqual([
      expect.stringContaining('prisma'),
      'migrate',
      'deploy',
    ]);
  });

  it('no fuerza el esquema con db push si algo falla: aborta el arranque', async () => {
    execFileSyncMock.mockImplementation(() => {
      throw Object.assign(new Error('migrate deploy failed'), {
        stderr: Buffer.from('P3018: A migration failed to apply'),
      });
    });

    await expect(service.onModuleInit()).rejects.toThrow('process.exit(1)');

    expect(exitSpy).toHaveBeenCalledWith(1);
    for (const call of execFileSyncMock.mock.calls) {
      expect((call[1] as string[]).join(' ')).not.toContain('push');
    }
  });

  it('no migra ni siembra cuando RUN_MIGRATIONS=false (worker)', async () => {
    process.env.RUN_MIGRATIONS = 'false';

    await service.onModuleInit();

    expect(execFileSyncMock).not.toHaveBeenCalled();
  });

  it('ejecuta el seed solo si el catálogo base está vacío', async () => {
    counts().construction.count.mockResolvedValue(0);
    counts().ant.count.mockResolvedValue(0);
    counts().resource.count.mockResolvedValue(0);

    await service.onModuleInit();

    expect(execFileSyncMock).toHaveBeenCalledTimes(2);
    const [bin, args] = execFileSyncMock.mock.calls[1];

    expect(bin).toBe(process.execPath);
    expect(args).toEqual([expect.stringContaining('tsx'), 'prisma/seed.ts']);
  });

  it('no ejecuta el seed si ya hay datos', async () => {
    await service.onModuleInit();

    expect(execFileSyncMock).toHaveBeenCalledTimes(1);
  });

  it('avisa si REQUIRED_DB_VERSION quedó obsoleto, sin bloquear', async () => {
    process.env.REQUIRED_DB_VERSION = '20200101000000';
    counts().$queryRawUnsafe.mockResolvedValue([
      { migration_name: '20261027215720_add_banner' },
    ]);

    await service.onModuleInit();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('REQUIRED_DB_VERSION=20200101000000'),
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });
});

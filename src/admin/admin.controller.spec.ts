import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let service: AdminService;

  const mockAdminService = {
    wipeAndRebuildDb: jest.fn(),
    enableUser: jest.fn(),
    getMigrationStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('wipeDatabase devuelve el mensaje del servicio', async () => {
    (service.wipeAndRebuildDb as jest.Mock).mockResolvedValue('hecho');

    await expect(controller.wipeDatabase()).resolves.toEqual({
      status: 'Success',
      message: 'hecho',
    });
  });

  it('enableUser exige enable: true', async () => {
    const call = controller.enableUser({ enable: false }, '5');

    await expect(call).rejects.toBeInstanceOf(HttpException);
    await expect(call).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });
    expect(service.enableUser).not.toHaveBeenCalled();
  });

  it('enableUser delega en el servicio', async () => {
    (service.enableUser as jest.Mock).mockResolvedValue({
      message: 'User successfully enabled.',
    });

    const result = await controller.enableUser({ enable: true }, '5');

    expect(service.enableUser).toHaveBeenCalledWith('5');
    expect(result.status).toBe('Success');
  });

  it('getMigrationStatus envuelve el estado del servicio', async () => {
    (service.getMigrationStatus as jest.Mock).mockResolvedValue({
      status: 'up to date',
    });

    await expect(controller.getMigrationStatus()).resolves.toEqual({
      status: 'Success',
      data: { status: 'up to date' },
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let service: AdminService;

  const mockAdminService = {
    getSummary: jest.fn(),
    getUsers: jest.fn(),
    updateUserRole: jest.fn(),
    deleteUser: jest.fn(),
    getAnthills: jest.fn(),
    getQueueStats: jest.fn(),
    getConstructions: jest.fn(),
    createAnt: jest.fn(),
    getDeployments: jest.fn(),
  };

  beforeEach(async () => {
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

  it('getSummary should call service.getSummary', async () => {
    await controller.getSummary();
    expect(service.getSummary).toHaveBeenCalled();
  });

  it('getConstructions should call service.getConstructions', async () => {
    await controller.getConstructions();
    expect(service.getConstructions).toHaveBeenCalled();
  });

  it('getDeployments should call service.getDeployments', async () => {
    await controller.getDeployments();
    expect(service.getDeployments).toHaveBeenCalled();
  });
});

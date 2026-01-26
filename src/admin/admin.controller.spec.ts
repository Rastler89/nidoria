import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

describe('AdminController', () => {
  let controller: AdminController;
  let service: AdminService;

  const mockAdminService = {
    getAllUsers: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    getAllAnthills: jest.fn(),
    updateAnthill: jest.fn(),
    getQueuesStats: jest.fn(),
    cleanQueue: jest.fn(),
    retryFailedJobs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
      ],
    })
    .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
    .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
    .compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getAllUsers', async () => {
    await controller.getAllUsers();
    expect(mockAdminService.getAllUsers).toHaveBeenCalled();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Response } from 'express';

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

  it('getDashboard should send HTML', () => {
    const res = {
      send: jest.fn(),
    } as unknown as Response;
    controller.getDashboard(res);
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('AntMaster'));
  });

  it('getSummary should call service.getSummary', async () => {
    await controller.getSummary();
    expect(service.getSummary).toHaveBeenCalled();
  });
});

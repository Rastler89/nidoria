import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { ResourcesService } from './resources/resources.services';
import { ColoniesService } from './colonies/colonies.services';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CanActivate } from '@nestjs/common';

describe('AppController', () => {
  let appController: AppController;

  const mockAppService = {
    getHello: jest.fn(),
  };

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    refreshAccessToken: jest.fn(),
    verifyAccount: jest.fn(),
  };

  const mockResourcesService = {
    getAllResources: jest.fn(),
  };

  const mockColoniesService = {
    getColonyResources: jest.fn(),
  };

  const mockAuthGuard: CanActivate = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: AppService, useValue: mockAppService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ResourcesService, useValue: mockResourcesService },
        { provide: ColoniesService, useValue: mockColoniesService },
      ],
    })
    .overrideGuard(LocalAuthGuard).useValue(mockAuthGuard)
    .overrideGuard(JwtAuthGuard).useValue(mockAuthGuard)
    .compile();

    appController = app.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return a token', async () => {
      const req = { user: { username: 'test' } };
      const result = { access_token: 'token' };
      mockAuthService.login.mockResolvedValue(result);

      expect(await appController.login(req)).toBe(result);
    });
  });

  describe('register', () => {
    it('should register a user', async () => {
      const req = { body: { username: 'test' } };
      const result = { id: 1, username: 'test' };
      mockAuthService.register.mockResolvedValue(result);

      expect(await appController.register(req)).toBe(result);
    });
  });

  describe('refresh', () => {
    it('should return a new token', async () => {
        const req = { body: { refresh_token: 'token' } };
        const result = { access_token: 'new_token' };
        mockAuthService.refreshAccessToken.mockResolvedValue(result);

        expect(await appController.refresh(req)).toBe(result);
    });
  });

  describe('verifyAccount', () => {
    it('should verify an account', async () => {
        const id = '1';
        const token = 'token';
        const result = 'ok';
        mockAuthService.verifyAccount.mockResolvedValue(result);

        expect(await appController.verifyAccount(id, token)).toBe(result);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', () => {
        const req = { user: { username: 'test' } };
        expect(appController.getProfile(req)).toBe(req.user);
    });
  });

  describe('getResources', () => {
    it('should return user resources', async () => {
        const req = { user: { userId: 1 } };
        const result = [{ resource: 'food', amount: 100 }];
        mockColoniesService.getColonyResources.mockResolvedValue(result);

        expect(await appController.getResources(req)).toBe(result);
    });
  });

  describe('logout', () => {
    it('should call request.logout', async () => {
        const req = { logout: jest.fn() };
        await appController.logout(req);
        expect(req.logout).toHaveBeenCalled();
    });
  });
});
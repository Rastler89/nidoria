import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ColoniesService } from '../colonies/colonies.service';
import { MailerService } from '../mail/mailer.service';
import { ConfigService } from '../config.service';
import * as bcrypt from 'bcryptjs';
import { BadRequestException } from '@nestjs/common';
import { User } from '@prisma/client';

jest.mock('bcryptjs');

const mockUsersService = {
  findByUsernameOrEmail: jest.fn(),
  createUser: jest.fn(),
  setRefreshToken: jest.fn(),
  updateLastLogin: jest.fn(),
  verifyAccount: jest.fn(),
  count: jest.fn(),
  ensureTitleExists: jest.fn(),
  assignTitle: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

const mockColoniesService = {
  createColonyForUser: jest.fn(),
  initQueen: jest.fn(),
};

const mockMailerService = {
  validationMail: jest.fn(),
};

// AuthService usa appUrl para armar el link de verificación de email
const mockConfigService = {
  appUrl: 'http://localhost:3000',
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ColoniesService, useValue: mockColoniesService },
        { provide: MailerService, useValue: mockMailerService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const userDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashedPassword';
      const createdUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        token: 'some-token',
        verified: null,
        refresh_token: null,
        createdAt: new Date(),
        lastLogin: new Date(),
        role: 'USER',
      };

      mockUsersService.findByUsernameOrEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUsersService.createUser.mockResolvedValue(createdUser);
      mockUsersService.count.mockResolvedValue(1);
      mockColoniesService.createColonyForUser.mockResolvedValue(true);
      mockMailerService.validationMail.mockResolvedValue(true);

      const result = await service.register(userDto);

      expect(result).toEqual({
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        role: createdUser.role,
        createdAt: createdUser.createdAt,
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('token');
      expect(mockUsersService.findByUsernameOrEmail).toHaveBeenCalledWith(userDto.username);
      expect(bcrypt.hash).toHaveBeenCalledWith(userDto.password, 10);
      expect(mockUsersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: userDto.username,
          email: userDto.email,
          password: hashedPassword,
        }),
      );
      expect(mockColoniesService.createColonyForUser).toHaveBeenCalledWith(1);
      expect(mockMailerService.validationMail).toHaveBeenCalled();
    });

    it('should return "exist" if user already exists', async () => {
      const userDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const existingUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        token: 'some-token',
        verified: null,
        refresh_token: null,
        createdAt: new Date(),
        lastLogin: new Date(),
        role: 'USER',
      };

      mockUsersService.findByUsernameOrEmail.mockResolvedValue(existingUser);

      const result = await service.register(userDto);
      expect(result).toBe('exist');
    });

    it('should reject an empty payload with BadRequestException', async () => {
      await expect(service.register({})).rejects.toBeInstanceOf(BadRequestException);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockUsersService.createUser).not.toHaveBeenCalled();
    });

    it('should report which required fields are missing', async () => {
      await expect(
        service.register({ username: 'testuser', password: 'password123' }),
      ).rejects.toMatchObject({
        response: {
          message: 'Faltan campos obligatorios para el registro.',
          details: 'Campos requeridos: email.',
        },
      });
      expect(mockUsersService.findByUsernameOrEmail).not.toHaveBeenCalled();
    });

    it('should log the verification link instead of sending email in development', async () => {
      const userDto = {
        username: 'devuser',
        email: 'dev@example.com',
        password: 'password123',
      };
      const createdUser: User = {
        id: 2,
        username: 'devuser',
        email: 'dev@example.com',
        password: 'hashedPassword',
        token: 'some-token',
        verified: null,
        refresh_token: null,
        createdAt: new Date(),
        lastLogin: new Date(),
        role: 'USER',
      };

      mockUsersService.findByUsernameOrEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUsersService.createUser.mockResolvedValue(createdUser);
      mockUsersService.count.mockResolvedValue(200); // >100: no asigna título de Fundador
      mockColoniesService.createColonyForUser.mockResolvedValue(true);

      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const previousEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      try {
        await service.register(userDto);

        expect(mockMailerService.validationMail).not.toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('http://localhost:3000/verifyAccount/2/'),
        );
      } finally {
        if (previousEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previousEnv;
        logSpy.mockRestore();
      }
    });
  });

  describe('validateUser', () => {
    it('should return user if validation is successful', async () => {
      const user = { id: 1, username: 'test', password: 'hashedPassword', verified: new Date() };
      mockUsersService.findByUsernameOrEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test', 'password');
      expect(result).toEqual(user);
    });

    it('should return null if user is not found', async () => {
      mockUsersService.findByUsernameOrEmail.mockResolvedValue(null);
      const result = await service.validateUser('nonexistent', 'password');
      expect(result).toBeNull();
    });

    it('should return null if validation fails', async () => {
      const user = { id: 1, username: 'test', password: 'hashedPassword', verified: new Date() };
      mockUsersService.findByUsernameOrEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test', 'wrongpassword');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      const user = { id: 1, username: 'test', email: 'test@test.com' };
      const accessToken = 'access_token';
      const refreshToken = 'refresh_token';
      mockJwtService.sign.mockReturnValueOnce(accessToken).mockReturnValueOnce(refreshToken);

      const result = await service.login(user);

      expect(result).toHaveProperty('access_token', accessToken);
      expect(result).toHaveProperty('refresh_token', refreshToken);
    });

    it('actualiza lastLogin para que la colonia no cuente como inactiva', async () => {
      const user = { id: 7, username: 'test', email: 'test@test.com', role: 'USER' };
      mockJwtService.sign.mockReturnValue('token');

      await service.login(user);

      expect(mockUsersService.updateLastLogin).toHaveBeenCalledWith(7);
    });
  });

  describe('verifyAccount', () => {
    it('should verify an account', async () => {
      const id = 1;
      const token = 'token';

      mockUsersService.verifyAccount.mockResolvedValue('ok');
      mockColoniesService.initQueen.mockResolvedValue(true);

      const result = await service.verifyAccount(id, token);

      expect(result).toBe('Thanks, your email is validated');
      expect(mockUsersService.verifyAccount).toHaveBeenCalledWith(id, token);
      expect(mockColoniesService.initQueen).toHaveBeenCalledWith(id);
    });
  });
});

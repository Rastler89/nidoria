import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ColoniesService } from '../colonies/colonies.services';
import { MailerService } from '../mail/mailer.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

jest.mock('bcrypt');

const mockUsersService = {
  findByUsernameOrEmail: jest.fn(),
  createUser: jest.fn(),
  setRefreshToken: jest.fn(),
  verifyAccount: jest.fn(),
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

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ColoniesService, useValue: mockColoniesService },
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
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
      mockColoniesService.createColonyForUser.mockResolvedValue(true);
      mockMailerService.validationMail.mockResolvedValue(true);

      await service.register(userDto);

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

    it('should throw an error if user already exists', async () => {
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

      await expect(service.register(userDto)).rejects.toThrow('User already exists');
    });
  });

  describe('validateUser', () => {
    it('should return user if validation is successful', async () => {
      const user = { id: 1, username: 'test', password: 'hashedPassword' };
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
      const user = { id: 1, username: 'test', password: 'hashedPassword' };
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
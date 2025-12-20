import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

const mockPrismaService = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const userData: Prisma.UserCreateInput = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedUser: User = {
        id: 1,
        ...userData,
        verified: null,
        token: 'some-token',
        refresh_token: null,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      mockPrismaService.user.create.mockResolvedValue(expectedUser);

      const result = await service.createUser(userData);

      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: userData,
      });
    });
  });

  describe('findByUsernameOrEmail', () => {
    it('should find a user by username', async () => {
      const username = 'testuser';
      const expectedUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        verified: null,
        token: 'some-token',
        refresh_token: null,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      mockPrismaService.user.findFirst.mockResolvedValue(expectedUser);

      const result = await service.findByUsernameOrEmail(username);

      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ username: username }, { email: username }],
        },
      });
    });

    it('should return null if user is not found', async () => {
      const username = 'nonexistent';
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.findByUsernameOrEmail(username);

      expect(result).toBeNull();
    });
  });
});
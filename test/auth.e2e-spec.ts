import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await prisma.user.deleteMany({});
  });

  describe('/register (POST)', () => {
    it('should register a user and return a success message', async () => {
      const userDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/register')
        .send(userDto)
        .expect(201);

      const userInDb = await prisma.user.findUnique({
          where: { email: userDto.email },
      });

      expect(userInDb).not.toBeNull();
      expect(userInDb.username).toBe(userDto.username);

    });
  });
});
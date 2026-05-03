import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASETEST_URL } },
    });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.resourceAnthill.deleteMany({});
    await prisma.anthill.deleteMany({});
    await prisma.user.deleteMany({});
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await prisma.resourceAnthill.deleteMany({});
    await prisma.anthill.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('/register (POST)', () => {
    const userDto = { username: 'testuser', email: 'test@example.com', password: 'password123' };

    it('should register a user and return 201', async () => {
      await request(app.getHttpServer()).post('/register').send(userDto).expect(201);
      const user = await prisma.user.findUnique({ where: { email: userDto.email } });
      expect(user).not.toBeNull();
      expect(user.username).toBe(userDto.username);
    });

    it('should reject duplicate registration', async () => {
      await request(app.getHttpServer()).post('/register').send(userDto).expect(201);
      const res = await request(app.getHttpServer()).post('/register').send(userDto);
      // Should not create second user — returns exist or conflict
      expect([200, 409]).toContain(res.status);
    });
  });

  describe('/login (POST)', () => {
    it('should reject with 401 for invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'ghost', password: 'wrong' })
        .expect(401);
    });
  });
});
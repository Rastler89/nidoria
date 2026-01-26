import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';

describe('AdminController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASETEST_URL,
        },
      },
    });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Clean up DB
    await prisma.resourceAnthill.deleteMany({});
    await prisma.antsAnthill.deleteMany({});
    await prisma.anthill.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should deny access to /admin/users for unauthenticated users', () => {
    return request(app.getHttpServer())
      .get('/admin/users')
      .expect(401);
  });

  it('should deny access to /admin/users for regular users', async () => {
    const userDto = {
      username: 'regular',
      email: 'regular@example.com',
      password: 'password123',
    };
    await request(app.getHttpServer()).post('/auth/register').send(userDto);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'regular', password: 'password123' });

    const token = loginRes.body.access_token;

    return request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('should allow access to /admin/users for admin users', async () => {
    const adminDto = {
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
    };
    await request(app.getHttpServer()).post('/auth/register').send(adminDto);

    await prisma.user.update({
      where: { email: 'admin@example.com' },
      data: { role: 'admin' },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'password123' });

    const token = loginRes.body.access_token;

    return request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});

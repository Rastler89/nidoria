import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';
import { MailerService } from '../src/mail/mailer.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  // Orden por FKs: hijas de Deployment/Anthill primero, UserTitle antes que User.
  const cleanDb = async () => {
    await prisma.antsDeploy.deleteMany({});
    await prisma.deployment.deleteMany({});
    await prisma.antsAnthill.deleteMany({});
    await prisma.constructionAnthill.deleteMany({});
    await prisma.investigationAnthill.deleteMany({});
    await prisma.exploration.deleteMany({});
    await prisma.resourceAnthill.deleteMany({});
    await prisma.anthill.deleteMany({});
    await prisma.userTitle.deleteMany({});
    await prisma.user.deleteMany({});
  };

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASETEST_URL } },
    });
    await prisma.$connect();

    // Mock del envío de correo: el e2e valida el flujo de registro, no la entrega
    // de emails. Sin esto, el test depende de un SMTP real y falla en CI.
    const mockMailer = { validationMail: jest.fn().mockResolvedValue(true) };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailerService)
      .useValue(mockMailer)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await cleanDb();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  // La suite solo crea/borra usuarios propios; un solo boot del módulo basta
  // (arrancar el AppModule por test genera churn de conexiones Redis/Bull).
  beforeEach(cleanDb);
  afterEach(cleanDb);

  describe('/auth/register (POST)', () => {
    const userDto = { username: 'testuser', email: 'test@example.com', password: 'password123' };

    it('should register a user and return 201', async () => {
      await request(app.getHttpServer()).post('/auth/register').send(userDto).expect(201);
      const user = await prisma.user.findUnique({ where: { email: userDto.email } });
      expect(user).not.toBeNull();
      expect(user.username).toBe(userDto.username);
    });

    it('should reject duplicate registration', async () => {
      await request(app.getHttpServer()).post('/auth/register').send(userDto).expect(201);
      const res = await request(app.getHttpServer()).post('/auth/register').send(userDto);
      // Should not create second user — returns exist or conflict
      expect([200, 409]).toContain(res.status);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should reject with 401 for invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'ghost', password: 'wrong' })
        .expect(401);
    });
  });
});

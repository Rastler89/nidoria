import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  // Un solo boot para toda la suite: las rutas solo leen (401s), no mutan datos.
  // Arrancar el AppModule por test genera churn de conexiones Redis/Bull y
  // falsos fallos de "Connection is closed".
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) should return Hello World', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/auth/register (POST) should reject missing fields', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({})
      .expect((res) => {
        expect([400, 500]).toContain(res.status);
      });
  });

  it('/auth/login (POST) should reject invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'nonexistent', password: 'wrong' })
      .expect(401);
  });

  it('/resources (GET) should reject unauthenticated', () => {
    return request(app.getHttpServer())
      .get('/resources')
      .expect(401);
  });

  it('/mission (POST) should reject unauthenticated', () => {
    return request(app.getHttpServer())
      .post('/mission')
      .send({ resource: 'FOOD', amount: 10 })
      .expect(401);
  });

  it('/constructions (GET) should reject unauthenticated', () => {
    return request(app.getHttpServer())
      .get('/constructions')
      .expect(401);
  });
});

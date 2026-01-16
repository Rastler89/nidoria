import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * AI Player (Bot) for Nidoria
 * This script simulates a player to detect errors and undesired flows in the API.
 */

class AIPlayer {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private userId: number | null = null;
  private username: string = `bot_${Math.floor(Math.random() * 10000)}`;
  private email: string = `${this.username}@example.com`;
  private password: string = 'Password123!';

  private stats = {
    totalActions: 0,
    success: 0,
    failures: 0,
    unexpectedErrors: 0,
  };

  constructor(private server: any) {}

  async logAction(name: string, response: any, expectedStatus: number | number[]) {
    this.stats.totalActions++;
    const status = response.status;
    const isExpected = Array.isArray(expectedStatus)
      ? expectedStatus.includes(status)
      : status === expectedStatus;

    if (isExpected) {
      this.stats.success++;
      console.log(`[PASS] ${name} - Status: ${status}`);
    } else {
      if (status >= 500) {
        this.stats.unexpectedErrors++;
        console.error(`[CRITICAL] ${name} - Unexpected Server Error: ${status}`);
        console.error(JSON.stringify(response.body, null, 2));
      } else {
        this.stats.failures++;
        console.warn(`[FAIL] ${name} - Status: ${status} (Expected: ${expectedStatus})`);
        console.warn(JSON.stringify(response.body, null, 2));
      }
    }
  }

  async register() {
    const res = await request(this.server)
      .post('/auth/register')
      .send({
        username: this.username,
        email: this.email,
        password: this.password,
      });
    await this.logAction('Register', res, [201, 409]);
    if (res.status === 201) {
        this.userId = res.body.id;
    }
  }

  async login() {
    const res = await request(this.server)
      .post('/auth/login')
      .send({
        username: this.username,
        password: this.password,
      });
    await this.logAction('Login', res, 201);
    if (res.status === 201) {
      this.token = res.body.access_token;
      this.refreshToken = res.body.refresh_token;
    }
  }

  async getProfile() {
    if (!this.token) {
        console.log('[SKIP] getProfile - No token');
        return;
    }
    const res = await request(this.server)
      .get('/profile')
      .set('Authorization', `Bearer ${this.token}`);
    await this.logAction('Get Profile', res, 200);
  }

  async getResources() {
    if (!this.token) {
        console.log('[SKIP] getResources - No token');
        return;
    }
    const res = await request(this.server)
      .get('/resources')
      .set('Authorization', `Bearer ${this.token}`);
    await this.logAction('Get Resources', res, 200);
  }

  async startMission() {
    if (!this.token) {
        console.log('[SKIP] startMission - No token');
        return;
    }
    // Resource types from schema: F, W, L (Fruit, Water, Leaves?)
    // Let's try 'F'
    const res = await request(this.server)
      .post('/mission')
      .set('Authorization', `Bearer ${this.token}`)
      .send({
        type: 'F',
        amount: 10,
      });
    await this.logAction('Start Mission', res, [201, 200]);
  }

  async tryInvalidMission() {
    if (!this.token) return;
    const res = await request(this.server)
      .post('/mission')
      .set('Authorization', `Bearer ${this.token}`)
      .send({
        type: 'INVALID_TYPE',
        amount: -1,
      });
    // We expect a 400 or 404, not a 500
    await this.logAction('Invalid Mission', res, [400, 404]);
  }

  async tryUnauthorizedAccess() {
    const res = await request(this.server)
      .get('/profile');
    await this.logAction('Unauthorized Access', res, 401);
  }

  async tryInvalidLogin() {
    const res = await request(this.server)
      .post('/auth/login')
      .send({
        username: this.username,
        password: 'wrong_password',
      });
    await this.logAction('Invalid Login', res, 401);
  }

  async refreshTokenAction() {
    if (!this.refreshToken) return;
    const res = await request(this.server)
      .post('/auth/refresh')
      .send({
        refresh_token: this.refreshToken,
      });
    await this.logAction('Refresh Token', res, 201);
    if (res.status === 201) {
        this.token = res.body.access_token;
    }
  }

  async run(iterations: number) {
    console.log(`--- 🐜 Starting AI Player: ${this.username} ---`);

    // Always start with register
    await this.register();

    for (let i = 0; i < iterations; i++) {
      let action: () => Promise<void>;

      const rand = Math.random();

      if (!this.token) {
        // If not logged in, 80% chance to login, 20% chance to try unauthorized/invalid
        if (rand < 0.8) {
          action = () => this.login();
        } else if (rand < 0.9) {
          action = () => this.tryUnauthorizedAccess();
        } else {
          action = () => this.tryInvalidLogin();
        }
      } else {
        // If logged in
        if (rand < 0.4) {
          action = () => this.getResources();
        } else if (rand < 0.7) {
          action = () => this.startMission();
        } else if (rand < 0.8) {
          action = () => this.getProfile();
        } else if (rand < 0.9) {
          action = () => this.tryInvalidMission();
        } else if (rand < 0.95) {
          action = () => this.refreshTokenAction();
        } else {
          action = () => { this.token = null; return Promise.resolve(); }; // Simulate logout/session loss
          console.log('[ACTION] Logout (Local)');
        }
      }

      await action();
      await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\n--- 📊 Summary for ${this.username} ---`);
    console.log(`Total Actions: ${this.stats.totalActions}`);
    console.log(`Success: ${this.stats.success}`);
    console.log(`Failures (Expected): ${this.stats.failures}`);
    console.log(`Unexpected (500): ${this.stats.unexpectedErrors}`);

    return this.stats.unexpectedErrors === 0;
  }
}

async function main() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  const server = app.getHttpServer();

  const player = new AIPlayer(server);
  const success = await player.run(20);

  await app.close();

  if (!success) {
    console.error('AI Player detected issues!');
    process.exit(1);
  } else {
    console.log('AI Player finished successfully with no unexpected errors.');
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

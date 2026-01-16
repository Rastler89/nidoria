import axios, { AxiosInstance } from 'axios';

/**
 * 🐜 Standalone AI Player CLI for Nidoria
 * Este script interactúa con la API únicamente a través de HTTP.
 */

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bgBlue: '\x1b[44m',
};

interface ActionRecord {
  name: string;
  status: number;
  expected: boolean;
  timestamp: number;
}

class AIPlayer {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private userId: number | null = null;
  private username: string = `bot_${Math.floor(Math.random() * 10000)}`;
  private email: string = `${this.username}@example.com`;
  private password: string = 'Password123!';
  private api: AxiosInstance;

  private history: ActionRecord[] = [];
  private stats = {
    totalActions: 0,
    success: 0,
    failures: 0,
    unexpectedErrors: 0,
  };

  private resources: any = null;

  constructor(private baseUrl: string) {
    this.api = axios.create({
      baseURL: this.baseUrl,
      validateStatus: () => true,
    });
  }

  private colorize(text: string, color: string) {
    return `${color}${text}${COLORS.reset}`;
  }

  private printDashboard() {
    console.log('\n' + this.colorize('─'.repeat(50), COLORS.blue));
    console.log(this.colorize(' 🤖 BOT STATUS DASHBOARD', COLORS.bright + COLORS.bgBlue));
    console.log(` 👤 User: ${this.colorize(this.username, COLORS.cyan)}`);
    console.log(` 🔑 Token: ${this.token ? this.colorize('ACTIVE', COLORS.green) : this.colorize('MISSING', COLORS.red)}`);
    if (this.resources) {
      console.log(` 📦 Resources: ${JSON.stringify(this.resources)}`);
    }
    console.log(this.colorize('─'.repeat(50), COLORS.blue));
  }

  async logAction(name: string, response: any, expectedStatus: number | number[]) {
    this.stats.totalActions++;
    const status = response.status;
    const isExpected = Array.isArray(expectedStatus)
      ? expectedStatus.includes(status)
      : status === expectedStatus;

    this.history.push({
        name,
        status,
        expected: isExpected,
        timestamp: Date.now()
    });

    if (isExpected) {
      this.stats.success++;
      console.log(`${this.colorize('[PASS]', COLORS.green)} ${name} - Status: ${status}`);
    } else {
      if (status >= 500) {
        this.stats.unexpectedErrors++;
        console.error(`${this.colorize('[CRITICAL]', COLORS.red)} ${name} - Unexpected Server Error: ${status}`);
        console.error(this.colorize(JSON.stringify(response.data, null, 2), COLORS.red));
      } else {
        this.stats.failures++;
        console.warn(`${this.colorize('[FAIL]', COLORS.yellow)} ${name} - Status: ${status} (Expected: ${expectedStatus})`);
        console.warn(this.colorize(JSON.stringify(response.data, null, 2), COLORS.yellow));
      }
    }
  }

  async register() {
    console.log(this.colorize('\n[THINKING] I need to create an account to start playing...', COLORS.magenta));
    const res = await this.api.post('/auth/register', {
        username: this.username,
        email: this.email,
        password: this.password,
    });
    await this.logAction('Register', res, [201, 409]);
    if (res.status === 201) {
        this.userId = res.data.id;
    }
  }

  async login() {
    console.log(this.colorize('\n[THINKING] Authenticating to get my access token...', COLORS.magenta));
    const res = await this.api.post('/auth/login', {
        username: this.username,
        password: this.password,
    });
    await this.logAction('Login', res, 201);
    if (res.status === 201) {
      this.token = res.data.access_token;
      this.refreshToken = res.data.refresh_token;
      this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  async getProfile() {
    console.log(this.colorize('\n[THINKING] Checking my profile data...', COLORS.magenta));
    const res = await this.api.get('/profile');
    await this.logAction('Get Profile', res, 200);
  }

  async getResources() {
    console.log(this.colorize('\n[THINKING] How many seeds and leaves do I have?', COLORS.magenta));
    const res = await this.api.get('/resources');
    await this.logAction('Get Resources', res, 200);
    if (res.status === 200) {
        this.resources = res.data;
    }
  }

  async startMission() {
    console.log(this.colorize('\n[THINKING] Sending ants on an expedition!', COLORS.magenta));
    const res = await this.api.post('/mission', {
        type: 'F',
        amount: 10,
    });
    await this.logAction('Start Mission', res, [201, 200]);
  }

  async tryInvalidMission() {
    console.log(this.colorize('\n[THINKING] Testing system resilience with an invalid mission...', COLORS.magenta));
    const res = await this.api.post('/mission', {
        type: 'INVALID_TYPE',
        amount: -1,
    });
    await this.logAction('Invalid Mission', res, [400, 404]);
  }

  async tryUnauthorizedAccess() {
    console.log(this.colorize('\n[THINKING] Trying to access restricted area without token...', COLORS.magenta));
    const oldToken = this.api.defaults.headers.common['Authorization'];
    delete this.api.defaults.headers.common['Authorization'];
    const res = await this.api.get('/profile');
    if (oldToken) this.api.defaults.headers.common['Authorization'] = oldToken;
    await this.logAction('Unauthorized Access', res, 401);
  }

  async tryInvalidLogin() {
    console.log(this.colorize('\n[THINKING] Testing security with wrong credentials...', COLORS.magenta));
    const res = await this.api.post('/auth/login', {
        username: this.username,
        password: 'wrong_password',
    });
    await this.logAction('Invalid Login', res, 401);
  }

  async refreshTokenAction() {
    console.log(this.colorize('\n[THINKING] My token might be old, let\'s refresh it...', COLORS.magenta));
    if (!this.refreshToken) return;
    const res = await this.api.post('/auth/refresh', {
        refresh_token: this.refreshToken,
    });
    await this.logAction('Refresh Token', res, 201);
    if (res.status === 201) {
        this.token = res.data.access_token;
        this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  async rest() {
    console.log(this.colorize('\n[THINKING] I am tired, I will rest for a bit...', COLORS.magenta));
    console.log(this.colorize('Bot is resting and doing nothing...', COLORS.blue));
  }

  async performAnalysis() {
    console.log('\n' + this.colorize('═'.repeat(60), COLORS.bright + COLORS.cyan));
    console.log(this.colorize(' 📈 POST-RUN ANALYTICAL REPORT', COLORS.bright + COLORS.bgBlue));

    const errors = this.history.filter(h => !h.expected);
    if (errors.length === 0) {
        console.log(this.colorize('\n ✨ No anomalies detected. All flows followed expected behavior.', COLORS.green));
    } else {
        console.log(this.colorize(`\n ⚠️ Detected ${errors.length} unexpected behaviors:`, COLORS.yellow));
        errors.forEach(err => {
            const color = err.status >= 500 ? COLORS.red : COLORS.yellow;
            console.log(`   - [${err.name}] returned ${this.colorize(err.status.toString(), color)}`);
        });

        const criticals = errors.filter(e => e.status >= 500);
        if (criticals.length > 0) {
            console.log(this.colorize('\n 🔥 CRITICAL ANALYSIS:', COLORS.red + COLORS.bright));
            console.log(' The server crashed or returned internal errors. Check logs for stack traces.');
        }
    }

    console.log(this.colorize('\n 📊 Metrics Summary:', COLORS.bright));
    console.log(` - Success Rate: ${((this.stats.success / this.stats.totalActions) * 100).toFixed(2)}%`);
    console.log(` - Total Actions: ${this.stats.totalActions}`);
    console.log(this.colorize('═'.repeat(60), COLORS.bright + COLORS.cyan));
  }

  async run(iterations: number, delay: number) {
    console.log(this.colorize(`\n--- 🐜 Starting AI Player Standalone: ${this.username} ---`, COLORS.bright + COLORS.cyan));
    console.log(`Target API: ${this.baseUrl}\n`);

    await this.register();

    for (let i = 0; i < iterations; i++) {
      this.printDashboard();

      let action: () => Promise<void>;
      const rand = Math.random();

      if (!this.token) {
        if (rand < 0.8) {
          action = () => this.login();
        } else if (rand < 0.9) {
          action = () => this.tryUnauthorizedAccess();
        } else {
          action = () => this.tryInvalidLogin();
        }
      } else {
        if (rand < 0.4) {
          action = () => this.getResources();
        } else if (rand < 0.7) {
          action = () => this.startMission();
        } else if (rand < 0.8) {
          action = () => this.getProfile();
        } else if (rand < 0.9) {
          action = () => this.tryInvalidMission();
        } else if (rand < 0.92) {
          action = () => this.refreshTokenAction();
        } else if (rand < 0.96) {
          action = () => this.rest();
        } else {
          action = () => {
            console.log(this.colorize('\n[THINKING] Simulating a logout...', COLORS.magenta));
            this.token = null;
            delete this.api.defaults.headers.common['Authorization'];
            return Promise.resolve();
          };
        }
      }

      await action();
      await new Promise(r => setTimeout(r, delay));
    }

    await this.performAnalysis();

    return this.stats.unexpectedErrors === 0;
  }
}

async function main() {
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  const iterations = parseInt(process.env.PLAYER_ITERATIONS || '20');
  const delay = parseInt(process.env.PLAYER_DELAY || '500');

  const player = new AIPlayer(baseUrl);
  const success = await player.run(iterations, delay);

  if (!success) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  if (err.code === 'ECONNREFUSED') {
    console.error('\x1b[31m[ERROR] No se pudo conectar con la API. ¿Está el servidor encendido?\x1b[0m');
    console.error(`URL objetivo: ${err.config.baseURL}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

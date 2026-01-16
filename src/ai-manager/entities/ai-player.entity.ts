import axios, { AxiosInstance } from 'axios';

export interface ActionRecord {
  name: string;
  status: number;
  expected: boolean;
  timestamp: number;
  thinking?: string;
}

export class AIPlayer {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private userId: number | null = null;
  public username: string;
  private email: string;
  private password: string = 'Password123!';
  private api: AxiosInstance;
  private isRunning: boolean = false;

  private history: ActionRecord[] = [];
  private stats = {
    totalActions: 0,
    success: 0,
    failures: 0,
    unexpectedErrors: 0,
  };

  private resources: any = null;

  constructor(
    private readonly baseUrl: string,
    private readonly onUpdate: (data: any) => void,
    private readonly onLog: (message: string, type: 'info' | 'success' | 'warn' | 'error' | 'thinking') => void
  ) {
    this.username = `bot_${Math.floor(Math.random() * 10000)}`;
    this.email = `${this.username}@example.com`;
    this.api = axios.create({
      baseURL: this.baseUrl,
      validateStatus: () => true, // Don't throw on errors
    });
  }

  private async logAction(name: string, response: any, expectedStatus: number | number[], thinking: string) {
    this.stats.totalActions++;
    const status = response.status;
    const isExpected = Array.isArray(expectedStatus)
      ? expectedStatus.includes(status)
      : status === expectedStatus;

    const record: ActionRecord = {
        name,
        status,
        expected: isExpected,
        timestamp: Date.now(),
        thinking
    };
    this.history.push(record);

    if (isExpected) {
      this.stats.success++;
      this.onLog(`[PASS] ${name} - Status: ${status}`, 'success');
    } else {
      if (status >= 500) {
        this.stats.unexpectedErrors++;
        this.onLog(`[CRITICAL] ${name} - Unexpected Server Error: ${status}`, 'error');
      } else {
        this.stats.failures++;
        this.onLog(`[FAIL] ${name} - Status: ${status} (Expected: ${expectedStatus})`, 'warn');
      }
    }

    this.onUpdate(this.getState());
  }

  public getState() {
    return {
      username: this.username,
      userId: this.userId,
      token: !!this.token,
      resources: this.resources,
      stats: this.stats,
      history: this.history.slice(-10), // Last 10 actions
      isRunning: this.isRunning
    };
  }

  private async think(message: string) {
    this.onLog(message, 'thinking');
  }

  async register() {
    const intent = 'I need to create an account to start playing...';
    await this.think(intent);
    const res = await this.api.post('/auth/register', {
        username: this.username,
        email: this.email,
        password: this.password,
    });
    await this.logAction('Register', res, [201, 409], intent);
    if (res.status === 201) {
        this.userId = res.data.id;
    }
  }

  async login() {
    const intent = 'Authenticating to get my access token...';
    await this.think(intent);
    const res = await this.api.post('/auth/login', {
        username: this.username,
        password: this.password,
    });
    await this.logAction('Login', res, 201, intent);
    if (res.status === 201) {
      this.token = res.data.access_token;
      this.refreshToken = res.data.refresh_token;
      this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  async getProfile() {
    const intent = 'Checking my profile data...';
    await this.think(intent);
    const res = await this.api.get('/profile');
    await this.logAction('Get Profile', res, 200, intent);
  }

  async getResources() {
    const intent = 'How many seeds and leaves do I have?';
    await this.think(intent);
    const res = await this.api.get('/resources');
    await this.logAction('Get Resources', res, 200, intent);
    if (res.status === 200) {
        this.resources = res.data;
    }
  }

  async startMission() {
    const intent = 'Sending ants on an expedition!';
    await this.think(intent);
    const res = await this.api.post('/mission', {
        type: 'F',
        amount: 10,
    });
    await this.logAction('Start Mission', res, [201, 200], intent);
  }

  async tryInvalidMission() {
    const intent = 'Testing system resilience with an invalid mission...';
    await this.think(intent);
    const res = await this.api.post('/mission', {
        type: 'INVALID_TYPE',
        amount: -1,
    });
    await this.logAction('Invalid Mission', res, [400, 404], intent);
  }

  async tryUnauthorizedAccess() {
    const intent = 'Trying to access restricted area without token...';
    await this.think(intent);
    // Temporarily remove token
    const oldToken = this.token;
    delete this.api.defaults.headers.common['Authorization'];
    const res = await this.api.get('/profile');
    if (oldToken) this.api.defaults.headers.common['Authorization'] = `Bearer ${oldToken}`;
    await this.logAction('Unauthorized Access', res, 401, intent);
  }

  async tryInvalidLogin() {
    const intent = 'Testing security with wrong credentials...';
    await this.think(intent);
    const res = await this.api.post('/auth/login', {
        username: this.username,
        password: 'wrong_password',
    });
    await this.logAction('Invalid Login', res, 401, intent);
  }

  async refreshTokenAction() {
    const intent = 'My token might be old, let\'s refresh it...';
    await this.think(intent);
    if (!this.refreshToken) return;
    const res = await this.api.post('/auth/refresh', {
        refresh_token: this.refreshToken,
    });
    await this.logAction('Refresh Token', res, 201, intent);
    if (res.status === 201) {
        this.token = res.data.access_token;
        this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  async run(iterations: number, delay: number) {
    this.isRunning = true;
    this.onLog(`Starting simulation for ${this.username}`, 'info');
    this.onUpdate(this.getState());

    await this.register();

    for (let i = 0; i < iterations && this.isRunning; i++) {
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
        } else if (rand < 0.95) {
          action = () => this.refreshTokenAction();
        } else {
          action = () => {
            this.onLog('Simulating a logout...', 'thinking');
            this.token = null;
            delete this.api.defaults.headers.common['Authorization'];
            this.onUpdate(this.getState());
            return Promise.resolve();
          };
        }
      }

      await action();
      await new Promise(r => setTimeout(r, delay));
    }

    this.isRunning = false;
    this.onLog('Simulation finished', 'info');
    this.onUpdate(this.getState());
  }

  stop() {
    this.isRunning = false;
    this.onLog('Stopping simulation...', 'warn');
  }
}

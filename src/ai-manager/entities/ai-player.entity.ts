import axios, { AxiosInstance } from 'axios';
import { getSuggestion } from '../utils/suggestion-engine';

export interface ActionRecord {
  name: string;
  status: number;
  expected: boolean;
  timestamp: number;
  thinking?: string;
  suggestion?: string;
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
    this.email = `${this.username}@ejemplo.com`;
    this.api = axios.create({
      baseURL: this.baseUrl,
      validateStatus: () => true, // No lanzar error en códigos de estado no exitosos
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
        thinking,
        suggestion: !isExpected ? getSuggestion(name, status, response.data) : undefined
    };
    this.history.push(record);

    if (isExpected) {
      this.stats.success++;
      this.onLog(`[CORRECTO] ${name} - Estado: ${status}`, 'success');
    } else {
      if (status >= 500) {
        this.stats.unexpectedErrors++;
        this.onLog(`[CRÍTICO] ${name} - Error inesperado del servidor: ${status}`, 'error');
      } else {
        this.stats.failures++;
        this.onLog(`[FALLO] ${name} - Estado: ${status} (Esperado: ${expectedStatus})`, 'warn');
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
      history: this.history.slice(-10), // Últimas 10 acciones
      isRunning: this.isRunning
    };
  }

  private async think(message: string) {
    this.onLog(message, 'thinking');
  }

  async register() {
    const intent = 'Necesito crear una cuenta para empezar a jugar...';
    await this.think(intent);
    const res = await this.api.post('/auth/register', {
        username: this.username,
        email: this.email,
        password: this.password,
    });
    await this.logAction('Registro', res, [201, 409], intent);
    if (res.status === 201) {
        this.userId = res.data.id;
    }
  }

  async login() {
    const intent = 'Autenticándome para obtener mi token de acceso...';
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
    const intent = 'Revisando los datos de mi perfil...';
    await this.think(intent);
    const res = await this.api.get('/profile');
    await this.logAction('Obtener Perfil', res, 200, intent);
  }

  async getResources() {
    const intent = '¿Cuántas semillas y hojas tengo?';
    await this.think(intent);
    const res = await this.api.get('/resources');
    await this.logAction('Obtener Recursos', res, 200, intent);
    if (res.status === 200) {
        this.resources = res.data;
    }
  }

  async startMission() {
    const intent = '¡Enviando hormigas a una expedición!';
    await this.think(intent);
    const res = await this.api.post('/mission', {
        type: 'F',
        amount: 10,
    });
    await this.logAction('Iniciar Misión', res, [201, 200], intent);
  }

  async tryInvalidMission() {
    const intent = 'Probando la resiliencia del sistema con una misión inválida...';
    await this.think(intent);
    const res = await this.api.post('/mission', {
        type: 'INVALID_TYPE',
        amount: -1,
    });
    await this.logAction('Misión Inválida', res, [400, 404], intent);
  }

  async tryUnauthorizedAccess() {
    const intent = 'Intentando acceder a un área restringida sin token...';
    await this.think(intent);
    // Eliminar token temporalmente
    const oldToken = this.token;
    delete this.api.defaults.headers.common['Authorization'];
    const res = await this.api.get('/profile');
    if (oldToken) this.api.defaults.headers.common['Authorization'] = `Bearer ${oldToken}`;
    await this.logAction('Acceso no Autorizado', res, 401, intent);
  }

  async tryInvalidLogin() {
    const intent = 'Probando la seguridad con credenciales erróneas...';
    await this.think(intent);
    const res = await this.api.post('/auth/login', {
        username: this.username,
        password: 'wrong_password',
    });
    await this.logAction('Login Inválido', res, 401, intent);
  }

  async refreshTokenAction() {
    const intent = 'Mi token podría ser antiguo, vamos a refrescarlo...';
    await this.think(intent);
    if (!this.refreshToken) return;
    const res = await this.api.post('/auth/refresh', {
        refresh_token: this.refreshToken,
    });
    await this.logAction('Refrescar Token', res, 201, intent);
    if (res.status === 201) {
        this.token = res.data.access_token;
        this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  async rest() {
    const intent = 'Estoy cansado, voy a descansar un poco...';
    await this.think(intent);
    // Esta es una acción local, no ataca a la API pero la registramos para el flujo
    this.onLog('El bot está descansando y no hace nada...', 'info');
    this.onUpdate(this.getState());
  }

  async run(iterations: number, delay: number) {
    this.isRunning = true;
    this.onLog(`Iniciando simulación para ${this.username}`, 'info');
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
        } else if (rand < 0.92) {
          action = () => this.refreshTokenAction();
        } else if (rand < 0.96) {
          action = () => this.rest();
        } else {
          action = () => {
            this.onLog('Simulando un cierre de sesión...', 'thinking');
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
    this.onLog('Simulación finalizada', 'info');
    this.onUpdate(this.getState());
  }

  stop() {
    this.isRunning = false;
    this.onLog('Deteniendo simulación...', 'warn');
  }
}

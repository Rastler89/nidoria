import axios, { AxiosInstance } from 'axios';
import { getSuggestion, getDetailedErrorExplanation } from '../utils/suggestion-engine';

export interface ActionRecord {
  name: string;
  status: number;
  expectedStatus: number | number[];
  expected: boolean;
  timestamp: number;
  thinking?: string;
  suggestion?: string;
  explanation?: string;
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
  private failureCounts: Record<string, number> = {};
  private currentPersonality: 'Explorador' | 'Seguridad' | 'Cauto' = 'Explorador';
  private isWaitingForExpedition: boolean = false;

  constructor(
    private readonly baseUrl: string,
    private readonly onUpdate: (data: any) => void,
    private readonly onLog: (message: string, type: 'info' | 'success' | 'warn' | 'error' | 'thinking') => void
  ) {
    this.username = `bot_${Math.floor(Math.random() * 10000)}`;
    this.email = `${this.username}@ejemplo.com`;
    this.api = axios.create({
      baseURL: this.baseUrl,
      validateStatus: () => true,
    });

    const personalities: ('Explorador' | 'Seguridad' | 'Cauto')[] = ['Explorador', 'Seguridad', 'Cauto'];
    this.currentPersonality = personalities[Math.floor(Math.random() * personalities.length)];
  }

  private async logAction(name: string, response: any, expectedStatus: number | number[], thinking: string) {
    this.stats.totalActions++;
    const status = response.status;
    const isExpected = Array.isArray(expectedStatus)
      ? expectedStatus.includes(status)
      : status === expectedStatus;

    if (!isExpected) {
      this.failureCounts[name] = (this.failureCounts[name] || 0) + 1;
    }

    const record: ActionRecord = {
        name,
        status,
        expectedStatus,
        expected: isExpected,
        timestamp: Date.now(),
        thinking,
        suggestion: !isExpected ? getSuggestion(name, status, response.data) : undefined,
        explanation: !isExpected ? getDetailedErrorExplanation(name, status, expectedStatus, response.data) : undefined
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
      personality: this.currentPersonality,
      history: this.history.slice(-10),
      isRunning: this.isRunning,
      isWaiting: this.isWaitingForExpedition
    };
  }

  private async think(message: string) {
    this.onLog(`[Razonamiento: ${this.currentPersonality}] ${message}`, 'thinking');
  }

  async register() {
    const intent = 'Parece que soy nuevo aquí. Mi primer objetivo es establecer una identidad en el sistema.';
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
    const intent = 'Sin acceso no puedo operar. Voy a solicitar una sesión oficial.';
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
    const intent = 'Necesito verificar quién soy para el sistema y asegurar que mis datos son coherentes.';
    await this.think(intent);
    const res = await this.api.get('/profile');
    await this.logAction('Obtener Perfil', res, 200, intent);
  }

  async getResources() {
    const intent = 'Analizando mi inventario... Necesito saber de qué dispongo para planificar mi siguiente movimiento.';
    await this.think(intent);
    const res = await this.api.get('/resources');
    await this.logAction('Obtener Recursos', res, 200, intent);
    if (res.status === 200) {
        this.resources = res.data;
    }
  }

  async startMission() {
    let type = 'F';
    let intent = '¡Es hora de expandirse! Enviaré una expedición para recolectar suministros básicos.';

    if (this.resources && Array.isArray(this.resources)) {
        // Encontrar el recurso con menos stock
        const minResource = this.resources.reduce((prev, curr) => (prev.stock < curr.stock) ? prev : curr);
        if (minResource && minResource.resource && minResource.resource.type) {
            type = minResource.resource.type;
            intent = `He analizado mis reservas y veo que ando corto de ${type}. Priorizaré su recolección.`;
        }
    }

    await this.think(intent);
    const res = await this.api.post('/mission', {
        type,
        amount: 10,
    });
    await this.logAction('Iniciar Misión', res, [201, 200], intent);

    if (res.status === 201 || res.status === 200) {
        this.isWaitingForExpedition = true;
        const waitIntent = 'Misión iniciada con éxito. Mis hormigas están fuera ahora. Esperaré un tiempo prudencial para simular el delay de la expedición antes de estresarlas con más órdenes.';
        await this.think(waitIntent);
        this.onUpdate(this.getState());

        // Simular espera de 5 segundos para que se vea en el dashboard
        await new Promise(r => setTimeout(r, 5000));

        this.isWaitingForExpedition = false;
        this.onLog('¡Mis hormigas han regresado (o eso asumo)! Estoy listo para continuar.', 'info');
        this.onUpdate(this.getState());
    }
  }

  async tryInvalidMission() {
    const intent = 'Como experto en calidad, voy a intentar forzar una misión con parámetros imposibles para ver si el sistema aguanta.';
    await this.think(intent);
    const res = await this.api.post('/mission', {
        type: 'INVALIDO',
        amount: -999,
    });
    await this.logAction('Misión Inválida', res, [400, 404], intent);
  }

  async tryUnauthorizedAccess() {
    const intent = 'Voy a simular un ataque de acceso directo a zonas protegidas ignorando los protocolos de seguridad.';
    await this.think(intent);
    const oldToken = this.token;
    delete this.api.defaults.headers.common['Authorization'];
    const res = await this.api.get('/profile');
    if (oldToken) this.api.defaults.headers.common['Authorization'] = `Bearer ${oldToken}`;
    await this.logAction('Acceso no Autorizado', res, 401, intent);
  }

  async tryInvalidLogin() {
    const intent = 'Probando la robustez del login mediante el uso de credenciales deliberadamente erróneas.';
    await this.think(intent);
    const res = await this.api.post('/auth/login', {
        username: this.username,
        password: 'password_incorrecto_para_test',
    });
    await this.logAction('Login Inválido', res, 401, intent);
  }

  async refreshTokenAction() {
    const intent = 'Mi seguridad interna me indica que mi sesión podría caducar pronto. Procedo a renovar mis credenciales.';
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
    const intent = 'Optimizando procesos internos. Entraré en modo de bajo consumo para simular inactividad humana.';
    await this.think(intent);
    this.onLog('Inactividad simulada para evadir patrones de detección automáticos.', 'info');
    this.onUpdate(this.getState());
  }

  private decideNextAction(): () => Promise<void> {
    const rand = Math.random();

    // Lógica básica de estado (Obligatorio tener token)
    if (!this.token) {
        if (rand < 0.8) return () => this.login();
        if (rand < 0.9) return () => this.tryUnauthorizedAccess();
        return () => this.tryInvalidLogin();
    }

    // Penalización por fallos: Si una acción falla mucho, la evitamos
    const sortedActions = [
        { weight: 0.35, action: () => this.getResources(), name: 'Obtener Recursos' },
        { weight: 0.30, action: () => this.startMission(), name: 'Iniciar Misión' },
        { weight: 0.10, action: () => this.getProfile(), name: 'Obtener Perfil' },
        { weight: 0.10, action: () => this.tryInvalidMission(), name: 'Misión Inválida' },
        { weight: 0.05, action: () => this.refreshTokenAction(), name: 'Refrescar Token' },
        { weight: 0.05, action: () => this.rest(), name: 'Descansar' },
        { weight: 0.05, action: () => {
            this.onLog('Decisión lógica: Cerrar sesión para probar flujo de re-entrada.', 'thinking');
            this.token = null;
            delete this.api.defaults.headers.common['Authorization'];
            this.onUpdate(this.getState());
            return Promise.resolve();
          }, name: 'Logout' }
    ];

    // Ajustar pesos según personalidad
    if (this.currentPersonality === 'Seguridad') {
        sortedActions.find(a => a.name === 'Misión Inválida')!.weight += 0.2;
        sortedActions.find(a => a.name === 'Logout')!.weight += 0.1;
    } else if (this.currentPersonality === 'Cauto') {
        sortedActions.find(a => a.name === 'Descansar')!.weight += 0.2;
        sortedActions.find(a => a.name === 'Obtener Perfil')!.weight += 0.1;
    }

    // Normalizar pesos y elegir
    let totalWeight = sortedActions.reduce((acc, curr) => acc + curr.weight, 0);
    let r = Math.random() * totalWeight;
    let accumulated = 0;
    for (const item of sortedActions) {
        accumulated += item.weight;
        if (r <= accumulated) return item.action;
    }

    return sortedActions[0].action;
  }

  async run(iterations: number, delay: number) {
    this.isRunning = true;
    this.onLog(`Activando núcleo de IA: ${this.username}. Personalidad asignada: ${this.currentPersonality}`, 'info');
    this.onUpdate(this.getState());

    await this.register();

    for (let i = 0; i < iterations && this.isRunning; i++) {
      const action = this.decideNextAction();
      await action();
      await new Promise(r => setTimeout(r, delay));
    }

    this.isRunning = false;
    this.onLog('Simulación IA finalizada. Desactivando procesos.', 'info');
    this.onUpdate(this.getState());
  }

  stop() {
    this.isRunning = false;
    this.onLog('Interrupción manual detectada. Abortando misión...', 'warn');
  }
}

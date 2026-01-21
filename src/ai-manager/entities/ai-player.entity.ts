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
  url: string;
  params?: any;
}

type Personality = 'Explorador' | 'Seguridad' | 'Cauto' | 'Industrioso';
type Goal = 'SOBREVIVIR' | 'EXPANDIR' | 'AUDITAR' | 'ESTRESAR' | 'HIBERNAR';

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
  private currentPersonality: Personality = 'Explorador';
  private currentGoal: Goal = 'AUDITAR';
  private isWaitingForExpedition: boolean = false;
  private forceLogin: boolean = false;
  private nextActionTimestamp: number = 0;
  private isResumeMode: boolean = false;

  constructor(
    private readonly baseUrl: string,
    private readonly onUpdate: (data: any) => void,
    private readonly onLog: (message: string, type: 'info' | 'success' | 'warn' | 'error' | 'thinking') => void,
    config?: { username?: string, password?: string, isResume?: boolean }
  ) {
    this.username = config?.username || `bot_${Math.floor(Math.random() * 10000)}`;
    this.email = `${this.username}@ejemplo.com`;
    this.password = config?.password || 'Password123!';
    this.isResumeMode = config?.isResume || false;

    this.api = axios.create({
      baseURL: this.baseUrl,
      validateStatus: () => true,
    });

    const personalities: Personality[] = ['Explorador', 'Seguridad', 'Cauto', 'Industrioso'];
    this.currentPersonality = personalities[Math.floor(Math.random() * personalities.length)];
  }

  private async logAction(name: string, response: any, expectedStatus: number | number[], thinking: string, url: string, params?: any) {
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
        explanation: !isExpected ? getDetailedErrorExplanation(name, status, expectedStatus, response.data) : undefined,
        url,
        params
    };
    this.history.push(record);

    if (isExpected) {
      this.stats.success++;
      this.onLog(`[CORRECTO] ${name} - Estado: ${status}`, 'success');
      if (name === 'Login') this.forceLogin = false;
    } else {
      if (status === 401) {
        this.forceLogin = true;
        this.onLog(`[SEGURIDAD] Detectado fallo de autenticación (401). Priorizando re-login.`, 'warn');
      }
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
      goal: this.currentGoal,
      history: this.history,
      isRunning: this.isRunning,
      isWaiting: this.isWaitingForExpedition,
      nextActionIn: Math.max(0, Math.round((this.nextActionTimestamp - Date.now()) / 1000))
    };
  }

  private async think(message: string) {
    this.onLog(`[${this.currentGoal}] ${message}`, 'thinking');
  }

  async register() {
    const url = '/auth/register';
    const params = {
        username: this.username,
        email: this.email,
        password: this.password,
    };
    const intent = 'Parece que soy nuevo aquí. Mi primer objetivo es establecer una identidad en el sistema.';
    await this.think(intent);
    const res = await this.api.post(url, params);
    await this.logAction('Registro', res, [201, 409], intent, url, params);

    if (res.status === 201) {
        this.userId = res.data.id;
        const verificationToken = res.data.token;
        if (verificationToken) {
            await this.verifyAccount(this.userId!, verificationToken);
        }
    }
  }

  async verifyAccount(userId: number, token: string) {
    const url = `/verifyAccount/${userId}/${token}`;
    const intent = 'He recibido mi token de verificación. Procedo a validar mi cuenta para activar el ciclo biológico de mi Reina.';
    await this.think(intent);
    const res = await this.api.get(url);
    await this.logAction('Verificar Cuenta', res, 200, intent, url);
  }

  async login() {
    const url = '/auth/login';
    const params = {
        username: this.username,
        password: this.password,
    };
    const intent = 'Sin acceso no puedo operar. Voy a solicitar una sesión oficial.';
    await this.think(intent);
    const res = await this.api.post(url, params);
    await this.logAction('Login', res, 201, intent, url, params);
    if (res.status === 201) {
      this.token = res.data.access_token;
      this.refreshToken = res.data.refresh_token;
      this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  async getProfile() {
    const url = '/profile';
    const intent = 'Necesito verificar quién soy para el sistema y asegurar que mis datos son coherentes.';
    await this.think(intent);
    const res = await this.api.get(url);
    await this.logAction('Obtener Perfil', res, 200, intent, url);
  }

  async getResources() {
    const url = '/resources';
    const intent = 'Analizando mi inventario... Necesito saber de qué dispongo para planificar mi siguiente movimiento.';
    await this.think(intent);
    const res = await this.api.get(url);
    await this.logAction('Obtener Recursos', res, 200, intent, url);
    if (res.status === 200) {
        this.resources = res.data;
    }
  }

  async startMission() {
    const url = '/mission';
    let type = 'F';
    let intent = '¡Es hora de expandirse! Enviaré una expedición para recolectar suministros básicos.';

    const resourcesArray = this.resources?.resources;

    if (resourcesArray && Array.isArray(resourcesArray) && resourcesArray.length > 0) {
        const minResource = resourcesArray.reduce((prev, curr) => (prev.stock < curr.stock) ? prev : curr);
        if (minResource && minResource.type) {
            type = minResource.type;
            intent = `He analizado mis reservas y veo que ando corto de ${type}. Priorizaré su recolección.`;
        }
    }

    const params = { type, amount: 10 };
    await this.think(intent);
    const res = await this.api.post(url, params);
    await this.logAction('Iniciar Misión', res, [201, 200], intent, url, params);

    if ((res.status === 201 || res.status === 200) && res.data?.duration) {
        this.isWaitingForExpedition = true;
        const durationSeconds = res.data.duration;
        const waitIntent = `Misión iniciada con éxito. Mis hormigas están fuera ahora (Duración: ${durationSeconds}s). Esperaré a que vuelvan para reiniciar el ciclo automáticamente.`;
        await this.think(waitIntent);
        this.onUpdate(this.getState());

        await new Promise(r => setTimeout(r, durationSeconds * 1000));

        this.isWaitingForExpedition = false;
        this.onLog('¡Mis hormigas han regresado! La expedición se reinicia automáticamente en el servidor.', 'info');
        this.onUpdate(this.getState());

        // Estrategia de expansión
        const idleAnts = (this.resources?.ants || 0) - (this.resources?.antsBusy || 0);
        if (idleAnts > 0) {
            const expansionIntent = `Tengo ${idleAnts} hormigas ociosas. Voy a enviarlas a reforzar la expedición de ${type} para aumentar la producción.`;
            await this.think(expansionIntent);
            await this.api.post(url, { type, amount: idleAnts });
            this.onLog(`Refuerzos enviados: +${idleAnts} hormigas a la misión de ${type}.`, 'success');
        }

        setTimeout(() => this.getResources(), 1000);
    }
  }

  async tryInvalidMission() {
    const url = '/mission';
    const params = { type: 'INVALIDO', amount: -999 };
    const intent = 'Como experto en calidad, voy a intentar forzar una misión con parámetros imposibles para ver si el sistema aguanta.';
    await this.think(intent);
    const res = await this.api.post(url, params);
    await this.logAction('Misión Inválida', res, [400, 404], intent, url, params);
  }

  async tryUnauthorizedAccess() {
    const url = '/profile';
    const intent = 'Voy a simular un ataque de acceso directo a zonas protegidas ignorando los protocolos de seguridad.';
    await this.think(intent);
    const oldToken = this.token;
    delete this.api.defaults.headers.common['Authorization'];
    const res = await this.api.get(url);
    if (oldToken) this.api.defaults.headers.common['Authorization'] = `Bearer ${oldToken}`;
    await this.logAction('Acceso no Autorizado', res, 401, intent, url);
  }

  async tryInvalidLogin() {
    const url = '/auth/login';
    const params = { username: this.username, password: 'wrong_password' };
    const intent = 'Probando la robustez del login mediante el uso de credenciales deliberadamente erróneas.';
    await this.think(intent);
    const res = await this.api.post(url, params);
    await this.logAction('Login Inválido', res, 401, intent, url, params);
  }

  async refreshTokenAction() {
    const url = '/auth/refresh';
    const params = { refresh_token: this.refreshToken };
    const intent = 'Mi seguridad interna me indica que mi sesión podría caducar pronto. Procedo a renovar mis credenciales.';
    await this.think(intent);
    if (!this.refreshToken) return;
    const res = await this.api.post(url, params);
    await this.logAction('Refrescar Token', res, 201, intent, url, params);
    if (res.status === 201) {
        this.token = res.data.access_token;
        this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  async rest() {
    const intent = 'Optimizando procesos internos. Entraré en modo de bajo consumo.';
    const growthThoughts = [
        'He observado mi guardería. La Reina está trabajando duro en el desove.',
        'El ciclo biológico toma su tiempo. Paciencia es la clave.',
        'Mis hormigas adultas están manteniendo la colonia.',
        'El proceso automatizado es eficiente.'
    ];
    const thought = Math.random() > 0.5 ? intent : growthThoughts[Math.floor(Math.random() * growthThoughts.length)];
    await this.think(thought);
    this.onLog('Hibernación temporal activada.', 'info');
    this.onUpdate(this.getState());
  }

  async healthCheck() {
    const url = '/';
    const intent = 'Verificando la disponibilidad general del servidor (Health Check).';
    await this.think(intent);
    const res = await this.api.get(url);
    await this.logAction('Health Check', res, 200, intent, url);
  }

  private evaluateGoals() {
    const food = this.resources?.resources?.find(r => r.type === 'F')?.stock || 100;

    if (food < 50) {
        this.currentGoal = 'SOBREVIVIR';
        this.onLog(`[ALERTA] Reservas de comida críticas (${Math.round(food)}). Entrando en modo Supervivencia.`, 'warn');
        return;
    }

    if (this.currentPersonality === 'Seguridad' && Math.random() < 0.3) {
        this.currentGoal = 'ESTRESAR';
        return;
    }

    if (Math.random() < 0.1) {
        this.currentGoal = 'HIBERNAR';
        return;
    }

    if (food > 200) {
        this.currentGoal = 'EXPANDIR';
        return;
    }

    this.currentGoal = 'AUDITAR';
  }

  private decideNextAction(): () => Promise<void> {
    const rand = Math.random();

    if (!this.token || this.forceLogin) {
        return () => this.login();
    }

    this.evaluateGoals();

    switch (this.currentGoal) {
        case 'SOBREVIVIR':
            return () => this.startMission(); // Prioriza comida
        case 'EXPANDIR':
            if (rand < 0.7) return () => this.startMission();
            return () => this.getResources();
        case 'ESTRESAR':
            if (rand < 0.4) return () => this.tryInvalidMission();
            if (rand < 0.7) return () => this.tryUnauthorizedAccess();
            return () => this.tryInvalidLogin();
        case 'HIBERNAR':
            return () => this.rest();
        case 'AUDITAR':
        default:
            if (rand < 0.4) return () => this.getResources();
            if (rand < 0.7) return () => this.getProfile();
            return () => this.healthCheck();
    }
  }

  async run(iterations: number, delay: number) {
    this.isRunning = true;
    const modeText = this.isResumeMode ? 'Reconectando con' : 'Activando núcleo de';
    this.onLog(`${modeText} IA: ${this.username}. Personalidad: ${this.currentPersonality}`, 'info');
    this.onUpdate(this.getState());

    if (this.isResumeMode) {
        const resumeThoughts = [
            'Reconectando con la colonia establecida. Mis hormigas me esperan.',
            'Reanudando operaciones tácticas. El tiempo fuera ha servido para acumular recursos.',
            'Sincronizando con el hormiguero central. Omitiendo protocolos de iniciación.',
            'Continuando labores de supervisión en este sector.'
        ];
        await this.think(resumeThoughts[Math.floor(Math.random() * resumeThoughts.length)]);
    } else {
        await this.register();
    }

    for (let i = 0; i < iterations && this.isRunning; i++) {
      const action = this.decideNextAction();

      // Ritmo Humano: Variar el delay base
      const humanVariability = Math.random() * 1000; // Hasta 1s extra de "pensamiento"
      const actionDelay = delay + humanVariability;

      this.nextActionTimestamp = Date.now() + actionDelay;
      this.onUpdate(this.getState());

      await new Promise(r => setTimeout(r, actionDelay));

      await action();

      // Hibernación real si el objetivo es HIBERNAR
      if (this.currentGoal === 'HIBERNAR') {
        const sleepTime = 10000 + Math.random() * 20000; // 10-30s
        this.onLog(`Bot entrando en hibernación profunda por ${Math.round(sleepTime/1000)}s...`, 'info');
        this.nextActionTimestamp = Date.now() + sleepTime;
        this.onUpdate(this.getState());
        await new Promise(r => setTimeout(r, sleepTime));
      }
    }

    this.isRunning = false;
    this.onLog('Simulación IA finalizada.', 'info');
    this.onUpdate(this.getState());
  }

  stop() {
    this.isRunning = false;
    this.onLog('Interrupción manual. Abortando...', 'warn');
  }
}

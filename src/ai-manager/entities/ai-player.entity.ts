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
  private forceLogin: boolean = false;

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
      history: this.history, // Enviamos todo el historial
      isRunning: this.isRunning,
      isWaiting: this.isWaitingForExpedition
    };
  }

  private async think(message: string) {
    this.onLog(`[Razonamiento: ${this.currentPersonality}] ${message}`, 'thinking');
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
    }
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
        // Encontrar el recurso con menos stock
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

        // Estrategia de expansión: Si tengo hormigas ociosas, las añado a la misión activa
        const idleAnts = (this.resources?.ants || 0) - (this.resources?.antsBusy || 0);
        if (idleAnts > 0) {
            const expansionIntent = `Tengo ${idleAnts} hormigas ociosas. Voy a enviarlas a reforzar la expedición de ${type} para aumentar la producción.`;
            await this.think(expansionIntent);
            await this.api.post(url, { type, amount: idleAnts });
            this.onLog(`Refuerzos enviados: +${idleAnts} hormigas a la misión de ${type}.`, 'success');
        }

        // Auditoría de recursos
        setTimeout(() => this.getResources(), 1000);
    }
  }

  async tryInvalidMission() {
    const url = '/mission';
    const params = {
        type: 'INVALIDO',
        amount: -999,
    };
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
    const params = {
        username: this.username,
        password: 'password_incorrecto_para_test',
    };
    const intent = 'Probando la robustez del login mediante el uso de credenciales deliberadamente erróneas.';
    await this.think(intent);
    const res = await this.api.post(url, params);
    await this.logAction('Login Inválido', res, 401, intent, url, params);
  }

  async refreshTokenAction() {
    const url = '/auth/refresh';
    const params = {
        refresh_token: this.refreshToken,
    };
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
    const intent = 'Optimizando procesos internos. Entraré en modo de bajo consumo para simular inactividad humana.';
    await this.think(intent);
    this.onLog('Inactividad simulada para evadir patrones de detección automáticos.', 'info');
    this.onUpdate(this.getState());
  }

  async produceEgg() {
    const url = '/colony/egg';
    const intent = 'La colonia necesita crecer. Voy a invertir comida para poner un nuevo huevo.';
    await this.think(intent);
    const res = await this.api.post(url);
    await this.logAction('Poner Huevo', res, 201, intent, url);
  }

  async developLarva() {
    const url = '/colony/larva';
    const intent = 'Es hora de que mis huevos eclosionen. Convertiré uno en larva.';
    await this.think(intent);
    const res = await this.api.post(url);
    await this.logAction('Convertir Larva', res, 201, intent, url);
  }

  async matureAnt() {
    const url = '/colony/ant';
    const intent = 'Necesito más mano de obra. Una larva está lista para convertirse en hormiga adulta.';
    await this.think(intent);
    const res = await this.api.post(url);
    await this.logAction('Convertir Hormiga', res, 201, intent, url);
  }

  async healthCheck() {
    const url = '/';
    const intent = 'Verificando la disponibilidad general del servidor (Health Check).';
    await this.think(intent);
    const res = await this.api.get(url);
    await this.logAction('Health Check', res, 200, intent, url);
  }

  private decideNextAction(): () => Promise<void> {
    const rand = Math.random();

    // Lógica básica de estado (Obligatorio tener token o si se forzó login por 401)
    if (!this.token || this.forceLogin) {
        if (rand < 0.9 || this.forceLogin) return () => this.login();
        if (rand < 0.95) return () => this.tryUnauthorizedAccess();
        return () => this.tryInvalidLogin();
    }

    // Penalización por fallos: Si una acción falla mucho, la evitamos
    const sortedActions = [
        { weight: 0.25, action: () => this.getResources(), name: 'Obtener Recursos' },
        { weight: 0.20, action: () => this.startMission(), name: 'Iniciar Misión' },
        { weight: 0.15, action: () => this.produceEgg(), name: 'Poner Huevo' },
        { weight: 0.10, action: () => this.developLarva(), name: 'Convertir Larva' },
        { weight: 0.10, action: () => this.matureAnt(), name: 'Convertir Hormiga' },
        { weight: 0.05, action: () => this.getProfile(), name: 'Obtener Perfil' },
        { weight: 0.05, action: () => this.tryInvalidMission(), name: 'Misión Inválida' },
        { weight: 0.03, action: () => this.healthCheck(), name: 'Health Check' },
        { weight: 0.03, action: () => this.refreshTokenAction(), name: 'Refrescar Token' },
        { weight: 0.02, action: () => this.rest(), name: 'Descansar' },
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

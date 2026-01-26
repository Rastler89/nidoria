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

export interface KnowledgeItem {
  successes: number;
  failures: number;
  lastStatus: number;
  reliability: number; // 0 to 1
  lastError?: string;
  lastThinking?: string;
  lastSuggestion?: string;
  lastTimestamp?: number;
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

  // Learning System
  private level: number = 1;
  private xp: number = 0;
  private knowledge: Record<string, KnowledgeItem> = {};
  private actionWeights: Record<string, number> = {
    'Obtener Recursos': 0.35,
    'Iniciar Misión': 0.30,
    'Obtener Perfil': 0.10,
    'Misión Inválida': 0.10,
    'Health Check': 0.05,
    'Refrescar Token': 0.05,
    'Descansar': 0.05
  };

  private resources: any = null;
  private lastFoodStock: number | null = null;
  private foodDelta: number = 0; // Simple trend
  private failureCounts: Record<string, number> = {};
  private currentPersonality: Personality = 'Explorador';
  private lastThinking: string = 'Iniciando sistema...';
  private currentGoal: Goal = 'AUDITAR';
  private isWaitingForExpedition: boolean = false;
  private forceLogin: boolean = false;
  private nextActionTimestamp: number = 0;
  private isResumeMode: boolean = false;

  constructor(
    private readonly baseUrl: string,
    private readonly onUpdate: (data: any) => void,
    private readonly onLog: (message: string, type: 'info' | 'success' | 'warn' | 'error' | 'thinking') => void,
    config?: { username?: string, password?: string, isResume?: boolean, personality?: Personality | 'Aleatorio' }
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
    this.currentPersonality = (config?.personality && config.personality !== 'Aleatorio')
      ? config.personality
      : personalities[Math.floor(Math.random() * personalities.length)];
  }

  private async logAction(name: string, response: any, expectedStatus: number | number[], thinking: string, url: string, params?: any) {
    this.stats.totalActions++;
    const status = response.status;
    const isExpected = Array.isArray(expectedStatus)
      ? expectedStatus.includes(status)
      : status === expectedStatus;

    // Update Knowledge
    if (!this.knowledge[name]) {
        this.knowledge[name] = { successes: 0, failures: 0, lastStatus: status, reliability: 1 };
    }
    const k = this.knowledge[name];
    k.lastStatus = status;
    if (isExpected) {
        k.successes++;
        this.gainXP(10);
    } else {
        k.failures++;
        this.failureCounts[name] = (this.failureCounts[name] || 0) + 1;
        this.gainXP(2);
    }
    k.reliability = k.successes / (k.successes + k.failures);
    k.lastTimestamp = Date.now();
    k.lastThinking = thinking;

    const record: ActionRecord = {
        name,
        status,
        expectedStatus,
        expected: isExpected,
        timestamp: k.lastTimestamp,
        thinking,
        suggestion: !isExpected ? getSuggestion(name, status, response.data) : undefined,
        explanation: !isExpected ? getDetailedErrorExplanation(name, status, expectedStatus, response.data) : undefined,
        url,
        params
    };

    if (!isExpected) {
        k.lastError = record.explanation;
        k.lastSuggestion = record.suggestion;
    } else {
        k.lastError = undefined;
        k.lastSuggestion = undefined;
    }

    this.history.push(record);
    if (this.history.length > 100) this.history.shift();

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

      this.evolveWeights();
    }

    this.onUpdate(this.getState());
  }

  private gainXP(amount: number) {
    this.xp += amount;
    const xpNeeded = this.level * 100;
    if (this.xp >= xpNeeded) {
        this.level++;
        this.xp -= xpNeeded;
        this.onLog(`✨ ¡Evolución! La IA ha subido al Nivel ${this.level}. Sus algoritmos de decisión son ahora más precisos.`, 'success');
        this.evolveWeights();
    }
  }

  private evolveWeights() {
    this.onLog('🧠 Analizando patrones de éxito y optimizando pesos de decisión...', 'info');

    for (const actionName in this.knowledge) {
        const k = this.knowledge[actionName];
        if (this.actionWeights[actionName] !== undefined) {
            const factor = Math.max(0.1, k.reliability);
            this.actionWeights[actionName] *= factor;

            if (k.reliability < 0.5 && k.failures > 2) {
                this.onLog(`Autocorrección: He detectado fallos recurrentes en "${actionName}". Marcando como zona inestable y reduciendo prioridad al ${Math.round(this.actionWeights[actionName]*100)}%.`, 'warn');
            }
        }
    }

    if (this.knowledge['Iniciar Misión']?.reliability > 0.8) {
        this.actionWeights['Iniciar Misión'] *= 1.2;
    }

    let total = 0;
    for (const key in this.actionWeights) total += this.actionWeights[key];
    for (const key in this.actionWeights) this.actionWeights[key] /= total;
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
      nextActionIn: Math.max(0, Math.round((this.nextActionTimestamp - Date.now()) / 1000)),
      level: this.level,
      xp: this.xp,
      xpNeeded: this.level * 100,
      knowledge: this.knowledge,
      foodTrend: this.foodDelta > 0 ? 'UP' : (this.foodDelta < 0 ? 'DOWN' : 'STABLE'),
      lastThinking: this.lastThinking
    };
  }

  private async think(message: string) {
    this.lastThinking = message;
    this.onLog(`[${this.currentGoal}] ${message}`, 'thinking');
    this.onUpdate(this.getState());
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
      await this.getResources(); // Carga inicial de recursos
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
        const currentFood = res.data?.resources?.find(r => r.type === 'F')?.stock || 0;
        if (this.lastFoodStock !== null) {
            this.foodDelta = currentFood - this.lastFoodStock;
        }
        this.lastFoodStock = currentFood;
        this.resources = res.data;
    }
  }

  async startMission() {
    const url = '/mission';
    let type = 'F';
    let intent = '¡Es hora de expandirse! Enviaré una expedición para recolectar suministros básicos.';

    const resourcesArray = this.resources?.resources;
    const foodStock = resourcesArray?.find(r => r.type === 'F')?.stock || 0;

    if (resourcesArray && Array.isArray(resourcesArray) && resourcesArray.length > 0) {
        // Regla crítica: Si la comida es baja (< 70 para asegurar el margen de 50), priorizar siempre comida
        if (foodStock < 70) {
            type = 'F';
            intent = `Alerta: Mis reservas de comida son peligrosamente bajas (${Math.round(foodStock)}). Mi prioridad absoluta es alimentar a la Reina y asegurar la puesta de huevos.`;
        } else {
            // Según personalidad
            switch (this.currentPersonality) {
                case 'Industrioso':
                    type = 'W'; // Madera para construir
                    intent = `Como Industrioso, mi objetivo es expandir la infraestructura. Priorizaré la recolección de Madera para futuras construcciones.`;
                    break;
                case 'Explorador':
                    // Busca el recurso con menos stock (balanceo)
                    const minRes = resourcesArray.reduce((prev, curr) => (prev.stock < curr.stock) ? prev : curr);
                    type = minRes.type;
                    intent = `Explorando el entorno... He detectado que andamos cortos de ${type}. Voy a equilibrar nuestras reservas.`;
                    break;
                case 'Cauto':
                case 'Seguridad':
                    type = 'F';
                    intent = `La seguridad de la colonia es lo primero. Mantendré un flujo constante de Comida para prevenir cualquier imprevisto biológico.`;
                    break;
                default:
                    type = 'F';
            }
        }
    }

    const params = { type, amount: 10 };
    await this.think(intent);
    const res = await this.api.post(url, params);
    await this.logAction('Iniciar Misión', res, [201, 200], intent, url, params);

    if ((res.status === 201 || res.status === 200) && res.data?.duration) {
        this.isWaitingForExpedition = true;
        const durationSeconds = res.data.duration;

        // Update timer to show mission duration
        this.nextActionTimestamp = Date.now() + (durationSeconds * 1000);

        const waitIntent = `Misión iniciada con éxito. Mis hormigas están fuera ahora (Duración: ${durationSeconds}s). Esperaré a que vuelvan para reiniciar el ciclo automáticamente.`;
        await this.think(waitIntent);
        this.onUpdate(this.getState());

        await new Promise(r => setTimeout(r, durationSeconds * 1000));

        this.isWaitingForExpedition = false;
        this.nextActionTimestamp = Date.now() + 1000; // Small buffer
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

    if (Math.random() < 0.05) {
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

    const actionMap: Record<string, () => Promise<void>> = {
        'Obtener Recursos': () => this.getResources(),
        'Iniciar Misión': () => this.startMission(),
        'Obtener Perfil': () => this.getProfile(),
        'Misión Inválida': () => this.tryInvalidMission(),
        'Health Check': () => this.healthCheck(),
        'Refrescar Token': () => this.refreshTokenAction(),
        'Descansar': () => this.rest()
    };

    if (this.currentGoal === 'SOBREVIVIR') return actionMap['Iniciar Misión'];
    if (this.currentGoal === 'HIBERNAR') return actionMap['Descansar'];
    if (this.currentGoal === 'ESTRESAR') {
        if (rand < 0.4) return actionMap['Misión Inválida'];
        if (rand < 0.7) return () => this.tryUnauthorizedAccess();
        return () => this.tryInvalidLogin();
    }

    let accumulated = 0;
    const r = Math.random();
    for (const name in this.actionWeights) {
        accumulated += this.actionWeights[name];
        if (r <= accumulated) return actionMap[name];
    }

    return actionMap['Obtener Recursos'];
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

      const humanVariability = Math.random() * 1000;
      const actionDelay = delay + humanVariability;

      this.nextActionTimestamp = Date.now() + actionDelay;
      this.onUpdate(this.getState());

      await new Promise(r => setTimeout(r, actionDelay));

      await action();

      if (this.currentGoal === 'HIBERNAR') {
        const sleepTime = 10000 + Math.random() * 20000;
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

  // Manual Overrides
  async forceAction(actionName: string) {
    this.onLog(`[COMANDO MANUAL] Ejecutando forzosamente: ${actionName}`, 'warn');
    switch (actionName) {
        case 'Login': await this.login(); break;
        case 'Recursos': await this.getResources(); break;
        case 'Misión': await this.startMission(); break;
        case 'Perfil': await this.getProfile(); break;
        case 'Salud': await this.healthCheck(); break;
        case 'Refresh': await this.refreshTokenAction(); break;
    }
  }

  stop() {
    this.isRunning = false;
    this.onLog('Interrupción manual. Abortando...', 'warn');
  }
}

import axios, { AxiosInstance } from 'axios';

/**
 * 🐜 Standalone Intelligent AI Player CLI for Nidoria
 * Este script interactúa con la API con lógica de decisión avanzada, ritmo humano y aprendizaje.
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
  expectedStatus: number | number[];
  expected: boolean;
  timestamp: number;
  suggestion?: string;
  thinking?: string;
  explanation?: string;
  url: string;
  params?: any;
}

type Goal = 'SOBREVIVIR' | 'EXPANDIR' | 'AUDITAR' | 'ESTRESAR' | 'HIBERNAR';

class AIPlayer {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private userId: number | null = null;
  private username: string = `bot_${Math.floor(Math.random() * 10000)}`;
  private email: string = `${this.username}@ejemplo.com`;
  private password: string = 'Password123!';
  private api: AxiosInstance;

  private history: ActionRecord[] = [];
  private stats = {
    totalActions: 0,
    success: 0,
    failures: 0,
    unexpectedErrors: 0,
  };

  private level: number = 1;
  private xp: number = 0;
  private resources: any = null;
  private personality: string;
  private currentGoal: Goal = 'AUDITAR';
  private forceLogin: boolean = false;

  constructor(private baseUrl: string) {
    this.api = axios.create({
      baseURL: this.baseUrl,
      validateStatus: () => true,
    });
    const personalities = ['Analista', 'Agresivo', 'Curioso', 'Industrioso'];
    this.personality = personalities[Math.floor(Math.random() * personalities.length)];
  }

  private colorize(text: string, color: string) {
    return `${color}${text}${COLORS.reset}`;
  }

  private printDashboard() {
    console.log('\n' + this.colorize('─'.repeat(50), COLORS.blue));
    console.log(this.colorize(` 🤖 IA LVL ${this.level} | ${this.personality} | OBJETIVO: ${this.currentGoal}`, COLORS.bright + COLORS.bgBlue));
    console.log(` 👤 Sujeto: ${this.colorize(this.username, COLORS.cyan)}`);
    console.log(` 🔑 Acceso: ${this.token ? this.colorize('AUTORIZADO', COLORS.green) : this.colorize('RESTRINGIDO', COLORS.red)}`);
    if (this.resources) {
      console.log(` 📦 Población: 🥚${this.resources.eggs} 🐛${this.resources.larva} 🐜${this.resources.ants}`);
    }
    console.log(this.colorize('─'.repeat(50), COLORS.blue));
  }

  private gainXP(amount: number) {
    this.xp += amount;
    if (this.xp >= this.level * 100) {
        this.level++;
        this.xp = 0;
        console.log(this.colorize(`\n✨ ¡EVOLUCIÓN! La IA ha subido al Nivel ${this.level}. Sus procesos son más eficientes.`, COLORS.green + COLORS.bright));
    }
  }

  private getSuggestion(action: string, status: number, data: any): string {
    if (status === 401) return 'El token ha expirado. Prueba a loguearte de nuevo.';
    if (status === 404 && action.includes('Misión')) return 'Recurso no encontrado. Asegúrate de que el tipo de recurso (F, W o L) exista en la base de datos.';
    if (status === 409) return 'Conflicto. El usuario ya existe o hay un duplicado.';
    if (status >= 500) return 'Error interno (Bug). Revisa los logs del servidor.';
    return 'Revisa los parámetros de la petición.';
  }

  private getExplanation(status: number, expectedStatus: number | number[]): string {
    const expectedStr = Array.isArray(expectedStatus) ? expectedStatus.join(' o ') : expectedStatus;
    return `Se esperaba ${expectedStr} pero se recibió ${status}.`;
  }

  async logAction(name: string, response: any, expectedStatus: number | number[], thinking: string, url: string, params?: any) {
    this.stats.totalActions++;
    const status = response.status;
    const isExpected = Array.isArray(expectedStatus)
      ? expectedStatus.includes(status)
      : status === expectedStatus;

    if (isExpected) this.gainXP(10);
    else this.gainXP(2);

    const suggestion = !isExpected ? this.getSuggestion(name, status, response.data) : undefined;
    const explanation = !isExpected ? this.getExplanation(status, expectedStatus) : undefined;

    this.history.push({
        name,
        status,
        expectedStatus,
        expected: isExpected,
        timestamp: Date.now(),
        suggestion,
        thinking,
        explanation,
        url,
        params
    });

    if (isExpected) {
      this.stats.success++;
      console.log(`${this.colorize('[CORRECTO]', COLORS.green)} ${name} - Estado: ${status}`);
      if (name === 'Login') this.forceLogin = false;
    } else {
      if (status === 401) this.forceLogin = true;
      if (status >= 500) {
        this.stats.unexpectedErrors++;
        console.error(`${this.colorize('[CRÍTICO]', COLORS.red)} ${name} - Error inesperado: ${status}`);
      } else {
        this.stats.failures++;
        console.warn(`${this.colorize('[FALLO]', COLORS.yellow)} ${name} - Estado: ${status} (Esperado: ${expectedStatus})`);
      }
    }
  }

  async register() {
    const url = '/auth/register';
    const params = { username: this.username, email: this.email, password: this.password };
    const intent = 'Estableciendo identidad inicial.';
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
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
    const intent = 'Validando cuenta para activar ciclo biológico.';
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
    const res = await this.api.get(url);
    await this.logAction('Verificar Cuenta', res, 200, intent, url);
  }

  async login() {
    const url = '/auth/login';
    const params = { username: this.username, password: this.password };
    const intent = 'Solicitando acceso al sistema central.';
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
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
    const intent = 'Auditoría de integridad de datos.';
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
    const res = await this.api.get(url);
    await this.logAction('Obtener Perfil', res, 200, intent, url);
  }

  async getResources() {
    const url = '/resources';
    const intent = 'Escaneo de inventario y estado de la colonia.';
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
    const res = await this.api.get(url);
    await this.logAction('Obtener Recursos', res, 200, intent, url);
    if (res.status === 200) {
        this.resources = res.data;
    }
  }

  async startMission() {
    const url = '/mission';
    let type = 'F';
    let intent = 'Iniciando recolección estándar.';

    const resArr = this.resources?.resources;
    if (resArr && Array.isArray(resArr) && resArr.length > 0) {
        const minRes = resArr.reduce((prev, curr) => (prev.stock < curr.stock) ? prev : curr);
        if (minRes) {
            type = minRes.type;
            intent = `Reservas bajas de ${type}. Priorizando recolección.`;
        }
    }

    const params = { type, amount: 10 };
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
    const res = await this.api.post(url, params);
    await this.logAction('Iniciar Misión', res, [201, 200], intent, url, params);

    if ((res.status === 201 || res.status === 200) && res.data?.duration) {
        const duration = res.data.duration;
        console.log(this.colorize(`\n[PENSAMIENTO] Misión en curso. Esperando ${duration}s...`, COLORS.yellow));
        await new Promise(r => setTimeout(r, duration * 1000));

        const idle = (this.resources?.ants || 0) - (this.resources?.antsBusy || 0);
        if (idle > 0) {
            console.log(this.colorize(`Reforzando misión con ${idle} hormigas ociosas.`, COLORS.cyan));
            await this.api.post(url, { type, amount: idle });
        }

        setTimeout(() => this.getResources(), 1000);
    }
  }

  async tryInvalidMission() {
    const url = '/mission';
    const params = { type: 'MALFORMED', amount: -1 };
    const intent = 'Prueba de penetración en el módulo de misiones.';
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
    const res = await this.api.post(url, params);
    await this.logAction('Misión Inválida', res, [400, 404], intent, url, params);
  }

  async tryUnauthorizedAccess() {
    const url = '/profile';
    const intent = 'Intento de bypass de seguridad.';
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
    const old = this.api.defaults.headers.common['Authorization'];
    delete this.api.defaults.headers.common['Authorization'];
    const res = await this.api.get(url);
    if (old) this.api.defaults.headers.common['Authorization'] = old;
    await this.logAction('Acceso no Autorizado', res, 401, intent, url);
  }

  async healthCheck() {
    const url = '/';
    const intent = 'Verificando latencia y salud del servidor.';
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
    const res = await this.api.get(url);
    await this.logAction('Health Check', res, 200, intent, url);
  }

  private evaluateGoals() {
    const food = this.resources?.resources?.find(r => r.type === 'F')?.stock || 100;
    if (food < 50) this.currentGoal = 'SOBREVIVIR';
    else if (Math.random() < 0.1) this.currentGoal = 'HIBERNAR';
    else if (food > 200) this.currentGoal = 'EXPANDIR';
    else this.currentGoal = 'AUDITAR';
  }

  private decideNextAction(): () => Promise<void> {
    const rand = Math.random();
    if (!this.token || this.forceLogin) return () => this.login();
    this.evaluateGoals();

    switch (this.currentGoal) {
        case 'SOBREVIVIR': return () => this.startMission();
        case 'EXPANDIR': return rand < 0.7 ? () => this.startMission() : () => this.getResources();
        case 'HIBERNAR': return () => {
            console.log(this.colorize('[HIBERNACIÓN] El bot está descansando...', COLORS.blue));
            return Promise.resolve();
        };
        case 'AUDITAR':
        default:
            if (rand < 0.5) return () => this.getResources();
            return () => this.getProfile();
    }
  }

  async performAnalysis() {
    console.log('\n' + this.colorize('═'.repeat(60), COLORS.bright + COLORS.cyan));
    console.log(this.colorize(` 📈 INFORME TÉCNICO DE LA IA (NIVEL ${this.level})`, COLORS.bright + COLORS.bgBlue));

    const errors = this.history.filter(h => !h.expected);
    if (errors.length === 0) {
        console.log(this.colorize('\n ✨ Sin anomalías. Sistemas optimizados.', COLORS.green));
    } else {
        console.log(this.colorize(`\n ⚠️ Detectadas ${errors.length} anomalías:`, COLORS.yellow));
        errors.forEach(err => {
            const color = err.status >= 500 ? COLORS.red : COLORS.yellow;
            console.log(`   - [${err.name}] -> Recibido ${this.colorize(err.status.toString(), color)} (Esperado: ${err.expectedStatus})`);
            console.log(`     URL: ${err.url}`);
            if (err.explanation) console.log(`     ❓ ${err.explanation}`);
            if (err.suggestion) console.log(`     💡 ${err.suggestion}`);
        });
    }
    console.log(this.colorize('\n 📊 Estadísticas Finales:', COLORS.bright));
    console.log(` - Eficiencia: ${((this.stats.success / this.stats.totalActions) * 100).toFixed(2)}%`);
    console.log(` - Ciclos: ${this.stats.totalActions}`);
    console.log(this.colorize('═'.repeat(60), COLORS.bright + COLORS.cyan));
  }

  async run(iterations: number, delay: number) {
    console.log(this.colorize(`\n--- 🐜 Núcleo IA CLI: ${this.username} ---`, COLORS.bright + COLORS.cyan));
    await this.register();

    for (let i = 0; i < iterations; i++) {
      this.printDashboard();
      const action = this.decideNextAction();
      const variability = Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay + variability));
      await action();
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
  process.exit(success ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

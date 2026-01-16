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
    console.log(this.colorize(' 🤖 DASHBOARD DE ESTADO DEL BOT', COLORS.bright + COLORS.bgBlue));
    console.log(` 👤 Usuario: ${this.colorize(this.username, COLORS.cyan)}`);
    console.log(` 🔑 Token: ${this.token ? this.colorize('ACTIVO', COLORS.green) : this.colorize('AUSENTE', COLORS.red)}`);
    if (this.resources) {
      console.log(` 📦 Recursos: ${JSON.stringify(this.resources)}`);
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
      console.log(`${this.colorize('[CORRECTO]', COLORS.green)} ${name} - Estado: ${status}`);
    } else {
      if (status >= 500) {
        this.stats.unexpectedErrors++;
        console.error(`${this.colorize('[CRÍTICO]', COLORS.red)} ${name} - Error inesperado del servidor: ${status}`);
        console.error(this.colorize(JSON.stringify(response.data, null, 2), COLORS.red));
      } else {
        this.stats.failures++;
        console.warn(`${this.colorize('[FALLO]', COLORS.yellow)} ${name} - Estado: ${status} (Esperado: ${expectedStatus})`);
        console.warn(this.colorize(JSON.stringify(response.data, null, 2), COLORS.yellow));
      }
    }
  }

  async register() {
    console.log(this.colorize('\n[PENSANDO] Necesito crear una cuenta para empezar a jugar...', COLORS.magenta));
    const res = await this.api.post('/auth/register', {
        username: this.username,
        email: this.email,
        password: this.password,
    });
    await this.logAction('Registro', res, [201, 409]);
    if (res.status === 201) {
        this.userId = res.data.id;
    }
  }

  async login() {
    console.log(this.colorize('\n[PENSANDO] Autenticándome para obtener mi token de acceso...', COLORS.magenta));
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
    console.log(this.colorize('\n[PENSANDO] Revisando los datos de mi perfil...', COLORS.magenta));
    const res = await this.api.get('/profile');
    await this.logAction('Obtener Perfil', res, 200);
  }

  async getResources() {
    console.log(this.colorize('\n[PENSANDO] ¿Cuántas semillas y hojas tengo?', COLORS.magenta));
    const res = await this.api.get('/resources');
    await this.logAction('Obtener Recursos', res, 200);
    if (res.status === 200) {
        this.resources = res.data;
    }
  }

  async startMission() {
    console.log(this.colorize('\n[PENSANDO] ¡Enviando hormigas a una expedición!', COLORS.magenta));
    const res = await this.api.post('/mission', {
        type: 'F',
        amount: 10,
    });
    await this.logAction('Iniciar Misión', res, [201, 200]);
  }

  async tryInvalidMission() {
    console.log(this.colorize('\n[PENSANDO] Probando la resiliencia del sistema con una misión inválida...', COLORS.magenta));
    const res = await this.api.post('/mission', {
        type: 'INVALID_TYPE',
        amount: -1,
    });
    await this.logAction('Misión Inválida', res, [400, 404]);
  }

  async tryUnauthorizedAccess() {
    console.log(this.colorize('\n[PENSANDO] Intentando acceder a un área restringida sin token...', COLORS.magenta));
    const oldToken = this.api.defaults.headers.common['Authorization'];
    delete this.api.defaults.headers.common['Authorization'];
    const res = await this.api.get('/profile');
    if (oldToken) this.api.defaults.headers.common['Authorization'] = oldToken;
    await this.logAction('Acceso no Autorizado', res, 401);
  }

  async tryInvalidLogin() {
    console.log(this.colorize('\n[PENSANDO] Probando la seguridad con credenciales erróneas...', COLORS.magenta));
    const res = await this.api.post('/auth/login', {
        username: this.username,
        password: 'wrong_password',
    });
    await this.logAction('Login Inválido', res, 401);
  }

  async refreshTokenAction() {
    console.log(this.colorize('\n[PENSANDO] Mi token podría ser antiguo, vamos a refrescarlo...', COLORS.magenta));
    if (!this.refreshToken) return;
    const res = await this.api.post('/auth/refresh', {
        refresh_token: this.refreshToken,
    });
    await this.logAction('Refrescar Token', res, 201);
    if (res.status === 201) {
        this.token = res.data.access_token;
        this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  async rest() {
    console.log(this.colorize('\n[PENSANDO] Estoy cansado, voy a descansar un poco...', COLORS.magenta));
    console.log(this.colorize('El bot está descansando y no hace nada...', COLORS.blue));
  }

  async performAnalysis() {
    console.log('\n' + this.colorize('═'.repeat(60), COLORS.bright + COLORS.cyan));
    console.log(this.colorize(' 📈 REPORTE ANALÍTICO POST-EJECUCIÓN', COLORS.bright + COLORS.bgBlue));

    const errors = this.history.filter(h => !h.expected);
    if (errors.length === 0) {
        console.log(this.colorize('\n ✨ No se detectaron anomalías. Todos los flujos siguieron el comportamiento esperado.', COLORS.green));
    } else {
        console.log(this.colorize(`\n ⚠️ Se detectaron ${errors.length} comportamientos inesperados:`, COLORS.yellow));
        errors.forEach(err => {
            const color = err.status >= 500 ? COLORS.red : COLORS.yellow;
            console.log(`   - [${err.name}] devolvió ${this.colorize(err.status.toString(), color)}`);
        });

        const criticals = errors.filter(e => e.status >= 500);
        if (criticals.length > 0) {
            console.log(this.colorize('\n 🔥 ANÁLISIS CRÍTICO:', COLORS.red + COLORS.bright));
            console.log(' El servidor falló o devolvió errores internos. Revisa los logs para ver las trazas de error.');
        }
    }

    console.log(this.colorize('\n 📊 Resumen de Métricas:', COLORS.bright));
    console.log(` - Tasa de Éxito: ${((this.stats.success / this.stats.totalActions) * 100).toFixed(2)}%`);
    console.log(` - Acciones Totales: ${this.stats.totalActions}`);
    console.log(this.colorize('═'.repeat(60), COLORS.bright + COLORS.cyan));
  }

  async run(iterations: number, delay: number) {
    console.log(this.colorize(`\n--- 🐜 Iniciando AI Player Standalone: ${this.username} ---`, COLORS.bright + COLORS.cyan));
    console.log(`API Objetivo: ${this.baseUrl}\n`);

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
            console.log(this.colorize('\n[PENSANDO] Simulando un cierre de sesión...', COLORS.magenta));
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

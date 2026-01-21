import axios, { AxiosInstance } from 'axios';

/**
 * 🐜 Standalone Intelligent AI Player CLI for Nidoria
 * Este script interactúa con la API con lógica de decisión avanzada.
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
  private personality: string;

  constructor(private baseUrl: string) {
    this.api = axios.create({
      baseURL: this.baseUrl,
      validateStatus: () => true,
    });
    const personalities = ['Analista', 'Agresivo', 'Curioso'];
    this.personality = personalities[Math.floor(Math.random() * personalities.length)];
  }

  private colorize(text: string, color: string) {
    return `${color}${text}${COLORS.reset}`;
  }

  private printDashboard() {
    console.log('\n' + this.colorize('─'.repeat(50), COLORS.blue));
    console.log(this.colorize(` 🤖 MODO IA ACTIVADO: ${this.personality}`, COLORS.bright + COLORS.bgBlue));
    console.log(` 👤 Sujeto: ${this.colorize(this.username, COLORS.cyan)}`);
    console.log(` 🔑 Acceso: ${this.token ? this.colorize('AUTORIZADO', COLORS.green) : this.colorize('RESTRINGIDO', COLORS.red)}`);
    if (this.resources) {
      console.log(` 📦 Reservas: ${JSON.stringify(this.resources)}`);
    }
    console.log(this.colorize('─'.repeat(50), COLORS.blue));
  }

  private getSuggestion(action: string, status: number, data: any): string {
    if (status === 401) return 'El token ha expirado. Prueba a loguearte de nuevo.';
    if (status === 404 && action.includes('Misión')) return 'Recurso no encontrado. Asegúrate de que el tipo de recurso (F, W o L) exista en la base de datos.';
    if (status === 409) return 'Conflicto. El usuario ya existe o hay un duplicado.';
    if (status >= 500) {
      if (action.includes('Registro')) return 'Error de servidor. Revisa el MailerService (configuración SMTP).';
      if (action.includes('Misión')) return 'Error de servidor. Revisa Bull/Redis y las relaciones de la BD.';
      return 'Error interno (Bug). Revisa los logs del servidor.';
    }
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
    } else {
      if (status >= 500) {
        this.stats.unexpectedErrors++;
        console.error(`${this.colorize('[CRÍTICO]', COLORS.red)} ${name} - Error inesperado: ${status}`);
        console.error(this.colorize(JSON.stringify(response.data, null, 2), COLORS.red));
      } else {
        this.stats.failures++;
        console.warn(`${this.colorize('[FALLO]', COLORS.yellow)} ${name} - Estado: ${status} (Esperado: ${expectedStatus})`);
      }
    }
  }

  async register() {
    const url = '/auth/register';
    const params = {
        username: this.username,
        email: this.email,
        password: this.password,
    };
    const intent = 'Iniciando fase de registro. Necesito una identidad válida en el sistema.';
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
    const intent = 'He recibido el token de verificación. Validando cuenta para activar la colonia.';
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
    const res = await this.api.get(url);
    await this.logAction('Verificar Cuenta', res, 200, intent, url);
  }

  async login() {
    const url = '/auth/login';
    const params = {
        username: this.username,
        password: this.password,
    };
    const intent = 'Solicitando acceso al sistema central para operaciones avanzadas.';
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
    const intent = 'Auditoría de perfil: Comprobando integridad de mis datos de usuario.';
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
    const res = await this.api.get(url);
    await this.logAction('Obtener Perfil', res, 200, intent, url);
  }

  async getResources() {
    const url = '/resources';
    const intent = 'Escaneando inventario para optimizar la toma de decisiones futuras.';
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
    let intent = 'Iniciando expedición logística estándar.';

    if (this.resources && Array.isArray(this.resources)) {
        const minResource = this.resources.reduce((prev, curr) => (prev.stock < curr.stock) ? prev : curr);
        if (minResource && minResource.resource) {
            type = minResource.resource.type;
            intent = `Detectadas reservas bajas de ${type}. Ajustando objetivo de expedición para compensar.`;
        }
    }

    const params = { type, amount: 10 };
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
    const res = await this.api.post(url, params);
    await this.logAction('Iniciar Misión', res, [201, 200], intent, url, params);

    if ((res.status === 201 || res.status === 200) && res.data?.duration) {
        const duration = res.data.duration;
        console.log(this.colorize(`\n[PENSAMIENTO] Misión en curso. Esperando ${duration}s a que las hormigas trabajen...`, COLORS.yellow));
        await new Promise(r => setTimeout(r, duration * 1000));
        console.log(this.colorize('Las hormigas han vuelto. Procediendo con el siguiente ciclo.', COLORS.blue));

        // Follow up
        setTimeout(() => this.getResources(), 1000);
    }
  }

  async tryInvalidMission() {
    const url = '/mission';
    const params = {
        type: 'MALFORMED',
        amount: -1,
    };
    const intent = 'Ejecutando prueba de penetración en el módulo de misiones.';
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
    const res = await this.api.post(url, params);
    await this.logAction('Misión Inválida', res, [400, 404], intent, url, params);
  }

  async tryUnauthorizedAccess() {
    const url = '/profile';
    const intent = 'Intentando bypass de autenticación para probar perímetros de seguridad.';
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
    const oldToken = this.api.defaults.headers.common['Authorization'];
    delete this.api.defaults.headers.common['Authorization'];
    const res = await this.api.get(url);
    if (oldToken) this.api.defaults.headers.common['Authorization'] = oldToken;
    await this.logAction('Acceso no Autorizado', res, 401, intent, url);
  }

  async tryInvalidLogin() {
    const url = '/auth/login';
    const params = {
        username: this.username,
        password: 'wrong_password',
    };
    const intent = 'Fuerza bruta controlada: Probando resistencia ante credenciales inválidas.';
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
    const res = await this.api.post(url, params);
    await this.logAction('Login Inválido', res, 401, intent, url, params);
  }

  async refreshTokenAction() {
    const url = '/auth/refresh';
    const params = {
        refresh_token: this.refreshToken,
    };
    const intent = 'Protocolo de seguridad: Rotación preventiva de tokens de acceso.';
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
    if (!this.refreshToken) return;
    const res = await this.api.post(url, params);
    await this.logAction('Refrescar Token', res, 201, intent, url, params);
    if (res.status === 201) {
        this.token = res.data.access_token;
        this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  async rest() {
    const intent = 'Entrando en modo de hibernación para reducir mi huella digital.';
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
    console.log(this.colorize('El bot está procesando datos en segundo plano...', COLORS.blue));
  }

  async healthCheck() {
    const url = '/';
    const intent = 'Verificando la disponibilidad general del servidor (Health Check).';
    console.log(this.colorize(`\n[PENSAMIENTO] ${intent}`, COLORS.magenta));
    const res = await this.api.get(url);
    await this.logAction('Health Check', res, 200, intent, url);
  }

  async performAnalysis() {
    console.log('\n' + this.colorize('═'.repeat(60), COLORS.bright + COLORS.cyan));
    console.log(this.colorize(' 📈 INFORME TÉCNICO DE LA IA', COLORS.bright + COLORS.bgBlue));

    const errors = this.history.filter(h => !h.expected);
    if (errors.length === 0) {
        console.log(this.colorize('\n ✨ Optimización perfecta. Todos los sistemas operativos al 100%.', COLORS.green));
    } else {
        console.log(this.colorize(`\n ⚠️ Detectadas ${errors.length} anomalías en el sistema:`, COLORS.yellow));
        errors.forEach(err => {
            const color = err.status >= 500 ? COLORS.red : COLORS.yellow;
            console.log(`   - [${err.name}] -> Recibido ${this.colorize(err.status.toString(), color)} (Esperado: ${err.expectedStatus})`);
            console.log(`     URL: ${err.url}`);
            if (err.params) console.log(`     PARAMS: ${JSON.stringify(err.params)}`);
            if (err.explanation) {
                console.log(`     ${this.colorize('❓ Por qué falló:', COLORS.magenta)} ${err.explanation}`);
            }
            if (err.suggestion) {
                console.log(`     ${this.colorize('💡 Recomendación:', COLORS.cyan)} ${err.suggestion}`);
            }
        });

        const criticals = errors.filter(e => e.status >= 500);
        if (criticals.length > 0) {
            console.log(this.colorize('\n 🔥 FALLO CRÍTICO DETECTADO:', COLORS.red + COLORS.bright));
            console.log(' El núcleo del servidor ha fallado. Se requiere intervención humana inmediata.');
        }
    }

    console.log(this.colorize('\n 📊 Estadísticas Finales:', COLORS.bright));
    console.log(` - Eficiencia: ${((this.stats.success / this.stats.totalActions) * 100).toFixed(2)}%`);
    console.log(` - Ciclos Completados: ${this.stats.totalActions}`);
    console.log(this.colorize('═'.repeat(60), COLORS.bright + COLORS.cyan));
  }

  async run(iterations: number, delay: number) {
    console.log(this.colorize(`\n--- 🐜 Inicializando Núcleo IA: ${this.username} ---`, COLORS.bright + COLORS.cyan));

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
        // Lógica de decisión simplificada para CLI pero con toque IA
        if (rand < 0.4) action = () => this.getResources();
        else if (rand < 0.7) action = () => this.startMission();
        else if (rand < 0.8) action = () => this.getProfile();
        else if (rand < 0.9) action = () => this.tryInvalidMission();
        else if (rand < 0.92) action = () => this.healthCheck();
        else if (rand < 0.94) action = () => this.refreshTokenAction();
        else if (rand < 0.97) action = () => this.rest();
        else {
          action = () => {
            console.log(this.colorize('\n[PENSAMIENTO] Simulando cierre de conexión para probar persistencia.', COLORS.magenta));
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

  process.exit(success ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

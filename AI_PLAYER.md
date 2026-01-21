# 🐜 Nidoria AI Player

Este módulo permite simular jugadores automatizados (bots) que interactúan con la API de Nidoria. Su objetivo principal es la detección de errores de flujo, regresiones y errores inesperados (500) en el servidor.

Existen dos formas de utilizar el AI Player:
1. **Versión Web (Dashboard)**: Una interfaz gráfica en tiempo real.
2. **Versión Terminal (CLI)**: Un script autónomo para pruebas rápidas o CI/CD.

---

## 🚀 Cómo empezar

### 1. Versión Web (Recomendado)
El sistema incluye un dashboard gráfico que permite ver el "pensamiento" del bot, su estado y un análisis de errores.

1. Inicia el servidor de Nidoria: `npm run start:dev`
2. Abre tu navegador en: `http://localhost:3000/ai/dashboard`
3. Introduce las credenciales cuando se te soliciten (por defecto: Usuario `admin`, Contraseña `nidoria2024`).
4. Configura las **iteraciones** (cuántas acciones hará) y el **delay** (velocidad).
4. Haz clic en **"Iniciar Bot"**.

### 2. Versión Terminal
Ideal para ver logs detallados o ejecutar pruebas de estrés rápidas.

```bash
# Ejecutar con valores por defecto
npm run test:ai-player

# Configurar duración y velocidad
PLAYER_ITERATIONS=50 PLAYER_DELAY=200 npm run test:ai-player
```

---

## 🛠️ Cómo implementar nuevas funciones

El "cerebro" del bot se encuentra en `src/ai-manager/entities/ai-player.entity.ts`. Para añadir una nueva acción (ej. Construir), sigue estos pasos:

### Paso 1: Definir la acción en la clase `AIPlayer`
Añade un método que realice la llamada a la API usando `this.api`.

```typescript
async buildStructure() {
  const intent = '¡Voy a mejorar mi hormiguero construyendo algo!';
  await this.think(intent);

  const res = await this.api.post('/building/start', {
    structureId: 1
  });

  // Registra el resultado (nombre, respuesta, status esperado, intención)
  await this.logAction('Build Structure', res, 201, intent);
}
```

### Paso 2: Añadir la acción al ciclo de decisión
En el método `run()`, añade tu nueva función a la lógica de selección (usando `Math.random()` para decidir cuándo ejecutarla).

```typescript
// Dentro del bucle for en run()
if (rand < 0.2) {
  action = () => this.buildStructure();
} else if (rand < 0.4) {
  // ... otras acciones
}
```

---

## 🧠 Núcleo de Inteligencia Avanzada (IA v2.0)

El bot ahora opera con un sistema cognitivo mejorado:
- **Sistema de Objetivos**: El bot selecciona dinámicamente un objetivo (`SOBREVIVIR`, `EXPANDIR`, `AUDITAR`, `ESTRESAR`) según sus recursos y personalidad.
- **Ritmo Humano**: Introduce latencias variables y estados de hibernación para simular el comportamiento de un jugador real, permitiendo observar el ritmo de progresión natural.
- **Estrategia de Refuerzo**: Detecta hormigas ociosas y las envía automáticamente a reforzar expediciones activas para maximizar la eficiencia.
- **Personalidades**: Cada bot tiene un rol (`Explorador`, `Seguridad`, `Cauto` o `Industrioso`) que influye en sus prioridades.

El bot ahora opera con un sistema de toma de decisiones basado en:
- **Personalidades**: Cada bot nace con una personalidad (`Explorador`, `Seguridad` o `Cauto`) que altera sus probabilidades de acción.
- **Razonamiento Contextual**: El bot "piensa" antes de actuar y explica su lógica (ej. "Tengo pocas hojas, voy a recolectar más").
- **Conciencia de Estado**: Analiza el inventario en tiempo real para priorizar la recolección de los recursos más escasos.
- **Aprendizaje de Fallos**: El bot es consciente de qué acciones están fallando y puede ajustar su comportamiento para intentar flujos alternativos.

---

## 🔍 Análisis de Errores

El bot clasifica los resultados en tres categorías:
- **PASS (Verde)**: La API respondió con el código esperado.
- **FAIL (Amarillo)**: La API respondió con un error controlado (ej. 401, 400). Es un fallo de flujo pero el servidor es estable.
- **CRITICAL (Rojo)**: La API respondió con un error 500. **Esto indica un bug en el backend que debe ser revisado.**

Al finalizar una ejecución, se genera un **Reporte Analítico** que resume la tasa de éxito y destaca los problemas encontrados.

---

## 🔒 Seguridad

El Dashboard Web está protegido por **Basic Auth**. Puedes configurar las credenciales mediante variables de entorno:
- `AI_ADMIN_USER`: Nombre de usuario (por defecto `admin`).
- `AI_ADMIN_PASS`: Contraseña (por defecto `nidoria2024`).

---

## ⚙️ Configuración Técnica

El bot utiliza:
- **Axios**: Para todas las comunicaciones HTTP (sin acceso directo a la base de datos/Prisma).
- **Socket.IO**: Para transmitir logs y estado al dashboard web.
- **Tailwind CSS**: Para la interfaz gráfica.

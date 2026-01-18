import { Controller, Get, Post, Body, Param, Res, UseGuards } from '@nestjs/common';
import { AiManagerService } from './ai-manager.service';
import { Response } from 'express';
import { BasicAuthGuard } from '../guards/basic-auth.guard';

@Controller('ai')
@UseGuards(BasicAuthGuard)
export class AiManagerController {
  constructor(private readonly aiManagerService: AiManagerService) {}

  @Get('dashboard')
  getDashboard(@Res() res: Response) {
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nidoria AI Manager</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
        <style>
            @keyframes pulse-thinking {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            .thinking { animation: pulse-thinking 2s infinite; }
            .log-thinking { color: #d946ef; }
            .log-success { color: #22c55e; }
            .log-warn { color: #eab308; }
            .log-error { color: #ef4444; }
            .log-info { color: #3b82f6; }
            .text-magenta-400 { color: #d946ef; }
        </style>
    </head>
    <body class="bg-gray-900 text-gray-100 min-h-screen font-sans">
        <nav class="bg-gray-800 border-b border-gray-700 p-4">
            <div class="container mx-auto flex justify-between items-center">
                <h1 class="text-2xl font-bold text-cyan-400 flex items-center">
                    <span class="mr-2">🐜</span> Nidoria AI Manager
                </h1>
                <div class="flex space-x-4">
                    <input id="iterations" type="number" value="20" class="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-20" title="Iterations">
                    <input id="delay" type="number" value="1000" class="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-24" title="Delay (ms)">
                    <button id="startBtn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-4 rounded transition">
                        Iniciar Bot
                    </button>
                </div>
            </div>
        </nav>

        <main class="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Sidebar: Player State -->
            <div class="lg:col-span-1 space-y-6">
                <div id="playerCard" class="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700 hidden">
                    <h2 class="text-xl font-bold mb-4 text-cyan-400 border-b border-gray-700 pb-2">Estado del Bot</h2>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Nombre:</span>
                            <span id="botName" class="font-mono text-yellow-400">---</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Token:</span>
                            <span id="botToken" class="font-bold">---</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Estado:</span>
                            <span id="botStatus" class="font-bold">---</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Personalidad:</span>
                            <span id="botPersonality" class="font-bold text-magenta-400">---</span>
                        </div>
                        <div class="mt-4">
                            <span class="text-gray-400 block mb-1">Recursos:</span>
                            <pre id="botResources" class="bg-gray-900 p-2 rounded text-xs overflow-x-auto">{}</pre>
                        </div>
                        <div class="grid grid-cols-2 gap-2 mt-4">
                            <div class="bg-gray-900 p-2 rounded text-center">
                                <span class="text-xs text-gray-400 block">Éxitos</span>
                                <span id="statSuccess" class="text-lg font-bold text-green-400">0</span>
                            </div>
                            <div class="bg-gray-900 p-2 rounded text-center">
                                <span class="text-xs text-gray-400 block">Errores 500</span>
                                <span id="statCritical" class="text-lg font-bold text-red-500">0</span>
                            </div>
                        </div>
                    </div>
                    <button id="stopBtn" class="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition">
                        Detener
                    </button>
                </div>

                <div class="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
                    <h2 class="text-xl font-bold mb-4 text-cyan-400 border-b border-gray-700 pb-2">Análisis de Flujo</h2>
                    <div id="historyList" class="space-y-2 max-h-96 overflow-y-auto pr-2 text-sm">
                        <!-- History items go here -->
                        <p class="text-gray-500 italic text-center py-4">Sin actividad reciente</p>
                    </div>
                </div>
            </div>

            <!-- Main: Terminal Logs -->
            <div class="lg:col-span-2">
                <div class="bg-black rounded-xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col h-[700px]">
                    <div class="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                        <span class="text-xs font-mono text-gray-400">nidoria-bot.log</span>
                        <div class="flex space-x-1.5">
                            <div class="w-3 h-3 rounded-full bg-red-500"></div>
                            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div class="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                    </div>
                    <div id="terminal" class="p-4 font-mono text-sm overflow-y-auto flex-grow space-y-1">
                        <p class="text-gray-500 italic">Esperando conexión...</p>
                    </div>
                </div>
            </div>
        </main>

        <script>
            const socket = io();
            const terminal = document.getElementById('terminal');
            const historyList = document.getElementById('historyList');
            const startBtn = document.getElementById('startBtn');
            const stopBtn = document.getElementById('stopBtn');
            const playerCard = document.getElementById('playerCard');

            let currentBot = null;

            function addLog(msg, type) {
                const p = document.createElement('p');
                p.className = 'log-' + type;
                if (type === 'thinking') p.classList.add('thinking');

                const time = new Date().toLocaleTimeString();
                p.innerHTML = \`<span class="text-gray-600">[\${time}]</span> \${msg}\`;

                terminal.appendChild(p);
                terminal.scrollTop = terminal.scrollHeight;

                // Keep terminal clean
                if (terminal.childNodes.length > 100) terminal.removeChild(terminal.firstChild);
            }

            socket.on('connect', () => {
                addLog('Conectado al servidor de Nidoria', 'info');
            });

            socket.on('log', (data) => {
                addLog(data.message, data.type);
            });

            socket.on('state', (state) => {
                currentBot = state;
                playerCard.classList.remove('hidden');
                document.getElementById('botName').innerText = state.username;
                document.getElementById('botToken').innerText = state.token ? 'ACTIVO' : 'SIN TOKEN';
                document.getElementById('botToken').className = state.token ? 'font-bold text-green-400' : 'font-bold text-red-400';
                document.getElementById('botStatus').innerText = state.isRunning ? 'EJECUTANDO' : 'DETENIDO';
                document.getElementById('botStatus').className = state.isRunning ? 'font-bold text-green-400' : 'font-bold text-gray-400';
                document.getElementById('botPersonality').innerText = state.personality || '---';
                document.getElementById('botResources').innerText = JSON.stringify(state.resources, null, 2);
                document.getElementById('statSuccess').innerText = state.stats.success;
                document.getElementById('statCritical').innerText = state.stats.unexpectedErrors;

                // Update history
                if (state.history && state.history.length > 0) {
                    historyList.innerHTML = '';
                    [...state.history].reverse().forEach(action => {
                        const div = document.createElement('div');
                        div.className = \`p-2 rounded border border-gray-700 bg-gray-900 flex justify-between items-center \${action.expected ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}\`;
                        div.innerHTML = \`
                            <div class="flex-grow pr-4">
                                <div class="font-bold flex items-center">
                                    \${action.name}
                                    \${!action.expected ? '<span class="ml-2 text-red-500">⚠️</span>' : ''}
                                </div>
                                <div class="text-xs text-gray-500 italic mb-1">\${action.thinking || ''}</div>
                                \${action.suggestion ? \`
                                    <div class="mt-2 text-xs bg-blue-900/30 text-blue-300 p-2 rounded border border-blue-800/50 flex items-start">
                                        <span class="mr-1.5 text-blue-400">💡</span>
                                        <span>\${action.suggestion}</span>
                                    </div>
                                \` : ''}
                            </div>
                            <div class="text-right flex-shrink-0">
                                <span class="px-2 py-0.5 rounded text-xs \${action.expected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}">\${action.status}</span>
                            </div>
                        \`;
                        historyList.appendChild(div);
                    });
                }
            });

            startBtn.onclick = async () => {
                const iterations = document.getElementById('iterations').value;
                const delay = document.getElementById('delay').value;
                const baseUrl = window.location.origin;

                terminal.innerHTML = '';
                addLog(\`Iniciando bot con \${iterations} iteraciones y delay de \${delay}ms...\`, 'info');

                await fetch('/ai/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ baseUrl, iterations: parseInt(iterations), delay: parseInt(delay) })
                });
            };

            stopBtn.onclick = async () => {
                if (!currentBot) return;
                await fetch(\`/ai/stop/\${currentBot.username}\`, { method: 'POST' });
            };
        </script>
    </body>
    </html>
    `;
    res.send(html);
  }

  @Post('start')
  startPlayer(@Body() config: { baseUrl: string; iterations: number; delay: number }) {
    const username = this.aiManagerService.startPlayer(config.baseUrl, config.iterations, config.delay);
    return { username };
  }

  @Post('stop/:username')
  stopPlayer(@Param('username') username: string) {
    const success = this.aiManagerService.stopPlayer(username);
    return { success };
  }

  @Get('players')
  getPlayers() {
    return this.aiManagerService.getAllPlayers();
  }
}

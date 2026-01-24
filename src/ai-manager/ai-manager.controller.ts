import { Controller, Get, Post, Body, Param, Res, UseGuards } from '@nestjs/common';
import { AiManagerService } from './ai-manager.service';
import { Response } from 'express';
import { BasicAuthGuard } from '../guards/basic-auth.guard';
import { KnowledgeItem } from './entities/ai-player.entity';

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
            @keyframes pulse-thinking { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            .thinking { animation: pulse-thinking 2s infinite; }
            .log-thinking { color: #d946ef; }
            .log-success { color: #22c55e; }
            .log-warn { color: #eab308; }
            .log-error { color: #ef4444; }
            .log-info { color: #3b82f6; }
            .text-magenta-400 { color: #d946ef; }
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: #111827; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        </style>
    </head>
    <body class="bg-gray-900 text-gray-100 min-h-screen font-sans flex flex-col overflow-hidden">
        <!-- Top Nav -->
        <nav class="bg-gray-800 border-b border-gray-700 p-4 shadow-2xl flex-shrink-0">
            <div class="container mx-auto flex justify-between items-center">
                <h1 class="text-2xl font-bold text-cyan-400 flex items-center">
                    <span class="mr-2">🐜</span> Nidoria Multi-Bot Manager
                </h1>
                <div class="flex items-center space-x-4">
                    <div class="flex flex-col">
                        <label class="text-[10px] text-gray-400 uppercase font-bold">Iteraciones</label>
                        <input id="iterations" type="number" value="100" class="bg-gray-700 border border-gray-600 rounded px-2 py-0.5 w-16 text-sm outline-none focus:border-cyan-500">
                    </div>
                    <div class="flex flex-col">
                        <label class="text-[10px] text-gray-400 uppercase font-bold">Delay (ms)</label>
                        <input id="delay" type="number" value="1000" class="bg-gray-700 border border-gray-600 rounded px-2 py-0.5 w-20 text-sm outline-none focus:border-cyan-500">
                    </div>
                    <button id="startBtn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition shadow-lg flex items-center">
                        <span class="mr-2 text-lg">➕</span> Nuevo Bot
                    </button>
                </div>
            </div>
        </nav>

        <div class="flex flex-grow overflow-hidden">
            <!-- Sidebar: Bot List -->
            <aside class="w-64 bg-gray-800 border-r border-gray-700 flex flex-col p-4 space-y-4">
                <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-2">Bots Activos</h2>
                <div id="botList" class="space-y-2 overflow-y-auto flex-grow custom-scrollbar">
                    <p class="text-gray-500 italic text-xs text-center py-10">Esperando despliegue...</p>
                </div>

                <div class="border-t border-gray-700 pt-4">
                    <button id="stressBtn" class="w-full bg-red-900/50 hover:bg-red-800 text-red-300 font-bold py-2 px-4 rounded border border-red-700/50 transition text-xs uppercase tracking-widest">
                        🚀 Stress Test (5 Bots)
                    </button>
                </div>
            </aside>

            <!-- Main Content Area -->
            <main class="flex-grow flex flex-col overflow-hidden">
                <div id="noSelectionMsg" class="flex-grow flex items-center justify-center text-gray-600 flex-col">
                    <span class="text-6xl mb-4 opacity-20 italic font-bold">🐜 NIDORIA</span>
                    <p>Selecciona un bot de la lista para ver su estado y controlar sus acciones</p>
                </div>

                <div id="dashboard" class="flex-grow flex overflow-hidden hidden">
                    <!-- Left Column: State & Controls -->
                    <div class="w-[350px] bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto custom-scrollbar p-6 space-y-6 flex-shrink-0">
                        <!-- Identity & Level -->
                        <div class="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-xl relative overflow-hidden">
                            <div id="personalityBadge" class="absolute top-0 right-0 px-2 py-0.5 bg-magenta-600 text-[10px] font-bold rounded-bl-lg uppercase tracking-widest text-white shadow-lg">---</div>
                            <div class="flex items-center mb-2">
                                <div class="w-10 h-10 bg-cyan-900 rounded-lg flex items-center justify-center text-xl mr-3 border border-cyan-700 shadow-inner">👤</div>
                                <div>
                                    <h3 id="botName" class="font-bold text-lg text-white leading-none mb-1">---</h3>
                                    <div class="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Nivel <span id="botLevel">1</span></div>
                                </div>
                            </div>
                            <div class="w-full bg-gray-900 rounded-full h-1.5 border border-gray-700 overflow-hidden mb-1">
                                <div id="xpBar" class="bg-cyan-500 h-full transition-all duration-700" style="width: 0%"></div>
                            </div>
                            <div id="goalBadge" class="text-[10px] text-blue-300 font-mono mt-2 flex justify-between">
                                <span>Objetivo: <span id="botGoal" class="font-bold">---</span></span>
                                <span id="nextActionTimer" class="font-bold text-gray-500">--s</span>
                            </div>
                        </div>

                        <!-- Manual Controls -->
                        <div class="bg-gray-800 rounded-xl p-4 border border-gray-700">
                            <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                                <span class="mr-2">🕹️</span> Órdenes Directas
                            </h4>
                            <div class="grid grid-cols-2 gap-2">
                                <button onclick="forceBotAction('Misión')" class="bg-gray-700 hover:bg-gray-600 p-2 rounded text-[10px] font-bold border border-gray-600 transition">🚀 RECOLECTAR</button>
                                <button onclick="forceBotAction('Recursos')" class="bg-gray-700 hover:bg-gray-600 p-2 rounded text-[10px] font-bold border border-gray-600 transition">📦 AUDITAR BD</button>
                                <button onclick="forceBotAction('Perfil')" class="bg-gray-700 hover:bg-gray-600 p-2 rounded text-[10px] font-bold border border-gray-600 transition">👤 VER PERFIL</button>
                                <button onclick="forceBotAction('Login')" class="bg-gray-700 hover:bg-gray-600 p-2 rounded text-[10px] font-bold border border-gray-600 transition">🔑 FORZAR LOGIN</button>
                                <button onclick="forceBotAction('Salud')" class="bg-gray-700 hover:bg-gray-600 p-2 rounded text-[10px] font-bold border border-gray-600 transition">❤️ HEALTH CHECK</button>
                                <button onclick="stopCurrentBot()" class="bg-red-900/40 hover:bg-red-900 text-red-400 p-2 rounded text-[10px] font-bold border border-red-800/50 transition uppercase tracking-tighter">⛔ DETENER BOT</button>
                            </div>
                        </div>

                        <!-- Resources & Stats -->
                        <div class="space-y-4">
                            <div>
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recursos</span>
                                    <span id="foodTrend" class="text-[9px] font-bold">---</span>
                                </div>
                                <div id="resourcesList" class="grid grid-cols-3 gap-1"></div>
                            </div>
                            <div id="populationStats" class="bg-gray-800 p-3 rounded-xl border border-gray-700 text-[10px] grid grid-cols-2 gap-2 shadow-inner"></div>
                            <div id="knowledgeList" class="space-y-1.5 bg-black/20 p-3 rounded-xl border border-gray-800">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-[9px] font-bold text-gray-500 uppercase block">Red / Endpoints</span>
                                    <span class="text-[8px] text-gray-600 italic">Clic para ver detalle</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Logs & Flow -->
                    <div class="flex-grow flex flex-col p-6 space-y-6 overflow-hidden bg-black/30">
                        <div class="flex-grow flex flex-col space-y-4 overflow-hidden">
                            <!-- Terminal -->
                            <div class="h-1/2 bg-black rounded-xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden">
                                <div class="bg-gray-800 px-4 py-1.5 border-b border-gray-700 flex justify-between items-center">
                                    <span id="terminalTitle" class="text-[10px] font-mono text-gray-500 uppercase tracking-widest">bot-core.log</span>
                                    <div class="flex space-x-1.5"><div class="w-2 h-2 rounded-full bg-red-500"></div><div class="w-2 h-2 rounded-full bg-yellow-500"></div><div class="w-2 h-2 rounded-full bg-green-500"></div></div>
                                </div>
                                <div id="terminal" class="p-4 font-mono text-xs overflow-y-auto flex-grow space-y-0.5 custom-scrollbar"></div>
                            </div>

                            <!-- Analysis List -->
                            <div class="h-1/2 bg-gray-900 rounded-xl border border-gray-800 flex flex-col overflow-hidden shadow-xl">
                                <div class="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
                                    <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Análisis Detallado de Flujo</h4>
                                    <span id="historyCount" class="text-[10px] font-mono text-cyan-600 font-bold">0</span>
                                </div>
                                <div id="historyList" class="p-4 overflow-y-auto flex-grow space-y-2 custom-scrollbar scroll-smooth"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>

        <!-- Add Dialog (Hidden) -->
        <div id="addModal" class="fixed inset-0 bg-black/80 flex items-center justify-center hidden z-50 p-4">
             <div class="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700 shadow-2xl">
                 <h2 class="text-2xl font-bold mb-6 text-cyan-400 flex items-center"><span class="mr-3">🐣</span> Iniciar Nuevo Sujeto</h2>
                 <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre de Usuario (Opcional)</label>
                        <input id="resumeUser" type="text" placeholder="Autogenerado" class="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none transition shadow-inner">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                        <input id="resumePass" type="password" value="Password123!" class="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none transition shadow-inner">
                    </div>
                    <div class="flex items-center bg-gray-900/50 p-3 rounded-xl border border-gray-700/50">
                        <input id="isResume" type="checkbox" class="w-5 h-5 rounded border-gray-700 bg-gray-900 text-cyan-600 focus:ring-cyan-500">
                        <label for="isResume" class="ml-3 text-sm text-gray-300">Omitir registro (reusar cuenta existente)</label>
                    </div>
                    <div class="flex space-x-3 pt-4">
                        <button onclick="toggleModal()" class="flex-grow bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition">Cancelar</button>
                        <button id="confirmStartBtn" class="flex-grow bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-lg">Lanzar Bot</button>
                    </div>
                 </div>
             </div>
        </div>

        <script>
            const socket = io();
            const bots = new Map();
            const botLogs = new Map();
            let selectedBot = null;

            function toggleModal() { document.getElementById('addModal').classList.toggle('hidden'); }

            function updateBotListUI() {
                const list = document.getElementById('botList');
                if (bots.size === 0) {
                    list.innerHTML = '<p class="text-gray-500 italic text-xs text-center py-10">Esperando despliegue...</p>';
                    return;
                }
                list.innerHTML = '';
                bots.forEach((state, name) => {
                    const div = document.createElement('div');
                    const isSelected = selectedBot === name;
                    div.className = \`p-3 rounded-xl cursor-pointer transition border \${isSelected ? 'bg-cyan-900/30 border-cyan-500 shadow-lg shadow-cyan-900/20' : 'bg-gray-900/40 border-gray-700 hover:border-gray-500'}\`;
                    div.onclick = () => selectBot(name);
                    div.innerHTML = \`
                        <div class="flex justify-between items-center">
                            <span class="text-xs font-bold \${isSelected ? 'text-white' : 'text-gray-400'} truncate">\${name}</span>
                            <span class="text-[9px] bg-cyan-900 text-cyan-300 px-1.5 py-0.5 rounded-full font-bold">LVL \${state.level || 1}</span>
                        </div>
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-[10px] text-gray-500 font-mono">\${state.goal || '---'}</span>
                            <div class="flex space-x-1">\${state.isWaiting ? '<span class="animate-pulse">⏳</span>' : '<span class="text-green-500">●</span>'}</div>
                        </div>
                    \`;
                    list.appendChild(div);
                });
            }

            function selectBot(name) {
                selectedBot = name;
                document.getElementById('noSelectionMsg').classList.add('hidden');
                document.getElementById('dashboard').classList.remove('hidden');
                updateBotListUI();
                renderSelectedBot();
            }

            function renderSelectedBot() {
                const state = bots.get(selectedBot);
                if (!state) return;

                document.getElementById('botName').innerText = state.username;
                document.getElementById('botLevel').innerText = state.level || '1';
                document.getElementById('botGoal').innerText = state.goal || '---';
                document.getElementById('personalityBadge').innerText = state.personality || '---';

                const xpPercent = (state.xp / state.xpNeeded) * 100;
                document.getElementById('xpBar').style.width = xpPercent + '%';

                const timer = document.getElementById('nextActionTimer');
                timer.innerText = state.nextActionIn + 's';

                const trendEl = document.getElementById('foodTrend');
                if (state.foodTrend === 'UP') {
                    trendEl.innerText = '📈 ALTA';
                    trendEl.className = 'text-[9px] font-bold text-green-500';
                } else if (state.foodTrend === 'DOWN') {
                    trendEl.innerText = '📉 BAJA';
                    trendEl.className = 'text-[9px] font-bold text-red-500';
                } else {
                    trendEl.innerText = '➖ ESTABLE';
                    trendEl.className = 'text-[9px] font-bold text-gray-500';
                }

                const resList = document.getElementById('resourcesList');
                resList.innerHTML = '';
                if (state.resources?.resources) {
                    state.resources.resources.forEach(r => {
                        const div = document.createElement('div');
                        div.className = 'bg-gray-800 p-1.5 rounded text-center border border-gray-700 shadow-inner';
                        div.innerHTML = \`<span class="block text-[8px] text-gray-500 font-bold uppercase">\${r.type}</span><span class="font-bold text-cyan-400 text-xs">\${Math.floor(r.stock)}</span>\`;
                        resList.appendChild(div);
                    });
                }

                const popStats = document.getElementById('populationStats');
                if (state.resources) {
                    const r = state.resources;
                    popStats.innerHTML = \`
                        <div>🥚 Huevos: <span class="text-white font-bold">\${r.eggs}</span></div>
                        <div>🐛 Larvas: <span class="text-white font-bold">\${r.larva}</span></div>
                        <div>🐜 Adultas: <span class="text-white font-bold">\${r.ants}</span></div>
                        <div>💼 Ocupadas: <span class="text-white font-bold text-yellow-500">\${r.antsBusy}</span></div>
                    \`;
                }

                const knowList = document.getElementById('knowledgeList');
                knowList.innerHTML = \`
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[9px] font-bold text-gray-500 uppercase block">Red / Endpoints</span>
                        <span class="text-[8px] text-gray-600 italic">Clic para ver detalle</span>
                    </div>
                \`;
                if (state.knowledge) {
                    Object.entries(state.knowledge).forEach(([name, k]) => {
                        const div = document.createElement('div');
                        const rel = Math.round(k.reliability * 100);
                        const color = rel > 80 ? 'text-green-400' : (rel > 50 ? 'text-yellow-400' : 'text-red-400');
                        const icon = rel > 80 ? '✅' : (rel > 50 ? '⚠️' : '❌');
                        div.className = 'flex flex-col mb-1 border-b border-gray-800/50 pb-1 last:border-0 hover:bg-white/5 p-1 rounded cursor-pointer transition';
                        div.onclick = () => scrollToHistory(name);
                        div.innerHTML = \`
                            <div class="flex justify-between items-center">
                                <span class="text-gray-400 font-bold text-[9px]">\${icon} \${name}</span>
                                <span class="\${color} font-mono text-[9px]">\${rel}%</span>
                            </div>
                            \${k.lastError ? \`<div class="text-[8px] text-red-500/80 truncate font-mono mt-0.5">\${k.lastError}</div>\` : ''}
                        \`;
                        knowList.appendChild(div);
                    });
                }

                // const waitStatus = document.getElementById('waitStatus');
                // if (waitStatus) {
                //     if (state.isWaiting) waitStatus.classList.remove('hidden');
                //     else waitStatus.classList.add('hidden');
                // }

                const histList = document.getElementById('historyList');
                histList.innerHTML = '';
                if (state.history) {
                    document.getElementById('historyCount').innerText = state.history.length;
                    const reversedHistory = [...state.history].reverse();
                    reversedHistory.forEach((action, index) => {
                        const div = document.createElement('div');
                        const actualIndex = reversedHistory.length - 1 - index;
                        const detailId = \`detail-\${actualIndex}\`;
                        div.id = \`history-item-\${actualIndex}\`;
                        div.setAttribute('data-action-name', action.name);
                        div.className = \`p-2 rounded-xl border border-gray-800 bg-gray-950 flex flex-col transition-all duration-500 \${action.expected ? 'border-l-4 border-l-green-600' : 'border-l-4 border-l-red-600'}\`;
                        div.innerHTML = \`
                            <div class="flex justify-between items-center cursor-pointer" onclick="document.getElementById('\${detailId}').classList.toggle('hidden')">
                                <div class="flex-grow pr-2">
                                    <div class="flex items-center">
                                        <div class="font-bold text-xs \${action.expected ? 'text-gray-200' : 'text-red-400'}">\${action.name}</div>
                                        <div class="ml-2 text-[8px] text-gray-600 font-mono">\${new Date(action.timestamp).toLocaleTimeString()}</div>
                                    </div>
                                    <div class="text-[9px] text-gray-600 italic">\${action.thinking?.substring(0, 50) || ''}...</div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span class="px-2 py-0.5 rounded text-[10px] font-mono \${action.expected ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'} border border-white/5">\${action.status}</span>
                                    <span class="text-gray-700 text-[8px]">#\${actualIndex}</span>
                                </div>
                            </div>
                            <div id="\${detailId}" class="mt-2 space-y-2 hidden border-t border-gray-800 pt-2 pb-1">
                                <div class="text-[10px] text-magenta-400/80 font-bold uppercase tracking-widest mb-1 italic">Razonamiento IA:</div>
                                <div class="text-[10px] text-gray-400 leading-relaxed bg-gray-800/30 p-2 rounded-lg border border-gray-800">\${action.thinking || ''}</div>
                                <div class="space-y-1">
                                    <div class="text-[9px] font-mono text-gray-500 break-all bg-black/40 p-1.5 rounded-lg">
                                        <span class="text-cyan-600 font-bold mr-1 uppercase">ENDPOINT:</span>\${action.url}
                                    </div>
                                    \${action.params ? \`
                                        <div class="text-[9px] font-mono text-gray-500 break-all bg-black/40 p-1.5 rounded-lg">
                                            <span class="text-yellow-600 font-bold mr-1 uppercase">PAYLOAD:</span>\${JSON.stringify(action.params)}
                                        </div>
                                    \` : ''}
                                </div>
                                \${action.explanation ? \`
                                    <div class="text-[10px] bg-red-900/20 text-red-300 p-2 rounded-lg border border-red-800/30 flex items-start">
                                        <span class="mr-2">❓</span><span>\${action.explanation}</span>
                                    </div>
                                \` : ''}
                                \${action.suggestion ? \`
                                    <div class="text-[10px] bg-blue-900/20 text-blue-300 p-2 rounded-lg border border-blue-800/30 flex items-start">
                                        <span class="mr-2">💡</span><span>\${action.suggestion}</span>
                                    </div>
                                \` : ''}
                            </div>
                        \`;
                        histList.appendChild(div);
                    });
                }

                const term = document.getElementById('terminal');
                term.innerHTML = '';
                const logs = botLogs.get(selectedBot) || [];
                logs.forEach(l => {
                    const p = document.createElement('p');
                    p.className = 'log-' + l.type;
                    if (l.type === 'thinking') p.classList.add('thinking');
                    const time = new Date(l.timestamp).toLocaleTimeString();
                    p.innerHTML = \`<span class="text-gray-700">[\${time}]</span> \${l.message}\`;
                    term.appendChild(p);
                });
                term.scrollTop = term.scrollHeight;
                document.getElementById('terminalTitle').innerText = \`nidoria@\${selectedBot}:~\`;
            }

            function scrollToHistory(actionName) {
                const histList = document.getElementById('historyList');
                const items = Array.from(histList.querySelectorAll('[data-action-name]'));
                // Find the latest one (it's reversed, so it's the first in the DOM)
                const item = items.find(i => i.getAttribute('data-action-name') === actionName);

                if (item) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    item.classList.add('ring-2', 'ring-cyan-500', 'bg-gray-900');
                    const detailId = item.id.replace('history-item-', 'detail-');
                    const detail = document.getElementById(detailId);
                    if (detail) detail.classList.remove('hidden');

                    setTimeout(() => {
                        item.classList.remove('ring-2', 'ring-cyan-500', 'bg-gray-900');
                    }, 2000);
                } else {
                    console.warn('No se encontró registro para:', actionName);
                }
            }

            async function forceBotAction(action) {
                if (!selectedBot) return;
                await fetch(\`/ai/force/\${selectedBot}/\${action}\`, { method: 'POST' });
            }

            async function stopCurrentBot() {
                if (!selectedBot) return;
                await fetch(\`/ai/stop/\${selectedBot}\`, { method: 'POST' });
            }

            async function spawnBot(config = {}) {
                const iterations = document.getElementById('iterations').value;
                const delay = document.getElementById('delay').value;
                const baseUrl = window.location.origin;

                const res = await fetch('/ai/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        baseUrl,
                        iterations: parseInt(iterations),
                        delay: parseInt(delay),
                        ...config
                    })
                });
                const data = await res.json();
                if (!selectedBot) selectBot(data.username);
            }

            document.getElementById('startBtn').onclick = () => toggleModal();
            document.getElementById('confirmStartBtn').onclick = () => {
                const config = {
                    username: document.getElementById('resumeUser').value || undefined,
                    password: document.getElementById('resumePass').value || undefined,
                    isResume: document.getElementById('isResume').checked
                };
                spawnBot(config);
                toggleModal();
            };

            document.getElementById('stressBtn').onclick = async () => {
                for(let i=0; i<5; i++) {
                    await new Promise(r => setTimeout(r, 200));
                    spawnBot();
                }
            };

            socket.on('state', (data) => {
                const { botName, ...state } = data;
                bots.set(botName, state);
                updateBotListUI();
                if (selectedBot === botName) renderSelectedBot();
            });

            socket.on('log', (data) => {
                const { botName, message, type, timestamp } = data;
                if (!botLogs.has(botName)) botLogs.set(botName, []);
                const logs = botLogs.get(botName);
                logs.push({ message, type, timestamp });
                if (logs.length > 200) logs.shift();
                if (selectedBot === botName) renderSelectedBot();
            });

            fetch('/ai/players').then(r => r.json()).then(data => {
                data.forEach(p => bots.set(p.username, p));
                updateBotListUI();
            });
        </script>
    </body>
    </html>
    `;
    res.send(html);
  }

  @Post('start')
  startPlayer(@Body() config: {
    baseUrl: string;
    iterations: number;
    delay: number;
    username?: string;
    password?: string;
    isResume?: boolean;
  }) {
    const username = this.aiManagerService.startPlayer(
      config.baseUrl,
      config.iterations,
      config.delay,
      {
        username: config.username,
        password: config.password,
        isResume: config.isResume
      }
    );
    return { username };
  }

  @Post('stop/:username')
  stopPlayer(@Param('username') username: string) {
    const success = this.aiManagerService.stopPlayer(username);
    return { success };
  }

  @Post('force/:username/:action')
  forceAction(@Param('username') username: string, @Param('action') action: string) {
    const success = this.aiManagerService.forceAction(username, action);
    return { success };
  }

  @Get('players')
  getPlayers() {
    return this.aiManagerService.getAllPlayers();
  }
}

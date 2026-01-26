import { Controller, Get, Post, Patch, Delete, Body, Param, Res, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';

@Controller('antmaster')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  getDashboard(@Res() res: Response) {
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AntMaster Admin Panel</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 10px; }
            .modal { transition: opacity 0.25s ease; }
            body.modal-active { overflow-x: hidden; overflow-y: visible !important; }
        </style>
    </head>
    <body class="bg-gray-900 text-gray-100 min-h-screen font-sans flex flex-col">
        <!-- Auth Overlay -->
        <div id="loginOverlay" class="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center hidden">
            <div class="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md">
                <h1 class="text-3xl font-bold text-amber-500 mb-6 text-center"><i class="fas fa-ant mr-3"></i>AntMaster Admin</h1>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Usuario o Email</label>
                        <input id="loginUser" type="text" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Contraseña</label>
                        <input id="loginPass" type="password" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none">
                    </div>
                    <button id="loginBtn" class="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg transition duration-200">Ingresar al Hormiguero</button>
                    <p id="loginError" class="text-red-500 text-sm text-center hidden"></p>
                </div>
            </div>
        </div>

        <!-- Main Navbar -->
        <nav class="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
            <div class="flex items-center space-x-4">
                <span class="text-2xl font-black text-amber-500 tracking-tighter"><i class="fas fa-bug mr-2"></i>ANTMASTER</span>
                <div class="hidden md:flex space-x-1 bg-gray-900 rounded-lg p-1">
                    <button onclick="switchTab('overview')" class="tab-btn px-4 py-1.5 rounded-md text-sm font-medium transition bg-amber-600 text-white" id="tab-overview">Resumen</button>
                    <button onclick="switchTab('users')" class="tab-btn px-4 py-1.5 rounded-md text-sm font-medium transition hover:bg-gray-700" id="tab-users">Usuarios</button>
                    <button onclick="switchTab('anthills')" class="tab-btn px-4 py-1.5 rounded-md text-sm font-medium transition hover:bg-gray-700" id="tab-anthills">Hormigueros</button>
                    <button onclick="switchTab('redis')" class="tab-btn px-4 py-1.5 rounded-md text-sm font-medium transition hover:bg-gray-700" id="tab-redis">Colas Redis</button>
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <span id="adminName" class="text-sm font-medium text-gray-400">Admin</span>
                <button onclick="logout()" class="text-gray-400 hover:text-white transition"><i class="fas fa-sign-out-alt"></i></button>
            </div>
        </nav>

        <!-- Content Area -->
        <main class="flex-grow p-6 container mx-auto">

            <!-- Overview Tab -->
            <div id="content-overview" class="tab-content space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                        <div class="text-gray-400 text-sm font-bold uppercase mb-1">Usuarios Totales</div>
                        <div class="text-4xl font-black text-white" id="stat-users">0</div>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                        <div class="text-gray-400 text-sm font-bold uppercase mb-1">Hormigueros</div>
                        <div class="text-4xl font-black text-white" id="stat-anthills">0</div>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                        <div class="text-gray-400 text-sm font-bold uppercase mb-1">Usuarios Verificados</div>
                        <div class="text-4xl font-black text-green-500" id="stat-verified">0</div>
                    </div>
                </div>

                <div class="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                    <div class="px-6 py-4 bg-gray-700/50 border-b border-gray-700 flex justify-between items-center">
                        <h3 class="font-bold">Estado de Colas de Trabajo</h3>
                        <button onclick="loadStats()" class="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded transition">Actualizar</button>
                    </div>
                    <div class="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" id="redis-stats-grid">
                        <!-- Redis stats will be injected here -->
                    </div>
                </div>
            </div>

            <!-- Users Tab -->
            <div id="content-users" class="tab-content hidden space-y-4">
                <div class="flex justify-between items-center">
                    <h2 class="text-xl font-bold">Gestión de Usuarios</h2>
                </div>
                <div class="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
                    <table class="w-full text-left">
                        <thead class="bg-gray-700/50 text-gray-400 text-xs uppercase font-bold">
                            <tr>
                                <th class="px-6 py-3">ID</th>
                                <th class="px-6 py-3">Usuario</th>
                                <th class="px-6 py-3">Email</th>
                                <th class="px-6 py-3">Rol</th>
                                <th class="px-6 py-3">Estado</th>
                                <th class="px-6 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="users-table-body" class="divide-y divide-gray-700">
                            <!-- Users will be injected here -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Anthills Tab -->
            <div id="content-anthills" class="tab-content hidden space-y-4">
                <h2 class="text-xl font-bold">Monitor de Hormigueros</h2>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4" id="anthills-grid">
                    <!-- Anthills will be injected here -->
                </div>
            </div>

            <!-- Redis Tab -->
            <div id="content-redis" class="tab-content hidden space-y-4">
                <h2 class="text-xl font-bold">Detalle de Bull Queues</h2>
                <div class="bg-gray-800 rounded-2xl border border-gray-700 p-6">
                    <p class="text-gray-400 mb-4">Para gestión avanzada de tareas, usa el panel de BullBoard:</p>
                    <a href="/queues" target="_blank" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200">
                        Abrir BullBoard <i class="fas fa-external-link-alt ml-2"></i>
                    </a>
                </div>
                <div id="redis-detailed-stats" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Detailed redis stats injected here -->
                </div>
            </div>

        </main>

        <footer class="p-6 text-center text-gray-600 text-xs">
            AntMaster Administration System &copy; 2024 - Nidoria Engine
        </footer>

        <script>
            let apiToken = localStorage.getItem('antmaster_token');
            let currentTab = 'overview';

            function showLogin() {
                document.getElementById('loginOverlay').classList.remove('hidden');
            }

            function hideLogin() {
                document.getElementById('loginOverlay').classList.add('hidden');
            }

            async function login() {
                const username = document.getElementById('loginUser').value;
                const password = document.getElementById('loginPass').value;
                const errorEl = document.getElementById('loginError');

                try {
                    const res = await fetch('/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    const data = await res.json();

                    if (res.ok) {
                        // Check if role is admin (optional check here, server will check anyway)
                        apiToken = data.access_token;
                        localStorage.setItem('antmaster_token', apiToken);
                        hideLogin();
                        initDashboard();
                    } else {
                        errorEl.innerText = data.message || 'Error al iniciar sesión';
                        errorEl.classList.remove('hidden');
                    }
                } catch (e) {
                    errorEl.innerText = 'Error de conexión';
                    errorEl.classList.remove('hidden');
                }
            }

            function logout() {
                localStorage.removeItem('antmaster_token');
                location.reload();
            }

            function switchTab(tabId) {
                document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById('content-' + tabId).classList.remove('hidden');

                document.querySelectorAll('.tab-btn').forEach(b => {
                    b.classList.remove('bg-amber-600', 'text-white');
                    b.classList.add('hover:bg-gray-700');
                });
                document.getElementById('tab-' + tabId).classList.add('bg-amber-600', 'text-white');
                document.getElementById('tab-' + tabId).classList.remove('hover:bg-gray-700');

                currentTab = tabId;
                loadTabData(tabId);
            }

            async function apiFetch(url, options = {}) {
                options.headers = {
                    ...options.headers,
                    'Authorization': 'Bearer ' + apiToken
                };
                const res = await fetch(url, options);
                if (res.status === 401 || res.status === 403) {
                    showLogin();
                    throw new Error('No autorizado');
                }
                return res.json();
            }

            async function loadTabData(tab) {
                if (tab === 'overview') loadStats();
                if (tab === 'users') loadUsers();
                if (tab === 'anthills') loadAnthills();
                if (tab === 'redis') loadRedisDetails();
            }

            async function loadStats() {
                const summary = await apiFetch('/antmaster/api/summary');
                document.getElementById('stat-users').innerText = summary.userCount;
                document.getElementById('stat-anthills').innerText = summary.anthillCount;
                document.getElementById('stat-verified').innerText = summary.verifiedUsers;

                const queues = await apiFetch('/antmaster/api/queues-stats');
                const grid = document.getElementById('redis-stats-grid');
                grid.innerHTML = '';

                Object.entries(queues).forEach(([name, counts]) => {
                    const total = Object.values(counts).reduce((a, b) => a + b, 0);
                    const div = document.createElement('div');
                    div.className = 'bg-gray-900/50 p-4 rounded-xl border border-gray-700 flex flex-col items-center';
                    div.innerHTML = \`
                        <div class="text-[10px] text-gray-500 uppercase font-bold">\${name}</div>
                        <div class="text-xl font-bold text-amber-500">\${total}</div>
                        <div class="text-[9px] text-gray-600 mt-1">Act: \${counts.active} | Esp: \${counts.waiting}</div>
                    \`;
                    grid.appendChild(div);
                });
            }

            async function loadUsers() {
                const users = await apiFetch('/antmaster/api/users');
                const tbody = document.getElementById('users-table-body');
                tbody.innerHTML = '';

                users.forEach(user => {
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-gray-800/50 transition';
                    tr.innerHTML = \`
                        <td class="px-6 py-4 text-sm text-gray-500">#\${user.id}</td>
                        <td class="px-6 py-4">
                            <div class="font-bold text-white">\${user.username}</div>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-400">\${user.email}</td>
                        <td class="px-6 py-4">
                            <select onchange="updateUserRole(\${user.id}, this.value)" class="bg-gray-700 border border-gray-600 text-xs rounded px-2 py-1 outline-none">
                                <option value="user" \${user.role === 'user' ? 'selected' : ''}>User</option>
                                <option value="admin" \${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </td>
                        <td class="px-6 py-4">
                            \${user.verified ? '<span class="px-2 py-0.5 bg-green-900 text-green-400 text-[10px] rounded-full uppercase font-bold">Verificado</span>' : '<span class="px-2 py-0.5 bg-red-900 text-red-400 text-[10px] rounded-full uppercase font-bold">Pendiente</span>'}
                        </td>
                        <td class="px-6 py-4">
                            <button onclick="deleteUser(\${user.id})" class="text-red-500 hover:text-red-400 transition"><i class="fas fa-trash"></i></button>
                        </td>
                    \`;
                    tbody.appendChild(tr);
                });
            }

            async function updateUserRole(id, role) {
                if (!confirm('¿Cambiar el rol de este usuario?')) return;
                await apiFetch(\`/antmaster/api/users/\${id}/role\`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role })
                });
                loadUsers();
            }

            async function deleteUser(id) {
                if (!confirm('¿Seguro que quieres eliminar este usuario y todos sus hormigueros? Esta acción no se puede deshacer.')) return;
                await apiFetch(\`/antmaster/api/users/\${id}\`, { method: 'DELETE' });
                loadUsers();
            }

            async function loadAnthills() {
                const anthills = await apiFetch('/antmaster/api/anthills');
                const grid = document.getElementById('anthills-grid');
                grid.innerHTML = '';

                anthills.forEach(a => {
                    const div = document.createElement('div');
                    div.className = 'bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col';

                    let resHtml = '';
                    a.resources.forEach(r => {
                        resHtml += \`<div class="text-[10px] bg-gray-900 px-2 py-1 rounded"> \${r.resource.type}: \${r.stock}</div>\`;
                    });

                    div.innerHTML = \`
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="font-bold text-amber-500">Hormiguero #\${a.id}</h3>
                                <p class="text-xs text-gray-500">Dueño: \${a.owner.username} (\${a.owner.email})</p>
                            </div>
                            <div class="text-right">
                                <div class="text-[10px] text-gray-400 uppercase font-bold">Posición</div>
                                <div class="text-sm font-mono">\${a.positionX}, \${a.positionY}</div>
                            </div>
                        </div>
                        <div class="grid grid-cols-3 gap-2 mb-4">
                            <div class="bg-gray-700/30 p-2 rounded text-center">
                                <div class="text-[9px] text-gray-500 uppercase">Hormigas</div>
                                <div class="font-bold text-white">\${a.ants}</div>
                            </div>
                            <div class="bg-gray-700/30 p-2 rounded text-center">
                                <div class="text-[9px] text-gray-500 uppercase">Huevos</div>
                                <div class="font-bold text-white">\${a.eggs}</div>
                            </div>
                            <div class="bg-gray-700/30 p-2 rounded text-center">
                                <div class="text-[9px] text-gray-500 uppercase">Larvas</div>
                                <div class="font-bold text-white">\${a.larva}</div>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-1">
                            \${resHtml}
                        </div>
                    \`;
                    grid.appendChild(div);
                });
            }

            async function loadRedisDetails() {
                const queues = await apiFetch('/antmaster/api/queues-stats');
                const container = document.getElementById('redis-detailed-stats');
                container.innerHTML = '';

                Object.entries(queues).forEach(([name, counts]) => {
                    const div = document.createElement('div');
                    div.className = 'bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden';

                    let rows = '';
                    Object.entries(counts).forEach(([status, count]) => {
                        rows += \`
                            <div class="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                                <span class="text-sm text-gray-400 capitalize">\${status}</span>
                                <span class="font-mono font-bold \${count > 0 ? 'text-white' : 'text-gray-600'}">\${count}</span>
                            </div>
                        \`;
                    });

                    div.innerHTML = \`
                        <div class="bg-gray-700/50 px-4 py-2 border-b border-gray-700 font-bold text-xs uppercase text-amber-500 tracking-widest">\${name}</div>
                        <div class="p-4">
                            \${rows}
                        </div>
                    \`;
                    container.appendChild(div);
                });
            }

            function initDashboard() {
                if (!apiToken) {
                    showLogin();
                    return;
                }
                // Decode token to show name (simple way)
                try {
                    const payload = JSON.parse(atob(apiToken.split('.')[1]));
                    document.getElementById('adminName').innerText = payload.username + ' (Admin)';
                } catch(e) {}

                loadStats();
            }

            document.getElementById('loginBtn').onclick = login;
            document.getElementById('loginPass').onkeypress = (e) => { if(e.key === 'Enter') login(); };

            initDashboard();
        </script>
    </body>
    </html>
    `;
    res.send(html);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/summary')
  getSummary() {
    return this.adminService.getSummary();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('api/users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.adminService.updateUserRole(+id, body.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('api/users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/anthills')
  getAnthills() {
    return this.adminService.getAnthills();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/queues-stats')
  getQueueStats() {
    return this.adminService.getQueueStats();
  }
}

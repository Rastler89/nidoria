import { Controller, Get, Patch, Delete, Post, Body, Param, ParseIntPipe, UseGuards, Res } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard(@Res() res) {
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nidoria Admin Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            .tab-content { display: none; }
            .tab-content.active { display: block; }
            .tab-btn.active { border-bottom: 2px solid #06b6d4; color: #06b6d4; }
        </style>
    </head>
    <body class="bg-gray-900 text-gray-100 min-h-screen font-sans">
        <nav class="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-50">
            <div class="container mx-auto flex justify-between items-center">
                <h1 class="text-xl font-bold text-cyan-400">🐜 Nidoria Admin</h1>
                <div id="userInfo" class="hidden flex items-center space-x-4">
                    <span id="usernameDisplay" class="text-sm text-gray-400"></span>
                    <button onclick="logout()" class="text-xs bg-red-900/50 hover:bg-red-800 text-red-200 px-3 py-1 rounded border border-red-700/50 transition">Cerrar Sesión</button>
                </div>
            </div>
        </nav>

        <div id="loginSection" class="container mx-auto mt-20 max-w-md p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-2xl">
            <h2 class="text-2xl font-bold mb-6 text-center">Acceso Administrativo</h2>
            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Usuario</label>
                    <input id="loginUser" type="text" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm outline-none focus:border-cyan-500">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
                    <input id="loginPass" type="password" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm outline-none focus:border-cyan-500">
                </div>
                <button onclick="login()" class="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded-lg transition shadow-lg">Entrar</button>
                <p id="loginError" class="text-red-500 text-xs text-center hidden"></p>
            </div>
        </div>

        <div id="mainSection" class="hidden container mx-auto p-6">
            <div class="flex space-x-6 border-b border-gray-800 mb-6">
                <button onclick="showTab('users')" class="tab-btn px-4 py-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-white transition active" id="btn-users">Usuarios</button>
                <button onclick="showTab('anthills')" class="tab-btn px-4 py-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-white transition" id="btn-anthills">Hormigueros</button>
                <button onclick="showTab('queues')" class="tab-btn px-4 py-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-white transition" id="btn-queues">Colas Redis</button>
            </div>

            <!-- Users Tab -->
            <div id="tab-users" class="tab-content active space-y-4">
                <div class="flex justify-between items-center">
                    <h2 class="text-lg font-bold">Gestión de Usuarios</h2>
                    <button onclick="loadUsers()" class="bg-gray-800 p-2 rounded border border-gray-700 hover:bg-gray-700 transition">🔄</button>
                </div>
                <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-gray-900 text-gray-400 uppercase text-[10px] tracking-widest">
                            <tr>
                                <th class="px-4 py-3">ID</th>
                                <th class="px-4 py-3">Usuario</th>
                                <th class="px-4 py-3">Email</th>
                                <th class="px-4 py-3">Rol</th>
                                <th class="px-4 py-3">Verificado</th>
                                <th class="px-4 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody"></tbody>
                    </table>
                </div>
            </div>

            <!-- Anthills Tab -->
            <div id="tab-anthills" class="tab-content space-y-4">
                <div class="flex justify-between items-center">
                    <h2 class="text-lg font-bold">Estado de los Hormigueros</h2>
                    <button onclick="loadAnthills()" class="bg-gray-800 p-2 rounded border border-gray-700 hover:bg-gray-700 transition">🔄</button>
                </div>
                <div id="anthillsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
            </div>

            <!-- Queues Tab -->
            <div id="tab-queues" class="tab-content space-y-4">
                <div class="flex justify-between items-center">
                    <h2 class="text-lg font-bold">Procesos en Segundo Plano (Redis)</h2>
                    <button onclick="loadQueues()" class="bg-gray-800 p-2 rounded border border-gray-700 hover:bg-gray-700 transition">🔄</button>
                </div>
                <div id="queuesGrid" class="grid grid-cols-1 md:grid-cols-2 gap-6"></div>
            </div>
        </div>

        <script>
            let token = localStorage.getItem('admin_token');

            function showTab(tab) {
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.getElementById('tab-' + tab).classList.add('active');
                document.getElementById('btn-' + tab).classList.add('active');
                if (tab === 'users') loadUsers();
                if (tab === 'anthills') loadAnthills();
                if (tab === 'queues') loadQueues();
            }

            async function apiCall(path, method = 'GET', body = null) {
                const options = {
                    method,
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    }
                };
                if (body) options.body = JSON.stringify(body);
                const res = await fetch(path, options);
                if (res.status === 401 || res.status === 403) {
                    logout();
                    return null;
                }
                return res.json();
            }

            async function login() {
                const username = document.getElementById('loginUser').value;
                const password = document.getElementById('loginPass').value;
                const res = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (res.ok && data.access_token) {
                    token = data.access_token;
                    localStorage.setItem('admin_token', token);
                    localStorage.setItem('admin_user', data.user.username);
                    checkAuth();
                } else {
                    document.getElementById('loginError').innerText = 'Credenciales inválidas o falta de permisos';
                    document.getElementById('loginError').classList.remove('hidden');
                }
            }

            function logout() {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_user');
                token = null;
                checkAuth();
            }

            function checkAuth() {
                if (token) {
                    document.getElementById('loginSection').classList.add('hidden');
                    document.getElementById('mainSection').classList.remove('hidden');
                    document.getElementById('userInfo').classList.remove('hidden');
                    document.getElementById('usernameDisplay').innerText = localStorage.getItem('admin_user');
                    showTab('users');
                } else {
                    document.getElementById('loginSection').classList.remove('hidden');
                    document.getElementById('mainSection').classList.add('hidden');
                    document.getElementById('userInfo').classList.add('hidden');
                }
            }

            async function loadUsers() {
                const users = await apiCall('/admin/users');
                if (!users) return;
                const body = document.getElementById('usersTableBody');
                body.innerHTML = users.map(u => \`
                    <tr class="border-b border-gray-700/50 hover:bg-white/5 transition">
                        <td class="px-4 py-3 font-mono text-xs text-gray-500">\${u.id}</td>
                        <td class="px-4 py-3 font-bold">\${u.username}</td>
                        <td class="px-4 py-3 text-gray-400 text-xs">\${u.email}</td>
                        <td class="px-4 py-3">
                            <select onchange="updateUserRole(\${u.id}, this.value)" class="bg-gray-900 border border-gray-700 rounded text-xs p-1">
                                <option value="user" \${u.role === 'user' ? 'selected' : ''}>User</option>
                                <option value="admin" \${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </td>
                        <td class="px-4 py-3">\${u.verified ? '✅' : '❌'}</td>
                        <td class="px-4 py-3">
                            <button onclick="deleteUser(\${u.id})" class="text-red-500 hover:text-red-400 transition text-xs">Eliminar</button>
                        </td>
                    </tr>
                \`).join('');
            }

            async function updateUserRole(id, role) {
                await apiCall('/admin/users/' + id, 'PATCH', { role });
                loadUsers();
            }

            async function deleteUser(id) {
                if (confirm('¿Eliminar usuario?')) {
                    await apiCall('/admin/users/' + id, 'DELETE');
                    loadUsers();
                }
            }

            async function loadAnthills() {
                const anthills = await apiCall('/admin/anthills');
                if (!anthills) return;
                const grid = document.getElementById('anthillsGrid');
                grid.innerHTML = anthills.map(a => {
                    const food = a.resources.find(r => r.resource.type === 'F')?.stock || 0;
                    const wood = a.resources.find(r => r.resource.type === 'W')?.stock || 0;
                    const leaves = a.resources.find(r => r.resource.type === 'L')?.stock || 0;

                    return \`
                    <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-xl space-y-4">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="font-bold text-cyan-400">Hormiguero #\${a.id}</h3>
                                <p class="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Dueño: \${a.owner.username}</p>
                            </div>
                            <span class="bg-gray-900 px-2 py-1 rounded text-[10px] font-mono text-gray-400">\${a.positionX}, \${a.positionY}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-xs">
                            <div class="space-y-1">
                                <label class="block text-[10px] text-gray-500 font-bold">HUEVOS</label>
                                <input type="number" value="\${a.eggs}" onchange="updateAnthill(\${a.id}, {eggs: parseInt(this.value)})" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 outline-none focus:border-cyan-500">
                            </div>
                            <div class="space-y-1">
                                <label class="block text-[10px] text-gray-500 font-bold">LARVAS</label>
                                <input type="number" value="\${a.larva}" onchange="updateAnthill(\${a.id}, {larva: parseInt(this.value)})" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 outline-none focus:border-cyan-500">
                            </div>
                            <div class="space-y-1">
                                <label class="block text-[10px] text-gray-500 font-bold">HORMIGAS</label>
                                <input type="number" value="\${a.ants}" onchange="updateAnthill(\${a.id}, {ants: parseInt(this.value)})" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 outline-none focus:border-cyan-500">
                            </div>
                            <div class="space-y-1">
                                <label class="block text-[10px] text-gray-500 font-bold">OCUPADAS</label>
                                <input type="number" value="\${a.antsBusy}" onchange="updateAnthill(\${a.id}, {antsBusy: parseInt(this.value)})" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 outline-none focus:border-cyan-500">
                            </div>
                        </div>
                        <div class="border-t border-gray-700 pt-3 space-y-2">
                            <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Almacén de Recursos</p>
                            <div class="flex space-x-2">
                                \${a.resources.map(r => \`
                                    <div class="flex-grow bg-gray-900 p-2 rounded border border-gray-700 text-center">
                                        <div class="text-[10px] text-gray-500">\${r.resource.type}</div>
                                        <input type="number" value="\${r.stock}" onchange="updateResource(\${a.id}, \${r.resourceId}, parseInt(this.value))" class="w-full bg-transparent text-center font-bold text-cyan-500 outline-none">
                                    </div>
                                \`).join('')}
                            </div>
                        </div>
                    </div>
                \`}).join('');
            }

            async function updateAnthill(id, data) {
                await apiCall('/admin/anthills/' + id, 'PATCH', data);
            }

            async function updateResource(anthillId, resourceId, stock) {
                await apiCall('/admin/anthills/' + anthillId, 'PATCH', {
                    resources: [{ resourceId, stock }]
                });
            }

            async function loadQueues() {
                const stats = await apiCall('/admin/queues/stats');
                if (!stats) return;
                const grid = document.getElementById('queuesGrid');
                grid.innerHTML = Object.entries(stats).map(([name, s]) => \`
                    <div class="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-xl">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-lg uppercase tracking-wider text-cyan-400">\${name}</h3>
                            <div class="flex space-x-2">
                                <button onclick="cleanQueue('\${name}')" class="text-[10px] bg-yellow-900/30 text-yellow-500 px-2 py-1 rounded border border-yellow-700/50 hover:bg-yellow-900/50 transition">Limpiar</button>
                                <button onclick="retryQueue('\${name}')" class="text-[10px] bg-green-900/30 text-green-500 px-2 py-1 rounded border border-green-700/50 hover:bg-green-900/50 transition">Reintentar</button>
                            </div>
                        </div>
                        <div class="grid grid-cols-3 gap-3 text-center">
                            <div class="bg-gray-900 p-2 rounded border border-gray-700">
                                <div class="text-xs font-bold text-green-500">\${s.completed}</div>
                                <div class="text-[8px] text-gray-500 uppercase">Completados</div>
                            </div>
                            <div class="bg-gray-900 p-2 rounded border border-gray-700">
                                <div class="text-xs font-bold text-red-500">\${s.failed}</div>
                                <div class="text-[8px] text-gray-500 uppercase">Fallidos</div>
                            </div>
                            <div class="bg-gray-900 p-2 rounded border border-gray-700">
                                <div class="text-xs font-bold text-blue-500">\${s.waiting + s.active + s.delayed}</div>
                                <div class="text-[8px] text-gray-500 uppercase">Pendientes</div>
                            </div>
                        </div>
                    </div>
                \`).join('');
            }

            async function cleanQueue(name) {
                if (confirm('¿Vaciar cola ' + name + '?')) {
                    await apiCall('/admin/queues/' + name + '/clean', 'POST');
                    loadQueues();
                }
            }

            async function retryQueue(name) {
                await apiCall('/admin/queues/' + name + '/retry', 'POST');
                loadQueues();
            }

            checkAuth();
        </script>
    </body>
    </html>
    `;
    res.send(html);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('users/:id')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.adminService.updateUser(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('users/:id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('anthills')
  getAllAnthills() {
    return this.adminService.getAllAnthills();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('anthills/:id')
  updateAnthill(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.adminService.updateAnthill(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('queues/stats')
  getQueuesStats() {
    return this.adminService.getQueuesStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('queues/:name/clean')
  cleanQueue(@Param('name') name: string) {
    return this.adminService.cleanQueue(name);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('queues/:name/retry')
  retryFailedJobs(@Param('name') name: string) {
    return this.adminService.retryFailedJobs(name);
  }
}

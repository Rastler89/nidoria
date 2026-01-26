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
            .sidebar-item.active { background-color: #d97706; color: white; border-right: 4px solid #fff; }
            .sidebar-item:hover:not(.active) { background-color: #374151; }
        </style>
    </head>
    <body class="bg-gray-900 text-gray-100 min-h-screen font-sans">
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

        <div class="flex flex-row min-h-screen">
            <!-- Sidebar -->
            <aside class="w-64 bg-gray-800 border-r border-gray-700 flex flex-col sticky top-0 h-screen z-40">
                <div class="p-6 border-b border-gray-700">
                    <span class="text-2xl font-black text-amber-500 tracking-tighter flex items-center">
                        <i class="fas fa-bug mr-2 text-3xl"></i>
                        <span>ANTMASTER</span>
                    </span>
                </div>
                <nav class="flex-grow overflow-y-auto custom-scrollbar py-4">
                    <div class="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">General</div>
                    <a href="javascript:void(0)" onclick="switchTab('overview')" id="tab-overview" class="sidebar-item active px-6 py-3 flex items-center text-sm font-medium transition-colors">
                        <i class="fas fa-chart-line mr-3 w-5 text-center"></i> Dashboard
                    </a>

                    <div class="px-4 mt-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gestión de Juego</div>
                    <a href="javascript:void(0)" onclick="switchTab('anthills')" id="tab-anthills" class="sidebar-item px-6 py-3 flex items-center text-sm font-medium transition-colors">
                        <i class="fas fa-home mr-3 w-5 text-center"></i> Hormigueros
                    </a>
                    <a href="javascript:void(0)" onclick="switchTab('constructions')" id="tab-constructions" class="sidebar-item px-6 py-3 flex items-center text-sm font-medium transition-colors">
                        <i class="fas fa-hammer mr-3 w-5 text-center"></i> Construcciones
                    </a>
                    <a href="javascript:void(0)" onclick="switchTab('investigations')" id="tab-investigations" class="sidebar-item px-6 py-3 flex items-center text-sm font-medium transition-colors">
                        <i class="fas fa-flask mr-3 w-5 text-center"></i> Investigaciones
                    </a>
                    <a href="javascript:void(0)" onclick="switchTab('ants')" id="tab-ants" class="sidebar-item px-6 py-3 flex items-center text-sm font-medium transition-colors">
                        <i class="fas fa-bug mr-3 w-5 text-center"></i> Tipos Hormigas
                    </a>
                    <a href="javascript:void(0)" onclick="switchTab('resources')" id="tab-resources" class="sidebar-item px-6 py-3 flex items-center text-sm font-medium transition-colors">
                        <i class="fas fa-box mr-3 w-5 text-center"></i> Recursos
                    </a>
                    <a href="javascript:void(0)" onclick="switchTab('requirements')" id="tab-requirements" class="sidebar-item px-6 py-3 flex items-center text-sm font-medium transition-colors">
                        <i class="fas fa-list-check mr-3 w-5 text-center"></i> Requerimientos
                    </a>

                    <div class="px-4 mt-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sistema</div>
                    <a href="javascript:void(0)" onclick="switchTab('users')" id="tab-users" class="sidebar-item px-6 py-3 flex items-center text-sm font-medium transition-colors">
                        <i class="fas fa-users mr-3 w-5 text-center"></i> Usuarios
                    </a>
                    <a href="javascript:void(0)" onclick="switchTab('redis')" id="tab-redis" class="sidebar-item px-6 py-3 flex items-center text-sm font-medium transition-colors">
                        <i class="fas fa-server mr-3 w-5 text-center"></i> Colas Redis
                    </a>
                </nav>
                <div class="p-4 border-t border-gray-700 bg-gray-800/50">
                    <button onclick="logout()" class="w-full flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition">
                        <i class="fas fa-sign-out-alt mr-2"></i> Cerrar Sesión
                    </button>
                </div>
            </aside>

            <!-- Main Content -->
            <div class="flex-grow flex flex-col h-screen overflow-hidden">
                <header class="bg-gray-800 border-b border-gray-700 px-8 py-4 flex justify-between items-center z-30 shadow-md">
                    <h2 id="current-tab-title" class="text-xl font-bold text-white">Dashboard</h2>
                    <div class="flex items-center space-x-4">
                        <div class="text-right">
                            <div id="adminName" class="text-sm font-bold text-white">Admin</div>
                            <div class="text-[10px] text-amber-500 uppercase font-black">Super Administrador</div>
                        </div>
                        <div class="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold border-2 border-gray-700">
                            <i class="fas fa-user-shield"></i>
                        </div>
                    </div>
                </header>

                <main class="flex-grow overflow-y-auto p-8 custom-scrollbar bg-gray-900">
                    <!-- Overview Tab -->
                    <div id="content-overview" class="tab-content space-y-8">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div class="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-xl relative overflow-hidden group">
                                <div class="absolute -right-4 -bottom-4 text-8xl text-gray-700/20 group-hover:scale-110 transition-transform"><i class="fas fa-users"></i></div>
                                <div class="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Usuarios</div>
                                <div class="text-5xl font-black text-white" id="stat-users">0</div>
                            </div>
                            <div class="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-xl relative overflow-hidden group">
                                <div class="absolute -right-4 -bottom-4 text-8xl text-gray-700/20 group-hover:scale-110 transition-transform"><i class="fas fa-home"></i></div>
                                <div class="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Hormigueros</div>
                                <div class="text-5xl font-black text-white" id="stat-anthills">0</div>
                            </div>
                            <div class="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-xl relative overflow-hidden group">
                                <div class="absolute -right-4 -bottom-4 text-8xl text-gray-700/20 group-hover:scale-110 transition-transform"><i class="fas fa-check-circle"></i></div>
                                <div class="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Verificados</div>
                                <div class="text-5xl font-black text-green-500" id="stat-verified">0</div>
                            </div>
                        </div>

                        <div class="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden shadow-2xl">
                            <div class="px-8 py-5 bg-gray-700/30 border-b border-gray-700 flex justify-between items-center">
                                <h3 class="font-black text-sm uppercase tracking-widest text-gray-400">Estado de Colas de Trabajo (Bull)</h3>
                                <button onclick="loadStats()" class="text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-black px-4 py-1.5 rounded-full transition uppercase shadow-lg shadow-amber-900/20">Sincronizar</button>
                            </div>
                            <div class="p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6" id="redis-stats-grid"></div>
                        </div>
                    </div>

                    <!-- Users Tab -->
                    <div id="content-users" class="tab-content hidden space-y-6">
                        <div class="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden shadow-2xl">
                            <div class="overflow-x-auto">
                                <table class="w-full text-left">
                                    <thead class="bg-gray-700/50 text-gray-400 text-[10px] uppercase font-black tracking-widest">
                                        <tr>
                                            <th class="px-8 py-4">ID</th>
                                            <th class="px-8 py-4">Usuario</th>
                                            <th class="px-8 py-4">Email</th>
                                            <th class="px-8 py-4">Rol</th>
                                            <th class="px-8 py-4">Estado</th>
                                            <th class="px-8 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="users-table-body" class="divide-y divide-gray-700"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Anthills Tab -->
                    <div id="content-anthills" class="tab-content hidden space-y-6">
                        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" id="anthills-grid"></div>
                    </div>

                    <!-- Constructions Tab -->
                    <div id="content-constructions" class="tab-content hidden space-y-6">
                        <div class="flex justify-between items-center">
                            <h2 class="text-xl font-bold text-white uppercase tracking-tighter">Catálogo de Edificaciones</h2>
                            <button onclick="openEditor('constructions')" class="bg-amber-600 hover:bg-amber-700 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition shadow-lg shadow-amber-900/20"><i class="fas fa-plus mr-2"></i>Nueva Construcción</button>
                        </div>
                        <div id="constructions-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"></div>
                    </div>

                    <!-- Investigations Tab -->
                    <div id="content-investigations" class="tab-content hidden space-y-6">
                        <div class="flex justify-between items-center">
                            <h2 class="text-xl font-bold text-white uppercase tracking-tighter">Laboratorio de Investigaciones</h2>
                            <button onclick="openEditor('investigations')" class="bg-amber-600 hover:bg-amber-700 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition shadow-lg shadow-amber-900/20"><i class="fas fa-flask mr-2"></i>Nueva Investigación</button>
                        </div>
                        <div id="investigations-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"></div>
                    </div>

                    <!-- Ants Tab -->
                    <div id="content-ants" class="tab-content hidden space-y-6">
                        <div class="flex justify-between items-center">
                            <h2 class="text-xl font-bold text-white uppercase tracking-tighter">Casta de Hormigas</h2>
                            <button onclick="openEditor('ants')" class="bg-amber-600 hover:bg-amber-700 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition shadow-lg shadow-amber-900/20"><i class="fas fa-plus mr-2"></i>Nuevo Tipo</button>
                        </div>
                        <div id="ants-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"></div>
                    </div>

                    <!-- Resources Tab -->
                    <div id="content-resources" class="tab-content hidden space-y-6">
                        <div class="flex justify-between items-center">
                            <h2 class="text-xl font-bold text-white uppercase tracking-tighter">Recursos Naturales</h2>
                            <button onclick="openEditor('resources')" class="bg-amber-600 hover:bg-amber-700 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition shadow-lg shadow-amber-900/20"><i class="fas fa-plus mr-2"></i>Nuevo Recurso</button>
                        </div>
                        <div id="resources-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"></div>
                    </div>

                    <!-- Requirements Tab -->
                    <div id="content-requirements" class="tab-content hidden space-y-6">
                        <div class="flex justify-between items-center">
                            <h2 class="text-xl font-bold text-white uppercase tracking-tighter">Árbol de Requerimientos</h2>
                            <button onclick="openEditor('requirements')" class="bg-amber-600 hover:bg-amber-700 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition shadow-lg shadow-amber-900/20"><i class="fas fa-link mr-2"></i>Nuevo Requerimiento</button>
                        </div>
                        <div id="requirements-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"></div>
                    </div>

                    <!-- Redis Tab -->
                    <div id="content-redis" class="tab-content hidden space-y-6">
                        <div class="bg-gray-800 rounded-3xl border border-gray-700 p-8 shadow-2xl">
                            <div class="flex items-center mb-6">
                                <div class="w-16 h-16 bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-500 text-3xl mr-6 border border-blue-800">
                                    <i class="fas fa-server"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold">BullBoard Monitor</h3>
                                    <p class="text-gray-400">Control avanzado de reintentos y monitorización de procesos en tiempo real.</p>
                                </div>
                            </div>
                            <a href="/queues" target="_blank" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-blue-900/20">
                                Abrir Panel Externo <i class="fas fa-external-link-alt ml-2 text-xs"></i>
                            </a>
                        </div>
                        <div id="redis-detailed-stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"></div>
                    </div>
                </main>

                <footer class="p-4 bg-gray-800 border-t border-gray-700 text-center text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    AntMaster System v2.0 &bull; Administrador de Colonia Basado en WordPress Style
                </footer>
            </div>
        </div>

        <!-- Generic Modal -->
        <div id="genericModal" class="fixed inset-0 bg-black/80 flex items-center justify-center hidden z-50 p-4">
             <div class="bg-gray-800 rounded-3xl p-8 max-w-lg w-full border border-gray-700 shadow-2xl overflow-y-auto max-h-[90vh]">
                 <h2 id="modalTitle" class="text-2xl font-black mb-6 text-amber-500 uppercase tracking-tighter">Editor</h2>
                 <div id="modalBody" class="space-y-4">
                    <!-- Fields will be injected here -->
                 </div>
                 <div class="flex space-x-3 pt-8">
                    <button onclick="toggleModal()" class="flex-grow bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition">Cancelar</button>
                    <button id="modalSaveBtn" class="flex-grow bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition shadow-lg">Guardar Cambios</button>
                 </div>
             </div>
        </div>

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

            function toggleModal() {
                document.getElementById('genericModal').classList.toggle('hidden');
            }

            function switchTab(tabId) {
                document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
                const target = document.getElementById('content-' + tabId);
                if (target) target.classList.remove('hidden');

                document.querySelectorAll('.sidebar-item').forEach(b => {
                    b.classList.remove('active');
                });
                const tabBtn = document.getElementById('tab-' + tabId);
                if (tabBtn) tabBtn.classList.add('active');

                currentTab = tabId;

                const titles = {
                    'overview': 'Dashboard',
                    'users': 'Gestión de Usuarios',
                    'anthills': 'Monitor de Hormigueros',
                    'constructions': 'Construcciones',
                    'investigations': 'Investigaciones',
                    'ants': 'Casta de Hormigas',
                    'resources': 'Recursos Naturales',
                    'requirements': 'Árbol de Requerimientos',
                    'redis': 'Colas de Trabajo (Redis)'
                };
                document.getElementById('current-tab-title').innerText = titles[tabId] || 'Admin';

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
                if (tab === 'constructions') loadGenericCRUD('constructions');
                if (tab === 'investigations') loadGenericCRUD('investigations');
                if (tab === 'ants') loadGenericCRUD('ants');
                if (tab === 'resources') loadGenericCRUD('resources');
                if (tab === 'requirements') loadGenericCRUD('requirements');
                if (tab === 'redis') loadRedisDetails();
            }

            async function loadGenericCRUD(entity) {
                const container = document.getElementById(entity + '-grid');
                if (!container) return;
                container.innerHTML = '<div class="col-span-full text-center py-10"><i class="fas fa-spinner fa-spin mr-2"></i>Cargando...</div>';

                try {
                    const data = await apiFetch('/antmaster/api/' + entity);
                    container.innerHTML = '';
                    if (data.length === 0) {
                        container.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500 italic">No hay registros.</div>';
                        return;
                    }
                    data.forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col justify-between hover:border-amber-500/50 transition-colors';

                        let details = '';
                        if (entity === 'ants') {
                            details = \`Atq: \${item.attack} | Def: \${item.defense} | Coste: \${item.cost}\`;
                        } else if (entity === 'resources') {
                            details = \`Tipo: \${item.type}\`;
                        } else if (entity === 'requirements') {
                            details = \`Item: \${item.item} | Tipo: \${item.typeItem} | Req: \${item.resource}\`;
                        } else if (item.effects) {
                            details = JSON.stringify(item.effects).substring(0, 100);
                        }

                        div.innerHTML = \`
                            <div>
                                <h4 class="font-bold text-white mb-1">\${item.name || 'ID: ' + item.id}</h4>
                                <div class="text-[10px] text-amber-500 font-black uppercase tracking-widest">\${entity.slice(0, -1)}</div>
                                <div class="mt-4 text-xs text-gray-400 font-mono">
                                    \${details}
                                </div>
                            </div>
                            <div class="mt-6 pt-4 border-t border-gray-700 flex justify-end space-x-4">
                                <button onclick="openEditor('\${entity}', \${item.id}, \${JSON.stringify(item).replace(/"/g, '&quot;')})" class="text-amber-500 hover:text-amber-400 text-[10px] font-black uppercase tracking-widest transition-colors"><i class="fas fa-edit mr-1"></i>Editar</button>
                                <button onclick="deleteItem('\${entity}', \${item.id})" class="text-red-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors"><i class="fas fa-trash mr-1"></i>Borrar</button>
                            </div>
                        \`;
                        container.appendChild(div);
                    });
                } catch(e) {
                    container.innerHTML = '<div class="col-span-full text-center py-10 text-red-500 italic">Error al cargar datos.</div>';
                }
            }

            async function deleteItem(entity, id) {
                if (!confirm('¿Seguro que quieres eliminar este registro?')) return;
                try {
                    await apiFetch(\`/antmaster/api/\${entity}/\${id}\`, { method: 'DELETE' });
                    loadGenericCRUD(entity);
                } catch(e) {
                    alert('Error al eliminar');
                }
            }

            function openEditor(entity, id = null, currentData = {}) {
                const title = id ? 'Editar ' + entity.slice(0, -1) : 'Nuevo ' + entity.slice(0, -1);
                document.getElementById('modalTitle').innerText = title;
                const body = document.getElementById('modalBody');
                body.innerHTML = '';

                let fields = [];
                if (entity === 'constructions' || entity === 'investigations') {
                    fields = ['name', 'preview', 'effects'];
                } else if (entity === 'ants') {
                    fields = ['name', 'type', 'attack', 'defense', 'heal', 'capacity', 'cost'];
                } else if (entity === 'resources') {
                    fields = ['name', 'type'];
                } else if (entity === 'requirements') {
                    fields = ['item', 'typeItem', 'resourceId', 'resourceType', 'resource'];
                }

                fields.forEach(f => {
                    const div = document.createElement('div');
                    let val = currentData[f] !== undefined ? currentData[f] : '';
                    if (typeof val === 'object') val = JSON.stringify(val);

                    div.innerHTML = \`
                        <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">\${f}</label>
                        <input id="field-\${f}" type="text" value="\${val}" class="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition shadow-inner">
                    \`;
                    body.appendChild(div);
                });

                document.getElementById('modalSaveBtn').onclick = () => saveItem(entity, id);
                toggleModal();
            }

            async function saveItem(entity, id) {
                const body = {};
                const inputs = document.querySelectorAll('#modalBody input');
                inputs.forEach(input => {
                    const field = input.id.replace('field-', '');
                    let val = input.value;
                    // Try to parse JSON for 'effects'
                    if (field === 'effects' && val) {
                        try { val = JSON.parse(val); } catch(e) {}
                    }
                    // Try to convert to number if it looks like one
                    if (val !== '' && !isNaN(val) && field !== 'name' && field !== 'type' && field !== 'typeItem' && field !== 'resourceType') {
                        val = +val;
                    }
                    body[field] = val;
                });

                const url = id ? \`/antmaster/api/\${entity}/\${id}\` : \`/antmaster/api/\${entity}\`;
                const method = id ? 'PATCH' : 'POST';

                try {
                    const res = await apiFetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                    toggleModal();
                    loadGenericCRUD(entity);
                } catch(e) {
                    alert('Error al guardar: ' + e.message);
                }
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
                                <p class="text-xs text-gray-500">Dueño: \${a.owner.username}</p>
                            </div>
                            <div class="text-right">
                                <div class="text-[10px] text-gray-400 uppercase font-bold">Posición</div>
                                <div class="text-sm font-mono">\${a.positionX}, \${a.positionY}</div>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2 mb-4">
                            <div class="bg-gray-900/50 p-3 rounded-xl border border-gray-700">
                                <label class="text-[9px] text-gray-500 uppercase font-black block mb-1">Hormigas</label>
                                <input type="number" value="\${a.ants}" onchange="quickUpdateAnthill(\${a.id}, 'ants', this.value)" class="w-full bg-transparent text-white font-bold outline-none focus:text-amber-500 transition-colors">
                            </div>
                            <div class="bg-gray-900/50 p-3 rounded-xl border border-gray-700">
                                <label class="text-[9px] text-gray-500 uppercase font-black block mb-1">Huevos</label>
                                <input type="number" value="\${a.eggs}" onchange="quickUpdateAnthill(\${a.id}, 'eggs', this.value)" class="w-full bg-transparent text-white font-bold outline-none focus:text-amber-500 transition-colors">
                            </div>
                            <div class="bg-gray-900/50 p-3 rounded-xl border border-gray-700">
                                <label class="text-[9px] text-gray-500 uppercase font-black block mb-1">Larvas</label>
                                <input type="number" value="\${a.larva}" onchange="quickUpdateAnthill(\${a.id}, 'larva', this.value)" class="w-full bg-transparent text-white font-bold outline-none focus:text-amber-500 transition-colors">
                            </div>
                            <div class="bg-gray-900/50 p-3 rounded-xl border border-gray-700">
                                <label class="text-[9px] text-gray-500 uppercase font-black block mb-1">Ocupadas</label>
                                <input type="number" value="\${a.antsBusy}" onchange="quickUpdateAnthill(\${a.id}, 'antsBusy', this.value)" class="w-full bg-transparent text-white font-bold outline-none focus:text-amber-500 transition-colors">
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-1">
                            \${resHtml}
                        </div>
                    \`;
                    grid.appendChild(div);
                });
            }

            async function quickUpdateAnthill(id, field, value) {
                try {
                    await apiFetch(\`/antmaster/api/anthills/\${id}\`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ [field]: value })
                    });
                } catch(e) {
                    alert('Error al actualizar hormiguero');
                }
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

  // Constructions
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/constructions')
  getConstructions() {
    return this.adminService.getConstructions();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('api/constructions')
  createConstruction(@Body() data: any) {
    return this.adminService.createConstruction(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('api/constructions/:id')
  updateConstruction(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateConstruction(+id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('api/constructions/:id')
  deleteConstruction(@Param('id') id: string) {
    return this.adminService.deleteConstruction(+id);
  }

  // Investigations
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/investigations')
  getInvestigations() {
    return this.adminService.getInvestigations();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('api/investigations')
  createInvestigation(@Body() data: any) {
    return this.adminService.createInvestigation(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('api/investigations/:id')
  updateInvestigation(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateInvestigation(+id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('api/investigations/:id')
  deleteInvestigation(@Param('id') id: string) {
    return this.adminService.deleteInvestigation(+id);
  }

  // Ants
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/ants')
  getAnts() {
    return this.adminService.getAnts();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('api/ants')
  createAnt(@Body() data: any) {
    return this.adminService.createAnt(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('api/ants/:id')
  updateAnt(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateAnt(+id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('api/ants/:id')
  deleteAnt(@Param('id') id: string) {
    return this.adminService.deleteAnt(+id);
  }

  // Resources
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/resources')
  getResources() {
    return this.adminService.getResources();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('api/resources')
  createResource(@Body() data: any) {
    return this.adminService.createResource(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('api/resources/:id')
  updateResource(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateResource(+id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('api/resources/:id')
  deleteResource(@Param('id') id: string) {
    return this.adminService.deleteResource(+id);
  }

  // Requirements
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/requirements')
  getRequirements() {
    return this.adminService.getRequirements();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('api/requirements')
  createRequirement(@Body() data: any) {
    return this.adminService.createRequirement(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('api/requirements/:id')
  updateRequirement(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateRequirement(+id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('api/requirements/:id')
  deleteRequirement(@Param('id') id: string) {
    return this.adminService.deleteRequirement(+id);
  }

  // Anthill Update
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('api/anthills/:id')
  updateAnthill(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateAnthill(+id, data);
  }
}

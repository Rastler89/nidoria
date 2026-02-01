// prisma/seed.ts
import { PrismaClient, AntType, ResourceType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Datos para los tipos de Ant
  const antTypes = [
    // --- ARTILLERÍA (AntType.A) ---
    { name: 'Avispero Ácido', type: AntType.A, attack: 75, defense: 35, speed_attack: 6, speed_defense: 2, heal: 40, capacity: 2, cost: 150 },
    { name: 'Bomba melosa', type: AntType.A, attack: 70, defense: 40, speed_attack: 7, speed_defense: 2, heal: 45, capacity: 2, cost: 155 },
    { name: 'Lanza-Químicos', type: AntType.A, attack: 72, defense: 38, speed_attack: 7, speed_defense: 3, heal: 42, capacity: 2, cost: 152 },
    { name: 'Mortero de Seda', type: AntType.A, attack: 65, defense: 45, speed_attack: 0, speed_defense: 3, heal: 50, capacity: 3, cost: 160 },
    { name: 'Artillero de Resina', type: AntType.A, attack: 80, defense: 30, speed_attack: 0, speed_defense: 4, heal: 38, capacity: 2, cost: 148 },
    { name: 'Francotirador de Mandíbula', type: AntType.A, attack: 85, defense: 32, speed_attack: 0, speed_defense: 5, heal: 35, capacity: 1, cost: 152 },
    { name: 'Centinela de Polen', type: AntType.A, attack: 60, defense: 42, speed_attack: 0, speed_defense: 4, heal: 48, capacity: 3, cost: 150 },
    { name: 'Balista de Quitina', type: AntType.A, attack: 68, defense: 50, speed_attack: 0, speed_defense: 2, heal: 55, capacity: 4, cost: 173 },
    { name: 'Lanza-Néctar', type: AntType.A, attack: 55, defense: 55, speed_attack: 0, speed_defense: 2, heal: 60, capacity: 5, cost: 175 },
    { name: 'Catapulta de Detritos', type: AntType.A, attack: 75, defense: 45, speed_attack: 0, speed_defense: 2, heal: 65, capacity: 6, cost: 185 },

    // --- ATAQUE LIGERO (AntType.L) ---
    { name: 'Cazador de Sombras', type: AntType.L, attack: 70, defense: 35, speed_attack: 0, speed_defense: 8, heal: 45, capacity: 1, cost: 150 },
    { name: 'Relámpago Rojo', type: AntType.L, attack: 75, defense: 30, speed_attack: 0, speed_defense: 9, heal: 40, capacity: 1, cost: 145 },
    { name: 'Segador Mandibular', type: AntType.L, attack: 72, defense: 32, speed_attack: 0, speed_defense: 8, heal: 42, capacity: 1, cost: 146 },
    { name: 'Saltador Acróbata', type: AntType.L, attack: 78, defense: 28, speed_attack: 0, speed_defense: 10, heal: 38, capacity: 1, cost: 144 },
    { name: 'Fuerza Hormiguero', type: AntType.L, attack: 65, defense: 42, speed_attack: 0, speed_defense: 6, heal: 52, capacity: 2, cost: 159 },
    { name: 'Verdugo Sedoso', type: AntType.L, attack: 72, defense: 38, speed_attack: 0, speed_defense: 7, heal: 48, capacity: 2, cost: 158 },
    { name: 'Saqueador Minúsculo', type: AntType.L, attack: 78, defense: 32, speed_attack: 0, speed_defense: 9, heal: 35, capacity: 1, cost: 145 },
    { name: 'Guardián de Escamas', type: AntType.L, attack: 58, defense: 48, speed_attack: 0, speed_defense: 5, heal: 58, capacity: 3, cost: 164 },
    { name: 'Centinela Vigilante', type: AntType.L, attack: 68, defense: 40, speed_attack: 0, speed_defense: 7, heal: 45, capacity: 2, cost: 153 },
    { name: 'Infiltrado Húmedo', type: AntType.L, attack: 74, defense: 34, speed_attack: 0, speed_defense: 8, heal: 38, capacity: 1, cost: 146 },

    // --- ATAQUE PESADO (AntType.W) ---
    { name: 'Destructor de Cuernos', type: AntType.W, attack: 60, defense: 70, speed_attack: 0, speed_defense: 3, heal: 85, capacity: 8, cost: 215 },
    { name: 'Máquina Excavadora', type: AntType.W, attack: 75, defense: 55, speed_attack: 0, speed_defense: 3, heal: 78, capacity: 7, cost: 208 },
    { name: 'Gladiador Cosechador', type: AntType.W, attack: 65, defense: 60, speed_attack: 0, speed_defense: 4, heal: 80, capacity: 10, cost: 205 },
    { name: 'Tormento de Fuego', type: AntType.W, attack: 70, defense: 60, speed_attack: 0, speed_defense: 4, heal: 70, capacity: 6, cost: 200 },
    { name: 'Guardián de Mandíbula', type: AntType.W, attack: 62, defense: 65, speed_attack: 0, speed_defense: 2, heal: 90, capacity: 9, cost: 217 },
    { name: 'Asaltante Árbol', type: AntType.W, attack: 68, defense: 62, speed_attack: 0, speed_defense: 5, heal: 75, capacity: 7, cost: 205 },
    { name: 'Golpeador de Roca', type: AntType.W, attack: 80, defense: 50, speed_attack: 0, speed_defense: 4, heal: 72, capacity: 6, cost: 202 },
    { name: 'Moldeador de Barro', type: AntType.W, attack: 55, defense: 68, speed_attack: 0, speed_defense: 2, heal: 82, capacity: 8, cost: 205 },
    { name: 'Torreón Azucarero', type: AntType.W, attack: 50, defense: 60, speed_attack: 0, speed_defense: 1, heal: 95, capacity: 15, cost: 220 },
    { name: 'Muralla de Ébano', type: AntType.W, attack: 78, defense: 75, speed_attack: 0, speed_defense: 3, heal: 88, capacity: 8, cost: 241 },
  ];

  for (const ant of antTypes) {
    await prisma.ant.upsert({
      where: { name: ant.name },
      update: {},
      create: ant,
    });
  }

  // Datos para los tipos de Resource
  const resourceTypes = [
    { name: 'Comida', type: ResourceType.F },
    { name: 'Madera', type: ResourceType.W },
    { name: 'Hojas', type: ResourceType.L },
  ];

  for (const resource of resourceTypes) {
    await prisma.resource.upsert({
      where: { name: resource.name },
      update: {},
      create: resource,
    });
  }

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// prisma/seed.ts
import { PrismaClient, AntType, ResourceType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Datos para los tipos de Ant
  const antTypes = [
    { name: 'Warrior', type: AntType.W, attack: 10, defense: 8, speed: 5, heal: 2, capacity: 1, cost: 50 },
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
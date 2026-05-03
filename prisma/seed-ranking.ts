import { PrismaClient, AntType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed de Ranking y Títulos...');

  // 1. Crear Título de Fundador
  const founderTitle = await prisma.title.upsert({
    where: { name: 'Fundador' },
    update: {},
    create: {
      name: 'Fundador',
      description: 'Arquitecto pionero de las profundidades de Nidoria.',
      style: {
        className: 'founder-badge-animated',
        color: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.6)',
        effect: 'golden-shimmer'
      }
    }
  });
  console.log('🏆 Título "Fundador" creado.');

  // 2. Actualizar puntos de Edificios (Ejemplos)
  const constructions = await prisma.construction.findMany();
  for (const c of constructions) {
    await prisma.construction.update({
      where: { id: c.id },
      data: { points: 10 } // 10 puntos base por edificio
    });
  }
  console.log('🏗️ Puntos de edificios actualizados.');

  // 3. Actualizar puntos de Investigaciones
  const investigations = await prisma.investigation.findMany();
  for (const i of investigations) {
    await prisma.investigation.update({
      where: { id: i.id },
      data: { points: 15 } // 15 puntos por investigación
    });
  }
  console.log('🔬 Puntos de investigaciones actualizados.');

  // 4. Actualizar puntos de Hormigas
  const ants = await prisma.ant.findMany();
  for (const a of ants) {
    let pts = 1;
    if (a.type === AntType.ARTILLERY) pts = 10;
    if (a.type === AntType.WEIGHT) pts = 5;
    if (a.type === AntType.SPECIAL) pts = 50;
    
    await prisma.ant.update({
      where: { id: a.id },
      data: { points: pts }
    });
  }
  console.log('🐜 Puntos de unidades militares actualizados.');

  console.log('✅ Seed de Ranking completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import { MONSTERS } from '../data/monsters.data';

/**
 * Siembra el catálogo de monstruos del PvE. Es idempotente: usa `code` como
 * clave para que actualizar el balance no duplique filas ni toque partidas.
 */
export async function seedMonsters(prisma: PrismaClient) {
  for (const monster of MONSTERS) {
    await prisma.monster.upsert({
      where: { code: monster.code },
      update: monster,
      create: monster,
    });
  }

  console.log('✔ Monsters seeded');
}

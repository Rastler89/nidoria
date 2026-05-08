import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameState, AnthillStats } from './types';

@Injectable()
export class GameEngineService {
  private readonly logger = new Logger(GameEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el estado completo de un hormiguero para un usuario.
   * Centraliza la lógica de consulta para evitar duplicación (DRY).
   */
  async getFullState(userId: number): Promise<GameState | null> {
    const anthill = await this.prisma.anthill.findFirst({
      where: { ownerId: userId },
      include: {
        resources: { include: { resource: true } },
        constructions: { include: { construction: true } },
        investigations: { include: { investigation: true } },
        antsTotal: { include: { ant: true } },
        explorations: { include: { resource: true } },
      },
    });

    if (!anthill) return null;

    return {
      stats: {
        eggs: anthill.eggs,
        larva: anthill.larva,
        ants: anthill.ants,
        antsBusy: anthill.antsBusy,
      },
      resources: anthill.resources.map((r) => ({
        type: r.resource.type,
        name: r.resource.name,
        stock: r.stock,
      })),
      buildings: anthill.constructions.map((c) => ({
        id: c.id,
        type: c.construction.id,
        name: c.construction.name,
        code: c.construction.code,
        level: c.level,
        status: c.status,
        finishingAt: c.finishingAt,
      })),
      techs: anthill.investigations.map((i) => ({
        id: i.id,
        investigationId: i.investigation.id,
        name: i.investigation.name,
        level: i.level,
        status: i.status,
        finishingAt: i.finishingAt,
      })),
      army: anthill.antsTotal.map((a) => ({
        type: a.ant.type,
        name: a.ant.name,
        total: a.total,
        busy: a.busy,
      })),
      explorations: anthill.explorations.map((e) => ({
        resourceName: e.resource.name,
        resourceType: e.resource.type,
        workers: e.ants,
        quantity: e.quantity,
        duration: e.duration,
        createdAt: e.createdAt,
        finishingAt: new Date(e.createdAt.getTime() + e.duration * 1000),
      })),
    };
  }

  /**
   * Compara dos estados y devuelve solo las diferencias (Deltas).
   * Esto reduce drásticamente el uso de ancho de banda en WebSockets.
   */
  calculateDelta(oldState: Partial<GameState>, newState: GameState): Partial<GameState> {
    const delta: Partial<GameState> = {};

    // Comparar Stats (siempre enviamos el bloque si algo cambia)
    if (JSON.stringify(oldState.stats) !== JSON.stringify(newState.stats)) {
      delta.stats = newState.stats;
    }

    // Comparar Recursos
    if (JSON.stringify(oldState.resources) !== JSON.stringify(newState.resources)) {
      delta.resources = newState.resources;
    }

    // Para un RTS más avanzado, se podrían comparar arrays elemento a elemento,
    // pero para esta escala, comparar bloques por JSON es un buen equilibrio entre
    // complejidad y ahorro de datos.
    
    // Si queremos ser agresivos con el ahorro:
    if (JSON.stringify(oldState.buildings) !== JSON.stringify(newState.buildings)) {
      delta.buildings = newState.buildings;
    }
    
    if (JSON.stringify(oldState.techs) !== JSON.stringify(newState.techs)) {
      delta.techs = newState.techs;
    }

    if (JSON.stringify(oldState.army) !== JSON.stringify(newState.army)) {
      delta.army = newState.army;
    }

    if (JSON.stringify(oldState.explorations) !== JSON.stringify(newState.explorations)) {
      delta.explorations = newState.explorations;
    }

    return delta;
  }
}

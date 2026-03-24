import { Injectable } from '@nestjs/common';
import { AIPlayer, KnowledgeItem } from './entities/ai-player.entity';
import { AiManagerGateway } from './ai-manager.gateway';

@Injectable()
export class AiManagerService {
  private players: Map<string, AIPlayer> = new Map();

  constructor(private readonly gateway: AiManagerGateway) {}

  startPlayer(baseUrl: string, iterations: number, delay: number, config?: { username?: string, password?: string, isResume?: boolean, personality?: any }) {
    const player = new AIPlayer(
      baseUrl,
      (state) => this.gateway.broadcastState(player.username, state),
      (message, type) => this.gateway.broadcastLog(player.username, message, type),
      config
    );

    this.players.set(player.username, player);
    player.run(iterations, delay).then(() => {
        // Optional: remove or keep in map
    });

    return player.username;
  }

  stopPlayer(username: string) {
    const player = this.players.get(username);
    if (player) {
      player.stop();
      return true;
    }
    return false;
  }

  deletePlayer(username: string) {
    const player = this.players.get(username);
    if (player) {
      player.stop(); // Por seguridad, nos aseguramos que esté parado
      this.players.delete(username);
      return true;
    }
    return false;
  }

  forceAction(username: string, action: string) {
    const player = this.players.get(username);
    if (player) {
      player.forceAction(action);
      return true;
    }
    return false;
  }

  getAllPlayers() {
    return Array.from(this.players.values()).map(p => p.getState());
  }
}

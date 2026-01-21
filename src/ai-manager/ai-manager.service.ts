import { Injectable } from '@nestjs/common';
import { AIPlayer } from './entities/ai-player.entity';
import { AiManagerGateway } from './ai-manager.gateway';

@Injectable()
export class AiManagerService {
  private players: Map<string, AIPlayer> = new Map();

  constructor(private readonly gateway: AiManagerGateway) {}

  startPlayer(baseUrl: string, iterations: number, delay: number, config?: { username?: string, password?: string, isResume?: boolean }) {
    const player = new AIPlayer(
      baseUrl,
      (state) => this.gateway.broadcastState(state),
      (message, type) => this.gateway.broadcastLog(message, type),
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

  getAllPlayers() {
    return Array.from(this.players.values()).map(p => p.getState());
  }
}

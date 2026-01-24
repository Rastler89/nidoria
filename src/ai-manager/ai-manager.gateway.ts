import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AiManagerGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log(`Client connected: ${client.id}`);
  }

  broadcastLog(botName: string, message: string, type: string) {
    this.server.emit('log', { botName, message, type, timestamp: Date.now() });
  }

  broadcastState(botName: string, state: any) {
    this.server.emit('state', { botName, ...state });
  }

  @SubscribeMessage('requestStatus')
  handleRequestStatus(client: any) {
    // Optional: broadcast all players to the new connection
  }
}

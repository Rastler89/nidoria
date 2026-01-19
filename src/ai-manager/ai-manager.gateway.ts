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

  broadcastLog(message: string, type: string) {
    this.server.emit('log', { message, type, timestamp: Date.now() });
  }

  broadcastState(state: any) {
    this.server.emit('state', state);
  }

  @SubscribeMessage('requestStatus')
  handleRequestStatus(client: any) {
    // This could trigger a refresh from the service if we wanted to
  }
}

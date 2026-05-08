import { JwtService } from "@nestjs/jwt";
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { jwtConstants } from "src/auth/constants";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Logger } from "@nestjs/common";
import { GameEngineService } from "../engine/engine.service";
import { GameState } from "../engine/types";

@WebSocketGateway({
    cors: { origin: '*' },
})
export class AnthillGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(AnthillGateway.name);
    
    // Almacenamos el último estado enviado para calcular deltas
    // En producción, esto podría ir a Redis si hay múltiples instancias de API
    private lastStates: Map<string, Partial<GameState>> = new Map();

    constructor(
        private readonly jwtService: JwtService,
        private readonly engineService: GameEngineService,
        @InjectQueue('cria') private readonly criaQueue: Queue,
    ) {}

    async handleConnection(client: Socket) {
        try {
            const token = this.extractToken(client);

            if (!token) {
                this.logger.warn('Conexión rechazada: No se proporcionó token');
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token.replace('Bearer ', ''), {
                secret: jwtConstants.secret,
            });

            const userId = payload.sub;
            client.data.userId = userId;

            // Unir al cliente a su sala privada
            client.join(`anthill_${userId}`);

            this.logger.log(`Usuario ${userId} conectado`);

            // Reactivar Reina si es necesario
            await this.resumeQueenIfPaused(userId);

            // Sincronización inicial inmediata (sin setTimeout)
            await this.sendUpdate(userId);

        } catch (error) {
            this.logger.error(`Error de autenticación en Socket: ${error.message}`);
            client.emit('auth_error', { message: 'Tu sesión ha caducado' });
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data.userId;
        if (userId) {
            this.lastStates.delete(userId);
            this.logger.log(`Usuario ${userId} desconectado`);
        }
    }

    /**
     * Envía una actualización al usuario.
     * Implementa lógica de deltas para minimizar el tráfico.
     */
    async sendUpdate(userId: string) {
        const newState = await this.engineService.getFullState(parseInt(userId));
        if (!newState) return;

        const oldState = this.lastStates.get(userId) || {};
        const delta = this.engineService.calculateDelta(oldState, newState);

        // Si no hay cambios significativos, no enviamos nada
        if (Object.keys(delta).length === 0) return;

        // Emitimos el delta
        this.server.to(`anthill_${userId}`).emit('anthill_update', delta);
        
        // Actualizamos el caché del último estado
        this.lastStates.set(userId, newState);
    }

    private extractToken(client: Socket): string | undefined {
        return client.handshake.auth?.token ||
               client.handshake.headers?.authorization ||
               client.handshake.query?.token;
    }

    /**
     * Comprueba si la Reina necesita reactivarse al reconectar.
     * Nota: En alta concurrencia, esto debería ser un job de BullMQ o un check en el Engine.
     */
    private async resumeQueenIfPaused(userId: string) {
        try {
            // Buscamos si ya hay jobs para este usuario
            const jobs = await this.criaQueue.getJobs(['waiting', 'delayed']);
            const hasActiveJob = jobs.some(job => job.data?.userId === userId);

            if (!hasActiveJob) {
                this.logger.log(`🔄 Reactivando ciclo de la Reina para usuario ${userId}`);
                await this.criaQueue.add('new_egg', { userId }, {
                    delay: 60 * 1000,
                    removeOnComplete: true,
                    removeOnFail: true,
                });
            }
        } catch (e) {
            this.logger.error(`Error reactivando Reina: ${e.message}`);
        }
    }
}

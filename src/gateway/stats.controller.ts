import { JwtService } from "@nestjs/jwt";
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { jwtConstants } from "src/auth/constants";
import { PrismaService } from "src/prisma/prisma.service";


@WebSocketGateway({
    cors: { origin: '*' },
})
export class AnthillGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(private prisma: PrismaService, private jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        try {
            let token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization ||
                client.handshake.query?.token;

            if (!token) {
                console.warn('Conexión rechazada: No se proporcionó token');
                client.disconnect();
                return;
            }

            const cleanToken = token.replace('Bearer ', '');

            const payload = this.jwtService.verify(cleanToken, {
                secret: jwtConstants.secret,
            });

            const userId = payload.sub;

            // 4. Unir al cliente a su sala privada usando el ID real de la DB
            client.join(`anthill_${userId}`);

            // Opcional: Guardar el anthillId en el objeto cliente para usarlo luego
            client.data.anthillId = userId;

            console.log(`Usuario ${userId} conectado`);
        } catch (error) {
            console.error('Error de autenticación en Socket: ', error.mensaje);
            client.emit('auth_error', { message: 'Tu sesión ha caducado' });
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log('Cliente desconectado');
    }

    async sendUpdate(userId: string) {
        const anthill = await this.prisma.anthill.findFirst({
            where: { ownerId: parseInt(userId) },
            include: {
                resources: { include: { resource: true } },
                constructions: { include: { construction: true } },
                investigations: { include: { investigation: true } },
                antsTotal: { include: { ant: true } },
                explorations: { include: { resource: true } },
            },
        });

        if (!anthill) return;

        const gameState = {
            stats: {
                eggs: anthill.eggs,
                larva: anthill.larva,
                ants: anthill.ants,
                antsBusy: anthill.antsBusy,
            },
            resources: anthill.resources.map((r) => ({
                type: r.resource.name,
                stock: r.stock,
            })),
            buildings: anthill.constructions.map((c) => ({
                id: c.construction.id,
                name: c.construction.name,
                code: c.construction.code,
                level: c.level,
                status: c.status,
                finishingAt: c.finishingAt,
            })),
            techs: anthill.investigations.map((i) => ({
                id: i.investigation.id,
                name: i.investigation.name,
                level: i.level,
                status: i.status,
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

        if (this.server == null) {
            console.log('llega null', userId);
        }

        // Emitimos el objeto completo
        this.server.to(`anthill_${userId}`).emit('anthill_update', gameState);

        return gameState;
    }
}
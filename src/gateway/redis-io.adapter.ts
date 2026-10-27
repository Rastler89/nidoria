import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

/**
 * Adaptador Redis compartido por la API y el worker: cualquier proceso que
 * emita por Socket.IO difunde el evento a los clientes conectados a la API.
 */
export async function createRedisAdapter(): Promise<ReturnType<typeof createAdapter>> {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || 6379;
    const user = process.env.REDIS_USER || '';
    const password = process.env.REDIS_PASSWORD || '';
    const auth = (user || password) ? `${user}:${password}@` : '';
    const url = `redis://${auth}${host}:${port}`;

    const pubClient = createClient({ url });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    return createAdapter(pubClient, subClient);
}

export class RedisIoAdapter extends IoAdapter {
    private adapterConstructor: ReturnType<typeof createAdapter>;

    async connectToRedis(): Promise<void> {
        this.adapterConstructor = await createRedisAdapter();
    }

    createIOServer(port: number, options?: ServerOptions): any {
        const server = super.createIOServer(port, options);
        server.adapter(this.adapterConstructor);
        return server;
    }
}

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { findAuthUserById } from '@joel-academy/database';
import { Server, Socket } from 'socket.io';
import { DatabaseService } from '../../../common/database/database.service';
import type { JwtPayload } from '../../auth/interfaces/auth-user.interface';

export interface RealtimeNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  readAt: string | null;
  createdAt: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}

const NOTIFICATION_ROOM = 'user';

/**
 * Real-time delivery channel for in-app notifications.
 *
 * Security model:
 * - Every socket must authenticate with the same short-lived JWT access token
 *   the REST API uses (`type: 'access'`, active user), verified against
 *   `JWT_ACCESS_SECRET`. Unauthenticated connections are dropped immediately.
 * - Each authenticated socket joins exactly one private room, `user:{userId}`,
 *   derived server-side from the verified token - never from client-supplied
 *   data. There are no global channels, so a socket can only ever receive
 *   notifications addressed to its own user.
 * - `cors: true` only widens the HTTP handshake origin check (socket.io
 *   still validates it via token auth, and the browser enforces its own CORS
 *   rules); the actual authorization boundary is the verified JWT payload.
 */
@WebSocketGateway({
  namespace: '/notifications',
  cors: true,
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server | undefined;

  private readonly logger = new Logger('NotificationsGateway');

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly database: DatabaseService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      if (payload.type !== 'access') {
        client.disconnect(true);
        return;
      }
      const user = await findAuthUserById(this.database.client, payload.sub);
      if (!user || user.status !== 'ACTIVE') {
        client.disconnect(true);
        return;
      }
      client.data.userId = user.id;
      await client.join(`${NOTIFICATION_ROOM}:${user.id}`);
      this.logger.debug(`Notification socket connected for user ${user.id}`);
    } catch {
      client.disconnect(true);
    }
  }

  /** Delivers a notification to the owning user's sockets only. */
  notifyUser(userId: string, notification: RealtimeNotification) {
    this.server
      ?.to(`${NOTIFICATION_ROOM}:${userId}`)
      .emit('notification:new', notification);
  }

  private extractToken(client: Socket): string | null {
    const fromAuth = (client.handshake.auth as { token?: unknown } | undefined)
      ?.token;
    if (typeof fromAuth === 'string' && fromAuth) return fromAuth;
    const fromQuery = client.handshake.query?.token;
    if (typeof fromQuery === 'string' && fromQuery) return fromQuery;
    const header = client.handshake.headers?.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer '))
      return header.slice('Bearer '.length);
    return null;
  }
}

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

export interface SyncEvent {
  type: 'SYNC_STARTED' | 'SYNC_COMPLETED' | 'SYNC_FAILED';
  data?: {
    rooms?: { created: number; updated: number };
    guests?: { created: number; updated: number };
    reservations?: { created: number; updated: number };
    duration?: number;
    error?: string;
  };
  timestamp: string;
}

export interface NotificationEvent {
  type: 'NEW_NOTIFICATION';
  count: number;
  notification?: {
    id: string;
    title: string;
    message: string;
    module: string;
  };
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // En producción, restringir a tu dominio
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/events',
})
export class WebsocketsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketsGateway.name);
  private connectedClients = 0;

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(`Client connected: ${client.id} (Total: ${this.connectedClients})`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(`Client disconnected: ${client.id} (Total: ${this.connectedClients})`);
  }

  /**
   * Emitir evento de sincronización iniciada
   */
  emitSyncStarted() {
    const event: SyncEvent = {
      type: 'SYNC_STARTED',
      timestamp: new Date().toISOString(),
    };
    this.server.emit('sync', event);
    this.logger.log('Emitted SYNC_STARTED event');
  }

  /**
   * Emitir evento de sincronización completada
   */
  emitSyncCompleted(data: {
    rooms: { created: number; updated: number };
    guests: { created: number; updated: number };
    reservations: { created: number; updated: number };
    duration: number;
  }) {
    const event: SyncEvent = {
      type: 'SYNC_COMPLETED',
      data,
      timestamp: new Date().toISOString(),
    };
    this.server.emit('sync', event);
    this.logger.log(`Emitted SYNC_COMPLETED event: ${JSON.stringify(data)}`);
  }

  /**
   * Emitir evento de sincronización fallida
   */
  emitSyncFailed(error: string) {
    const event: SyncEvent = {
      type: 'SYNC_FAILED',
      data: { error },
      timestamp: new Date().toISOString(),
    };
    this.server.emit('sync', event);
    this.logger.log(`Emitted SYNC_FAILED event: ${error}`);
  }

  /**
   * Emitir evento de nueva notificación
   */
  emitNewNotification(notification: {
    id: string;
    title: string;
    message: string;
    module: string;
  }, unreadCount: number) {
    const event: NotificationEvent = {
      type: 'NEW_NOTIFICATION',
      count: unreadCount,
      notification,
      timestamp: new Date().toISOString(),
    };
    this.server.emit('notification', event);
    this.logger.log(`Emitted NEW_NOTIFICATION event: ${notification.title}`);
  }

  /**
   * Emitir actualización del contador de notificaciones
   */
  emitNotificationCountUpdate(count: number) {
    this.server.emit('notification-count', { count });
  }

  /**
   * Obtener número de clientes conectados
   */
  getConnectedClientsCount(): number {
    return this.connectedClients;
  }
}

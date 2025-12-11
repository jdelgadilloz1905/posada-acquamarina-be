import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SyncLog, SyncType, SyncStatus } from './entities/sync-log.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CloudbedsService } from '../cloudbeds/cloudbeds.service';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
import {
  NotificationType,
  NotificationModule,
} from '../notifications/entities/notification.entity';

export interface SyncResult {
  processed: number;
  created: number;
  updated: number;
  errors: string[];
  createdItems: { id: string; name: string }[];
  updatedItems: { id: string; name: string; changes?: string }[];
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private isRunning = false;

  constructor(
    @InjectRepository(SyncLog)
    private syncLogRepository: Repository<SyncLog>,
    private notificationsService: NotificationsService,
    private cloudbedsService: CloudbedsService,
    private configService: ConfigService,
    private websocketsGateway: WebsocketsGateway,
  ) {}

  /**
   * Obtener la fecha de la última sincronización exitosa
   * Retorna en formato Cloudbeds: YYYY-MM-DD HH:mm:ss (en zona horaria de Venezuela UTC-4)
   * Si no hay sync previo, retorna la fecha de hoy a las 00:00:00 para evitar full sync
   */
  async getLastSuccessfulSyncDate(): Promise<string> {
    const lastSuccessfulSync = await this.syncLogRepository.findOne({
      where: { status: SyncStatus.SUCCESS },
      order: { completedAt: 'DESC' },
    });

    this.logger.log(`Last successful sync found: ${JSON.stringify(lastSuccessfulSync ? { id: lastSuccessfulSync.id, status: lastSuccessfulSync.status, startedAt: lastSuccessfulSync.startedAt } : null)}`);

    // IMPORTANTE: El servidor está en EST (UTC-5) pero Cloudbeds usa Venezuela (UTC-4)
    // Necesitamos convertir la hora actual a Venezuela timezone para el filtro

    // Obtener hora actual en UTC
    const nowUtc = Date.now();

    // Venezuela es UTC-4, así que sumamos -4 horas al UTC
    // Pero queremos 15 minutos atrás, así que restamos 15 min también
    const venezuelaOffsetMs = -4 * 60 * 60 * 1000; // UTC-4 en milisegundos
    const fifteenMinutesMs = 15 * 60 * 1000;

    // Calcular: hora UTC - 15 minutos, luego convertir a "hora de reloj" de Venezuela
    const targetUtcMs = nowUtc - fifteenMinutesMs;
    const venezuelaDate = new Date(targetUtcMs + venezuelaOffsetMs);

    // El objeto Date ahora tiene la hora de Venezuela en sus componentes UTC
    // Usamos getUTC* para obtener los valores correctos
    const year = venezuelaDate.getUTCFullYear();
    const month = String(venezuelaDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(venezuelaDate.getUTCDate()).padStart(2, '0');
    const hours = String(venezuelaDate.getUTCHours()).padStart(2, '0');
    const minutes = String(venezuelaDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(venezuelaDate.getUTCSeconds()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    // Log para debug con más información
    const serverNow = new Date();
    this.logger.log(`Server time (EST): ${serverNow.toISOString()}, Venezuela time filter (15 min ago): ${formattedDate}`);
    return formattedDate;
  }

  /**
   * Debug: obtener información sobre la última sincronización
   */
  async getDebugSyncInfo(): Promise<{
    lastSuccessfulSyncDate: string;
    lastSyncLog: SyncLog | null;
    allRecentLogs: Array<{ id: string; status: SyncStatus; startedAt: Date; completedAt: Date }>;
  }> {
    const lastSuccessfulSyncDate = await this.getLastSuccessfulSyncDate();

    const lastSyncLog = await this.syncLogRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    const recentLogs = await this.syncLogRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
      select: ['id', 'status', 'startedAt', 'completedAt'],
    });

    return {
      lastSuccessfulSyncDate,
      lastSyncLog,
      allRecentLogs: recentLogs,
    };
  }

  // Cron job: ejecutar cada 5 minutos
  @Cron('*/5 * * * *')
  async handleCron() {
    const cronEnabled = this.configService.get('SYNC_CRON_ENABLED', 'true');
    if (cronEnabled !== 'true') {
      this.logger.log('Sync cron is disabled');
      return;
    }

    this.logger.log('Starting scheduled sync...');
    await this.syncAll();
  }

  async syncAll(): Promise<{
    syncLog: SyncLog;
    rooms: SyncResult;
    guests: SyncResult;
    reservations: SyncResult;
  }> {
    if (this.isRunning) {
      this.logger.warn('Sync already in progress, skipping...');
      throw new Error('Sync already in progress');
    }

    this.isRunning = true;
    const startTime = Date.now();

    // Obtener fecha de última sincronización exitosa para filtrar (siempre incremental)
    const lastSyncDate = await this.getLastSuccessfulSyncDate();
    this.logger.log(`Incremental sync: fetching records modified since ${lastSyncDate}`);

    // Emitir evento de sincronización iniciada
    this.websocketsGateway.emitSyncStarted();

    // Crear log de sincronización
    const syncLogEntity = this.syncLogRepository.create({
      type: SyncType.ALL,
      status: SyncStatus.IN_PROGRESS,
      startedAt: new Date(),
    });
    const syncLog = await this.syncLogRepository.save(syncLogEntity);

    let roomsResult: SyncResult = { processed: 0, created: 0, updated: 0, errors: [], createdItems: [], updatedItems: [] };
    let guestsResult: SyncResult = { processed: 0, created: 0, updated: 0, errors: [], createdItems: [], updatedItems: [] };
    let reservationsResult: SyncResult = { processed: 0, created: 0, updated: 0, errors: [], createdItems: [], updatedItems: [] };

    try {
      // Sincronizar habitaciones (las habitaciones no tienen dateModified en Cloudbeds, siempre full sync)
      this.logger.log('Syncing rooms...');
      roomsResult = await this.syncRooms();

      // Sincronizar clientes/huéspedes (usar lastSyncDate para sync incremental)
      this.logger.log('Syncing guests...');
      guestsResult = await this.syncGuests(lastSyncDate);

      // Sincronizar reservaciones (usar lastSyncDate para sync incremental)
      this.logger.log('Syncing reservations...');
      reservationsResult = await this.syncReservations(lastSyncDate);

      // Calcular totales
      const totalProcessed = roomsResult.processed + guestsResult.processed + reservationsResult.processed;
      const totalCreated = roomsResult.created + guestsResult.created + reservationsResult.created;
      const totalUpdated = roomsResult.updated + guestsResult.updated + reservationsResult.updated;
      const allErrors = [...roomsResult.errors, ...guestsResult.errors, ...reservationsResult.errors];

      // Actualizar log
      syncLog.status = allErrors.length > 0 ? SyncStatus.PARTIAL : SyncStatus.SUCCESS;
      syncLog.completedAt = new Date();
      syncLog.recordsProcessed = totalProcessed;
      syncLog.recordsCreated = totalCreated;
      syncLog.recordsUpdated = totalUpdated;
      syncLog.errors = allErrors.length > 0 ? allErrors.join('\n') : null;
      await this.syncLogRepository.save(syncLog);

      // Crear notificaciones para cambios
      await this.createNotificationsForChanges(roomsResult, guestsResult, reservationsResult);

      // Notificación de sincronización completada (solo si hubo cambios reales)
      if (totalCreated > 0 || totalUpdated > 0) {
        const totalChanges = totalCreated + totalUpdated;
        const parts: string[] = [];
        if (totalCreated > 0) parts.push(`${totalCreated} nuevo${totalCreated > 1 ? 's' : ''}`);
        if (totalUpdated > 0) parts.push(`${totalUpdated} actualizado${totalUpdated > 1 ? 's' : ''}`);

        await this.notificationsService.createForAllAdmins({
          type: NotificationType.SYNC_COMPLETED,
          module: NotificationModule.SYNC,
          title: 'Sincronización completada',
          message: `${totalChanges} registro${totalChanges > 1 ? 's' : ''} sincronizado${totalChanges > 1 ? 's' : ''}: ${parts.join(', ')}`,
        });
      }

      const duration = Date.now() - startTime;
      this.logger.log(`Sync completed in ${duration}ms`);

      // Emitir evento de sincronización completada vía WebSocket
      this.websocketsGateway.emitSyncCompleted({
        rooms: { created: roomsResult.created, updated: roomsResult.updated },
        guests: { created: guestsResult.created, updated: guestsResult.updated },
        reservations: { created: reservationsResult.created, updated: reservationsResult.updated },
        duration,
      });

      return { syncLog, rooms: roomsResult, guests: guestsResult, reservations: reservationsResult };
    } catch (error) {
      this.logger.error('Sync failed', error.stack);

      syncLog.status = SyncStatus.FAILED;
      syncLog.completedAt = new Date();
      syncLog.errors = error.message;
      await this.syncLogRepository.save(syncLog);

      // Notificación de error
      await this.notificationsService.createForAllAdmins({
        type: NotificationType.SYNC_FAILED,
        module: NotificationModule.SYNC,
        title: 'Error en sincronización',
        message: `La sincronización falló: ${error.message}`,
      });

      // Emitir evento de error vía WebSocket
      this.websocketsGateway.emitSyncFailed(error.message);

      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async syncRooms(): Promise<SyncResult> {
    const result: SyncResult = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: [],
      createdItems: [],
      updatedItems: [],
    };

    try {
      const syncResult = await this.cloudbedsService.syncRoomsFromCloudbeds();

      // El servicio de Cloudbeds retorna un resumen
      if (syncResult && typeof syncResult === 'object') {
        result.processed = syncResult.processed || 0;
        result.created = syncResult.created || 0;
        result.updated = syncResult.updated || 0;

        if (syncResult.createdItems) {
          result.createdItems = syncResult.createdItems;
        }
        if (syncResult.updatedItems) {
          result.updatedItems = syncResult.updatedItems;
        }
      }
    } catch (error) {
      result.errors.push(`Rooms sync error: ${error.message}`);
      this.logger.error('Rooms sync error', error.stack);
    }

    return result;
  }

  private async syncGuests(modifiedFrom?: string): Promise<SyncResult> {
    const result: SyncResult = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: [],
      createdItems: [],
      updatedItems: [],
    };

    try {
      // Pasar la fecha de última sincronización para hacer sync incremental
      const syncResult = await this.cloudbedsService.syncGuestsFromCloudbeds(modifiedFrom);

      if (syncResult && typeof syncResult === 'object') {
        result.processed = syncResult.processed || 0;
        result.created = syncResult.created || 0;
        result.updated = syncResult.updated || 0;

        if (syncResult.createdItems) {
          result.createdItems = syncResult.createdItems;
        }
        if (syncResult.updatedItems) {
          result.updatedItems = syncResult.updatedItems;
        }
      }
    } catch (error) {
      result.errors.push(`Guests sync error: ${error.message}`);
      this.logger.error('Guests sync error', error.stack);
    }

    return result;
  }

  private async syncReservations(modifiedFrom?: string): Promise<SyncResult> {
    const result: SyncResult = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: [],
      createdItems: [],
      updatedItems: [],
    };

    try {
      // Pasar la fecha de última sincronización para hacer sync incremental
      const syncResult = await this.cloudbedsService.syncReservationsFromCloudbeds(modifiedFrom);

      if (syncResult && typeof syncResult === 'object') {
        result.processed = syncResult.processed || 0;
        result.created = syncResult.created || 0;
        result.updated = syncResult.updated || 0;

        if (syncResult.createdItems) {
          result.createdItems = syncResult.createdItems;
        }
        if (syncResult.updatedItems) {
          result.updatedItems = syncResult.updatedItems;
        }
      }
    } catch (error) {
      result.errors.push(`Reservations sync error: ${error.message}`);
      this.logger.error('Reservations sync error', error.stack);
    }

    return result;
  }

  private async createNotificationsForChanges(
    rooms: SyncResult,
    guests: SyncResult,
    reservations: SyncResult,
  ): Promise<void> {
    // Notificaciones para habitaciones nuevas
    for (const item of rooms.createdItems) {
      await this.notificationsService.createForAllAdmins({
        type: NotificationType.NEW_ROOM,
        module: NotificationModule.ROOMS,
        title: 'Nueva habitación sincronizada',
        message: `Se sincronizó la habitación: ${item.name}`,
        entityType: 'Room',
        entityId: item.id,
      });
    }

    // Notificaciones para habitaciones actualizadas
    for (const item of rooms.updatedItems) {
      await this.notificationsService.createForAllAdmins({
        type: NotificationType.UPDATED_ROOM,
        module: NotificationModule.ROOMS,
        title: 'Habitación actualizada',
        message: `Se actualizó la habitación: ${item.name}${item.changes ? ` (${item.changes})` : ''}`,
        entityType: 'Room',
        entityId: item.id,
      });
    }

    // Notificaciones para clientes nuevos
    for (const item of guests.createdItems) {
      await this.notificationsService.createForAllAdmins({
        type: NotificationType.NEW_CLIENT,
        module: NotificationModule.CLIENTS,
        title: 'Nuevo cliente sincronizado',
        message: `Se sincronizó el cliente: ${item.name}`,
        entityType: 'Client',
        entityId: item.id,
      });
    }

    // Notificaciones para clientes actualizados
    for (const item of guests.updatedItems) {
      await this.notificationsService.createForAllAdmins({
        type: NotificationType.UPDATED_CLIENT,
        module: NotificationModule.CLIENTS,
        title: 'Cliente actualizado',
        message: `Se actualizó el cliente: ${item.name}${item.changes ? ` (${item.changes})` : ''}`,
        entityType: 'Client',
        entityId: item.id,
      });
    }

    // Notificaciones para reservaciones nuevas
    for (const item of reservations.createdItems) {
      await this.notificationsService.createForAllAdmins({
        type: NotificationType.NEW_RESERVATION,
        module: NotificationModule.RESERVATIONS,
        title: 'Nueva reservación sincronizada',
        message: `Se sincronizó una nueva reservación: ${item.name}`,
        entityType: 'Reservation',
        entityId: item.id,
      });
    }

    // Notificaciones para reservaciones actualizadas
    for (const item of reservations.updatedItems) {
      await this.notificationsService.createForAllAdmins({
        type: NotificationType.UPDATED_RESERVATION,
        module: NotificationModule.RESERVATIONS,
        title: 'Reservación actualizada',
        message: `Se actualizó la reservación: ${item.name}${item.changes ? ` (${item.changes})` : ''}`,
        entityType: 'Reservation',
        entityId: item.id,
      });
    }
  }

  async getLogs(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: SyncLog[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.syncLogRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async getLogById(id: string): Promise<SyncLog | null> {
    return this.syncLogRepository.findOne({ where: { id } });
  }

  async getStatus(): Promise<{
    lastSync: SyncLog | null;
    isRunning: boolean;
    nextScheduledSync: string;
  }> {
    const lastSync = await this.syncLogRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    // Calcular próxima ejecución (cada 5 minutos: 0, 5, 10, 15, etc.)
    const now = new Date();
    const nextSync = new Date(now);
    const currentMinutes = now.getMinutes();
    const nextFiveMinuteMark = Math.ceil((currentMinutes + 1) / 5) * 5;

    if (nextFiveMinuteMark >= 60) {
      nextSync.setHours(nextSync.getHours() + 1);
      nextSync.setMinutes(0);
    } else {
      nextSync.setMinutes(nextFiveMinuteMark);
    }
    nextSync.setSeconds(0);
    nextSync.setMilliseconds(0);

    return {
      lastSync,
      isRunning: this.isRunning,
      nextScheduledSync: nextSync.toISOString(),
    };
  }
}

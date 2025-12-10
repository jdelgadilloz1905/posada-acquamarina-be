import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationModule, NotificationType } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { CreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
  ) {}

  /**
   * Cron job: Eliminar notificaciones leídas con más de 5 días
   * Se ejecuta todos los días a las 3:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanupCron() {
    this.logger.log('Starting notification cleanup...');
    const deleted = await this.deleteOldNotifications(5); // 5 días
    this.logger.log(`Cleanup completed: ${deleted} old read notifications deleted`);
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(dto);
    return this.notificationRepository.save(notification);
  }

  async createIfEnabled(
    dto: CreateNotificationDto,
    userId?: string,
  ): Promise<Notification | null> {
    // Si hay userId, verificar preferencias
    if (userId) {
      const preference = await this.preferenceRepository.findOne({
        where: { userId, module: dto.module },
      });

      // Si existe preferencia y está deshabilitada, no crear
      if (preference && !preference.enabled) {
        return null;
      }
    }

    const notification = this.notificationRepository.create({
      ...dto,
      userId,
    });
    return this.notificationRepository.save(notification);
  }

  async createForAllAdmins(dto: CreateNotificationDto): Promise<Notification[]> {
    // Crear notificación global (sin userId específico)
    // Esto permite que todos los admins la vean
    const notification = this.notificationRepository.create(dto);
    const saved = await this.notificationRepository.save(notification);
    return [saved];
  }

  /**
   * Obtener solo notificaciones NO leídas (para el dropdown de la campanita)
   */
  async findUnread(
    userId?: string,
    limit: number = 10,
  ): Promise<{ data: Notification[]; total: number }> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.isRead = :isRead', { isRead: false })
      .orderBy('notification.createdAt', 'DESC')
      .take(limit);

    // Mostrar notificaciones globales (userId = null) o del usuario específico
    if (userId) {
      queryBuilder.andWhere(
        '(notification.userId = :userId OR notification.userId IS NULL)',
        { userId },
      );
    } else {
      queryBuilder.andWhere('notification.userId IS NULL');
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  /**
   * Obtener todas las notificaciones con filtro opcional por estado de lectura
   * (para la página completa de notificaciones)
   */
  async findAll(
    userId?: string,
    page: number = 1,
    limit: number = 20,
    filter?: 'all' | 'unread' | 'read',
  ): Promise<{ data: Notification[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Mostrar notificaciones globales (userId = null) o del usuario específico
    if (userId) {
      queryBuilder.where(
        '(notification.userId = :userId OR notification.userId IS NULL)',
        { userId },
      );
    } else {
      queryBuilder.where('notification.userId IS NULL');
    }

    // Aplicar filtro por estado de lectura
    if (filter === 'unread') {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead: false });
    } else if (filter === 'read') {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead: true });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  async getUnreadCount(userId?: string): Promise<number> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.isRead = :isRead', { isRead: false });

    if (userId) {
      queryBuilder.andWhere(
        '(notification.userId = :userId OR notification.userId IS NULL)',
        { userId },
      );
    } else {
      queryBuilder.andWhere('notification.userId IS NULL');
    }

    return queryBuilder.getCount();
  }

  async markAsRead(id: string, userId?: string): Promise<Notification | null> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      return null;
    }

    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId?: string): Promise<void> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date() })
      .where('isRead = :isRead', { isRead: false });

    if (userId) {
      queryBuilder.andWhere(
        '(userId = :userId OR userId IS NULL)',
        { userId },
      );
    } else {
      queryBuilder.andWhere('userId IS NULL');
    }

    await queryBuilder.execute();
  }

  async getPreferences(userId: string): Promise<{ module: NotificationModule; enabled: boolean }[]> {
    const allModules = Object.values(NotificationModule);
    const existingPreferences = await this.preferenceRepository.find({
      where: { userId },
    });

    // Crear mapa de preferencias existentes
    const prefMap = new Map(
      existingPreferences.map((p) => [p.module, p.enabled]),
    );

    // Devolver todas las preferencias (las existentes o true por defecto)
    return allModules.map((module) => ({
      module,
      enabled: prefMap.has(module) ? prefMap.get(module)! : true,
    }));
  }

  async updatePreference(
    userId: string,
    module: NotificationModule,
    enabled: boolean,
  ): Promise<NotificationPreference> {
    let preference = await this.preferenceRepository.findOne({
      where: { userId, module },
    });

    if (preference) {
      preference.enabled = enabled;
    } else {
      preference = this.preferenceRepository.create({
        userId,
        module,
        enabled,
      });
    }

    return this.preferenceRepository.save(preference);
  }

  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('isRead = :isRead', { isRead: true })
      .execute();

    return result.affected || 0;
  }
}

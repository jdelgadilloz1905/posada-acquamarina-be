import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  NEW_RESERVATION = 'NEW_RESERVATION',
  UPDATED_RESERVATION = 'UPDATED_RESERVATION',
  CANCELLED_RESERVATION = 'CANCELLED_RESERVATION',
  NEW_CLIENT = 'NEW_CLIENT',
  UPDATED_CLIENT = 'UPDATED_CLIENT',
  NEW_ROOM = 'NEW_ROOM',
  UPDATED_ROOM = 'UPDATED_ROOM',
  SYNC_COMPLETED = 'SYNC_COMPLETED',
  SYNC_FAILED = 'SYNC_FAILED',
}

export enum NotificationModule {
  RESERVATIONS = 'RESERVATIONS',
  CLIENTS = 'CLIENTS',
  ROOMS = 'ROOMS',
  SYNC = 'SYNC',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationModule,
  })
  module: NotificationModule;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  entityType: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  entityId: string;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum SyncType {
  ROOMS = 'ROOMS',
  GUESTS = 'GUESTS',
  RESERVATIONS = 'RESERVATIONS',
  ALL = 'ALL',
}

export enum SyncStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

@Entity('sync_logs')
export class SyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SyncType,
  })
  type: SyncType;

  @Column({
    type: 'enum',
    enum: SyncStatus,
    default: SyncStatus.IN_PROGRESS,
  })
  status: SyncStatus;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'int', default: 0 })
  recordsProcessed: number;

  @Column({ type: 'int', default: 0 })
  recordsCreated: number;

  @Column({ type: 'int', default: 0 })
  recordsUpdated: number;

  @Column({ type: 'text', nullable: true })
  errors: string;

  @CreateDateColumn()
  createdAt: Date;
}

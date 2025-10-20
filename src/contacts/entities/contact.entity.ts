import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ContactSubject {
  RESERVAS = 'reservas',
  INFORMACION_GENERAL = 'informacion_general',
  SERVICIOS = 'servicios',
  EVENTOS_ESPECIALES = 'eventos_especiales',
  SUGERENCIAS = 'sugerencias',
  OTRO = 'otro',
}

export enum ContactStatus {
  PENDIENTE = 'pendiente',
  EN_PROCESO = 'en_proceso',
  RESUELTO = 'resuelto',
}

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: ContactSubject,
  })
  subject: ContactSubject;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: ContactStatus,
    default: ContactStatus.PENDIENTE,
  })
  status: ContactStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Room } from '../../rooms/entities/room.entity';

export enum ReservationStatus {
  PENDING = 'pending',                    // Confirmación pendiente
  CONFIRMED = 'confirmed',                // Confirmada
  CHECKED_IN = 'checked_in',              // Hospedado
  CHECKED_OUT = 'checked_out',            // Checked Out
  CANCELLED = 'cancelled',                // Cancelada
  NO_SHOW = 'no_show',                    // No show
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('date', {
    transformer: {
      to: (value: Date) => {
        if (!value) return value;
        const date = new Date(value);
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      },
      from: (value: string) => value,
    },
  })
  checkInDate: Date;

  @Column('date', {
    transformer: {
      to: (value: Date) => {
        if (!value) return value;
        const date = new Date(value);
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      },
      from: (value: string) => value,
    },
  })
  checkOutDate: Date;

  @Column()
  numberOfAdults: number;

  @Column({ default: 0 })
  numberOfChildren: number;

  @Column('text', { nullable: true })
  specialRequests: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @ManyToOne(() => Client, (client) => client.reservations)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column()
  clientId: string;

  @ManyToOne(() => Room, (room) => room.reservations)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column()
  roomId: string;

  @Column({ nullable: true, unique: true })
  cloudbedsReservationID: string; // ID de la reservación en Cloudbeds para sincronización

  @Column({ type: 'timestamp', nullable: true })
  cloudbedsDateCreated: Date; // Fecha original de creación en Cloudbeds

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

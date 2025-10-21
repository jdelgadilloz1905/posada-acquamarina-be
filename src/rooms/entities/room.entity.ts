import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity';

export enum RoomType {
  SINGLE = 'single',
  DOUBLE = 'double',
  SUITE = 'suite',
  FAMILY = 'family',
  QUAD = 'quad',
}

export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true })
  roomNumber: string;

  @Column({ nullable: true })
  type: string; // Ej: "Estándar", "Cuádruple", "Familiar"

  @Column({ nullable: true })
  capacity: string; // Ej: "Max 2 Huéspedes"

  @Column({ default: 2 })
  maxGuests: number; // Número máximo de huéspedes

  @Column({ nullable: true })
  bed: string; // Ej: "1 Cama Queen Size", "2 Camas Queen Size"

  @Column('text', { nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @Column('simple-array', { nullable: true })
  amenities: string[];

  @Column('simple-array', { nullable: true })
  images: string[]; // URLs de S3

  @Column({ default: 1 })
  roomCount: number; // Cantidad de habitaciones de este tipo

  @Column({ nullable: true })
  videoUrl: string; // URL del video en S3

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.AVAILABLE,
  })
  status: RoomStatus;

  @OneToMany(() => Reservation, (reservation) => reservation.room)
  reservations: Reservation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

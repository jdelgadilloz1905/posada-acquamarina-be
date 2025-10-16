import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { RoomsService } from '../rooms/rooms.service';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly clientsService: ClientsService,
    private readonly roomsService: RoomsService,
  ) {}

  async create(createReservationDto: CreateReservationDto): Promise<Reservation> {
    const {
      checkInDate,
      checkOutDate,
      roomId,
      guestEmail,
      guestName,
      guestPhone,
      numberOfAdults,
      numberOfChildren,
      specialRequests
    } = createReservationDto;

    // Validar fechas
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }

    if (checkIn < new Date()) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }

    // Verificar que la habitación existe
    const room = await this.roomsService.findOne(roomId);

    // Verificar disponibilidad
    const isAvailable = await this.checkRoomAvailability(
      roomId,
      checkIn,
      checkOut,
    );

    if (!isAvailable) {
      throw new BadRequestException('Room is not available for selected dates');
    }

    // Buscar o crear cliente automáticamente por email
    const client = await this.clientsService.findOrCreate({
      email: guestEmail,
      fullName: guestName,
      phone: guestPhone,
    });

    // Calcular precio total
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalPrice = Number(room.pricePerNight) * nights;

    const reservation = this.reservationRepository.create({
      clientId: client.id,
      roomId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfAdults,
      numberOfChildren,
      specialRequests,
      totalPrice,
      status: ReservationStatus.PENDING,
    });

    return this.reservationRepository.save(reservation);
  }

  async findAll(): Promise<Reservation[]> {
    return this.reservationRepository.find({
      relations: ['client', 'room'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByClient(clientId: string): Promise<Reservation[]> {
    return this.reservationRepository.find({
      where: { clientId },
      relations: ['room'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['client', 'room'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    return reservation;
  }

  async update(
    id: string,
    updateReservationDto: UpdateReservationDto,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id);

    // Si se actualizan las fechas, recalcular el precio
    if (updateReservationDto.checkInDate || updateReservationDto.checkOutDate) {
      const checkIn = updateReservationDto.checkInDate
        ? new Date(updateReservationDto.checkInDate)
        : reservation.checkInDate;
      const checkOut = updateReservationDto.checkOutDate
        ? new Date(updateReservationDto.checkOutDate)
        : reservation.checkOutDate;

      if (checkIn >= checkOut) {
        throw new BadRequestException(
          'Check-out date must be after check-in date',
        );
      }

      const room = await this.roomsService.findOne(reservation.roomId);
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      );
      updateReservationDto['totalPrice'] = Number(room.pricePerNight) * nights;
    }

    Object.assign(reservation, updateReservationDto);
    return this.reservationRepository.save(reservation);
  }

  async remove(id: string): Promise<void> {
    const reservation = await this.findOne(id);
    await this.reservationRepository.remove(reservation);
  }

  async cancelReservation(id: string): Promise<Reservation> {
    const reservation = await this.findOne(id);
    reservation.status = ReservationStatus.CANCELLED;
    return this.reservationRepository.save(reservation);
  }

  async confirmReservation(id: string): Promise<Reservation> {
    const reservation = await this.findOne(id);
    reservation.status = ReservationStatus.CONFIRMED;
    return this.reservationRepository.save(reservation);
  }

  private async checkRoomAvailability(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    excludeReservationId?: string,
  ): Promise<boolean> {
    const query = this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.roomId = :roomId', { roomId })
      .andWhere('reservation.status != :cancelled', {
        cancelled: ReservationStatus.CANCELLED,
      })
      .andWhere(
        '(reservation.checkInDate < :checkOut AND reservation.checkOutDate > :checkIn)',
        { checkIn, checkOut },
      );

    if (excludeReservationId) {
      query.andWhere('reservation.id != :excludeReservationId', {
        excludeReservationId,
      });
    }

    const conflictingReservations = await query.getCount();
    return conflictingReservations === 0;
  }
}

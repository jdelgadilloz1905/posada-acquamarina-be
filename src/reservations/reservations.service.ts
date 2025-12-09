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
import { CreateReservationAdminDto } from './dto/create-reservation-admin.dto';
import { UpdateReservationAdminDto } from './dto/update-reservation-admin.dto';
import { RoomsService } from '../rooms/rooms.service';
import { ClientsService } from '../clients/clients.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../common/interfaces/paginated-response.interface';

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
        'La fecha de salida debe ser posterior a la fecha de entrada',
      );
    }

    if (checkIn < new Date()) {
      throw new BadRequestException('La fecha de entrada no puede ser en el pasado');
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
      throw new BadRequestException('La habitación no está disponible para las fechas seleccionadas');
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
    const totalPrice = Number(room.price) * nights;

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

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Reservation>> {
    const { page = 1, limit = 10, search, status } = paginationDto;
    const skip = (page - 1) * limit;

    // Usar QueryBuilder para búsqueda con JOIN
    const queryBuilder = this.reservationRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.client', 'client')
      .leftJoinAndSelect('reservation.room', 'room');

    // Filtro por búsqueda (cliente, habitación o Cloudbeds ID)
    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(client.fullName) LIKE :search OR LOWER(room.roomNumber) LIKE :search OR LOWER(room.name) LIKE :search OR LOWER(reservation.cloudbedsReservationID) LIKE :search)',
        { search: searchTerm },
      );
    }

    // Filtro por estado
    if (status && status.trim()) {
      queryBuilder.andWhere('reservation.status = :status', { status });
    }

    // Ordenamiento
    queryBuilder
      .orderBy('reservation.cloudbedsDateCreated', 'DESC', 'NULLS LAST')
      .addOrderBy('reservation.createdAt', 'DESC');

    // Paginación
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return createPaginatedResponse(data, total, page, limit);
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
      throw new NotFoundException(`Reservación con ID ${id} no encontrada`);
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
          'La fecha de salida debe ser posterior a la fecha de entrada',
        );
      }

      const room = await this.roomsService.findOne(reservation.roomId);
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      );
      updateReservationDto['totalPrice'] = Number(room.price) * nights;
    }

    Object.assign(reservation, updateReservationDto);
    return this.reservationRepository.save(reservation);
  }

  async remove(id: string): Promise<{ message: string }> {
    const reservation = await this.findOne(id);

    // Advertir si se está eliminando una reservación confirmada
    if (reservation.status === ReservationStatus.CONFIRMED) {
      throw new BadRequestException(
        `No se puede eliminar la reservación porque está en estado "Confirmada". Por favor, cancele la reservación antes de eliminarla.`
      );
    }

    await this.reservationRepository.remove(reservation);
    return { message: 'Reservación eliminada exitosamente' };
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

  async createByAdmin(createReservationAdminDto: CreateReservationAdminDto): Promise<Reservation> {
    const {
      clientId,
      roomId,
      checkInDate,
      checkOutDate,
      numberOfAdults,
      numberOfChildren,
      specialRequests,
    } = createReservationAdminDto;

    // Validar fechas
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }

    // Verificar que el cliente existe
    await this.clientsService.findOne(clientId);

    // Verificar que la habitación existe
    const room = await this.roomsService.findOne(roomId);

    // Verificar disponibilidad
    const isAvailable = await this.checkRoomAvailability(
      roomId,
      checkIn,
      checkOut,
    );

    if (!isAvailable) {
      throw new BadRequestException('La habitación no está disponible para las fechas seleccionadas');
    }

    // Calcular precio total
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalPrice = Number(room.price) * nights;

    const reservation = this.reservationRepository.create({
      clientId,
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

  async updateByAdmin(
    id: string,
    updateReservationAdminDto: UpdateReservationAdminDto,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id);

    // Validar cliente si se está actualizando
    if (updateReservationAdminDto.clientId) {
      await this.clientsService.findOne(updateReservationAdminDto.clientId);
    }

    // Validar habitación si se está actualizando
    if (updateReservationAdminDto.roomId) {
      await this.roomsService.findOne(updateReservationAdminDto.roomId);
    }

    // Validar y recalcular precio si se actualizan fechas o habitación
    if (
      updateReservationAdminDto.checkInDate ||
      updateReservationAdminDto.checkOutDate ||
      updateReservationAdminDto.roomId
    ) {
      const checkIn = updateReservationAdminDto.checkInDate
        ? new Date(updateReservationAdminDto.checkInDate)
        : reservation.checkInDate;
      const checkOut = updateReservationAdminDto.checkOutDate
        ? new Date(updateReservationAdminDto.checkOutDate)
        : reservation.checkOutDate;

      if (checkIn >= checkOut) {
        throw new BadRequestException(
          'La fecha de salida debe ser posterior a la fecha de entrada',
        );
      }

      const roomId = updateReservationAdminDto.roomId || reservation.roomId;
      const room = await this.roomsService.findOne(roomId);

      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      );
      updateReservationAdminDto['totalPrice'] = Number(room.price) * nights;
    }

    Object.assign(reservation, updateReservationAdminDto);
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

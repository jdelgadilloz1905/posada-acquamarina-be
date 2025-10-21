import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Room, RoomStatus } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../common/interfaces/paginated-response.interface';
import { S3Service } from '../common/services/s3.service';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly s3Service: S3Service,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    try {
      this.logger.log(`Creating new room: ${createRoomDto.name}`);

      // Crear la habitación con las URLs que vienen del frontend
      const room = this.roomRepository.create({
        ...createRoomDto,
        roomCount: createRoomDto.roomCount ?? 1,
      });

      const savedRoom = await this.roomRepository.save(room);
      this.logger.log(`Room created successfully with ID: ${savedRoom.id}`);
      return savedRoom;
    } catch (error) {
      this.logger.error(`Error creating room: ${error.message}`);
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<Room>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.roomRepository.findAndCount({
      order: { roomNumber: 'ASC' },
      skip,
      take: limit,
    });

    return createPaginatedResponse(data, total, page, limit);
  }

  async findAvailable(checkIn: Date, checkOut: Date): Promise<Room[]> {
    // Esta es una consulta simplificada. En producción, deberías verificar
    // contra las reservas existentes para ese rango de fechas
    return this.roomRepository.find({
      where: { status: RoomStatus.AVAILABLE },
    });
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['reservations'],
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    try {
      const room = await this.findOne(id);
      this.logger.log(`Updating room ${id}: ${room.name}`);

      // Actualizar la habitación con los nuevos datos (incluidas las nuevas URLs si vienen)
      Object.assign(room, updateRoomDto);
      const updatedRoom = await this.roomRepository.save(room);

      this.logger.log(`Room ${id} updated successfully`);
      return updatedRoom;
    } catch (error) {
      this.logger.error(`Error updating room ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const room = await this.findOne(id);
      this.logger.log(`Deleting room ${id}: ${room.name}`);

      // El frontend es responsable de eliminar las imágenes y videos de S3
      // Solo eliminamos el registro de la base de datos
      await this.roomRepository.remove(room);
      this.logger.log(`Room ${id} deleted successfully from database`);
    } catch (error) {
      this.logger.error(`Error deleting room ${id}: ${error.message}`);
      throw error;
    }
  }

  async findByRoomNumber(roomNumber: string): Promise<Room | null> {
    return this.roomRepository.findOne({ where: { roomNumber } });
  }

  async findAllForSelect(): Promise<Array<{ id: string; roomNumber: string; name: string; price: number }>> {
    const rooms = await this.roomRepository.find({
      select: ['id', 'roomNumber', 'name', 'price'],
      where: { status: RoomStatus.AVAILABLE },
      order: { roomNumber: 'ASC' },
    });

    return rooms;
  }
}

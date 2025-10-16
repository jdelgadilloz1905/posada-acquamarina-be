import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const room = this.roomRepository.create(createRoomDto);
    return this.roomRepository.save(room);
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
    const room = await this.findOne(id);
    Object.assign(room, updateRoomDto);
    return this.roomRepository.save(room);
  }

  async remove(id: string): Promise<void> {
    const room = await this.findOne(id);
    await this.roomRepository.remove(room);
  }

  async findByRoomNumber(roomNumber: string): Promise<Room | null> {
    return this.roomRepository.findOne({ where: { roomNumber } });
  }

  async findAllForSelect(): Promise<Array<{ id: string; roomNumber: string; name: string; pricePerNight: number }>> {
    const rooms = await this.roomRepository.find({
      select: ['id', 'roomNumber', 'name', 'pricePerNight'],
      where: { status: RoomStatus.AVAILABLE },
      order: { roomNumber: 'ASC' },
    });

    return rooms;
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../common/interfaces/paginated-response.interface';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async findOrCreate(createClientDto: CreateClientDto): Promise<Client> {
    // Buscar cliente por email
    let client = await this.clientRepository.findOne({
      where: { email: createClientDto.email },
    });

    if (!client) {
      // Si no existe, crear nuevo cliente
      client = this.clientRepository.create(createClientDto);
      client = await this.clientRepository.save(client);
    } else {
      // Si existe, actualizar nombre y teléfono por si cambiaron
      client.fullName = createClientDto.fullName;
      client.phone = createClientDto.phone;
      await this.clientRepository.save(client);
    }

    return client;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<Client>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.clientRepository.findAndCount({
      relations: ['reservations'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return createPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string): Promise<Client> {
    return this.clientRepository.findOne({
      where: { id },
      relations: ['reservations'],
    });
  }

  async findByEmail(email: string): Promise<Client> {
    return this.clientRepository.findOne({ where: { email } });
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    await this.clientRepository.update(id, updateClientDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const client = await this.findOne(id);

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    // Verificar si el cliente tiene reservaciones
    if (client.reservations && client.reservations.length > 0) {
      const activeReservations = client.reservations.filter(
        (reservation) => reservation.status !== 'cancelled'
      );

      if (activeReservations.length > 0) {
        throw new BadRequestException(
          `No se puede eliminar el cliente "${client.fullName}" porque tiene ${activeReservations.length} reservación(es) activa(s). Por favor, cancele o complete las reservaciones antes de eliminar el cliente.`
        );
      }
    }

    await this.clientRepository.delete(id);
    return { message: 'Cliente eliminado exitosamente' };
  }

  async findAllForSelect(): Promise<Array<{ id: string; fullName: string; email: string }>> {
    const clients = await this.clientRepository.find({
      select: ['id', 'fullName', 'email'],
      order: { fullName: 'ASC' },
    });

    return clients;
  }
}

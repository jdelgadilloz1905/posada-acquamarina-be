import { Injectable } from '@nestjs/common';
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

  async remove(id: string): Promise<void> {
    await this.clientRepository.delete(id);
  }
}

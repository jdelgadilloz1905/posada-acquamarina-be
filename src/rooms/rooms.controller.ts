import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear nueva habitación (Admin)' })
  @ApiResponse({ status: 201, description: 'Habitación creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las habitaciones con paginación' })
  @ApiResponse({ status: 200, description: 'Lista paginada de habitaciones' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.roomsService.findAll(paginationDto);
  }

  @Get('available')
  @ApiOperation({ summary: 'Buscar habitaciones disponibles' })
  @ApiQuery({ name: 'checkIn', required: true, example: '2025-02-15', description: 'Fecha de entrada (YYYY-MM-DD)' })
  @ApiQuery({ name: 'checkOut', required: true, example: '2025-02-20', description: 'Fecha de salida (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Habitaciones disponibles' })
  findAvailable(
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
  ) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    return this.roomsService.findAvailable(checkInDate, checkOutDate);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar habitaciones disponibles (para selectores)' })
  @ApiResponse({ status: 200, description: 'Lista simple de habitaciones con id, número, nombre y precio' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAllForSelect() {
    return this.roomsService.findAllForSelect();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener habitación por ID' })
  @ApiResponse({ status: 200, description: 'Habitación encontrada' })
  @ApiResponse({ status: 404, description: 'Habitación no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar habitación (Admin)' })
  @ApiResponse({ status: 200, description: 'Habitación actualizada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Habitación no encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar habitación (Admin)' })
  @ApiResponse({ status: 200, description: 'Habitación eliminada' })
  @ApiResponse({ status: 404, description: 'Habitación no encontrada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.remove(id);
  }
}

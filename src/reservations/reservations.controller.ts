import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { CreateReservationAdminDto } from './dto/create-reservation-admin.dto';
import { UpdateReservationAdminDto } from './dto/update-reservation-admin.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva reserva (Cliente)' })
  @ApiResponse({ status: 201, description: 'Reserva creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o habitación no disponible' })
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(createReservationDto);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear nueva reserva (Administrador)' })
  @ApiResponse({ status: 201, description: 'Reserva creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o habitación no disponible' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  createByAdmin(@Body() createReservationAdminDto: CreateReservationAdminDto) {
    return this.reservationsService.createByAdmin(createReservationAdminDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todas las reservas con paginación (solo admin)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de reservas' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.reservationsService.findAll(paginationDto);
  }

  @Get('client/:clientId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener reservas de un cliente' })
  @ApiResponse({ status: 200, description: 'Lista de reservas del cliente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findByClient(@Param('clientId', ParseUUIDPipe) clientId: string) {
    return this.reservationsService.findByClient(clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener reserva por ID' })
  @ApiResponse({ status: 200, description: 'Reserva encontrada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar reserva' })
  @ApiResponse({ status: 200, description: 'Reserva actualizada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(id, updateReservationDto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar reserva (Administrador)' })
  @ApiResponse({ status: 200, description: 'Reserva actualizada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  updateByAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReservationAdminDto: UpdateReservationAdminDto,
  ) {
    return this.reservationsService.updateByAdmin(id, updateReservationAdminDto);
  }

  @Patch(':id/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Confirmar reserva' })
  @ApiResponse({ status: 200, description: 'Reserva confirmada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationsService.confirmReservation(id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancelar reserva' })
  @ApiResponse({ status: 200, description: 'Reserva cancelada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationsService.cancelReservation(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar reserva' })
  @ApiResponse({ status: 200, description: 'Reserva eliminada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationsService.remove(id);
  }
}

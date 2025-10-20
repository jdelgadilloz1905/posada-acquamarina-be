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
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ContactStatus } from './entities/contact.entity';

@ApiTags('Contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo mensaje de contacto (público)' })
  @ApiResponse({ status: 201, description: 'Mensaje de contacto creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(createContactDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar todos los mensajes de contacto con paginación (Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de mensajes de contacto',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.contactsService.findAll(paginationDto);
  }

  @Get('status/:status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar mensajes de contacto por estado (Admin)' })
  @ApiQuery({
    name: 'status',
    enum: ContactStatus,
    example: ContactStatus.PENDIENTE,
    description: 'Estado del mensaje de contacto',
  })
  @ApiResponse({ status: 200, description: 'Mensajes encontrados' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findByStatus(
    @Param('status', new ParseEnumPipe(ContactStatus)) status: ContactStatus,
  ) {
    return this.contactsService.findByStatus(status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener mensaje de contacto por ID (Admin)' })
  @ApiResponse({ status: 200, description: 'Mensaje de contacto encontrado' })
  @ApiResponse({ status: 404, description: 'Mensaje de contacto no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar mensaje de contacto (Admin)' })
  @ApiResponse({ status: 200, description: 'Mensaje de contacto actualizado' })
  @ApiResponse({ status: 404, description: 'Mensaje de contacto no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return this.contactsService.update(id, updateContactDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar estado de mensaje de contacto (Admin)' })
  @ApiQuery({
    name: 'status',
    enum: ContactStatus,
    example: ContactStatus.EN_PROCESO,
    description: 'Nuevo estado del mensaje',
  })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 404, description: 'Mensaje de contacto no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status', new ParseEnumPipe(ContactStatus)) status: ContactStatus,
  ) {
    return this.contactsService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar mensaje de contacto (Admin)' })
  @ApiResponse({ status: 200, description: 'Mensaje de contacto eliminado' })
  @ApiResponse({ status: 404, description: 'Mensaje de contacto no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactsService.remove(id);
  }
}

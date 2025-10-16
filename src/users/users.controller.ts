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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Email ya existe' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los usuarios con paginación' })
  @ApiResponse({ status: 200, description: 'Lista paginada de usuarios' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}

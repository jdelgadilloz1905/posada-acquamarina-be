import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomType, RoomStatus } from '../entities/room.entity';

export class CreateRoomDto {
  @ApiPropertyOptional({
    description: 'Nombre de la habitación',
    example: 'Saky Saky',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Número de habitación',
    example: '201',
  })
  @IsString()
  roomNumber: string;

  @ApiProperty({
    description: 'Tipo de habitación',
    enum: RoomType,
    example: 'double',
  })
  @IsEnum(RoomType)
  type: RoomType;

  @ApiProperty({
    description: 'Precio por noche',
    example: 120,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  pricePerNight: number;

  @ApiProperty({
    description: 'Capacidad de adultos',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({
    description: 'Máximo de niños permitidos',
    example: 1,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  maxChildren: number;

  @ApiPropertyOptional({
    description: 'Descripción de la habitación',
    example: 'Habitación doble con vista al mar, incluye balcón privado',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Amenidades de la habitación',
    example: ['WiFi', 'TV', 'Aire acondicionado', 'Mini bar', 'Balcón'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'Estado de la habitación',
    enum: RoomStatus,
    example: 'available',
    default: 'available',
  })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @ApiPropertyOptional({
    description: 'URLs de imágenes de la habitación',
    example: ['https://example.com/room1.jpg', 'https://example.com/room2.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({
    description: 'ID del video de YouTube de la habitación',
    example: 'drLVfiBl1sg',
  })
  @IsOptional()
  @IsString()
  videoId?: string;
}

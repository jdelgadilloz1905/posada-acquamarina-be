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
import { RoomStatus } from '../entities/room.entity';

export class CreateRoomDto {
  @ApiProperty({
    description: 'Nombre de la habitación',
    example: 'Saky Saky',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Número de habitación único',
    example: '201',
  })
  @IsString()
  roomNumber: string;

  @ApiProperty({
    description: 'Tipo de habitación',
    example: 'Estándar',
  })
  @IsString()
  type: string;

  @ApiPropertyOptional({
    description: 'Descripción de capacidad',
    example: 'Max 2 Huéspedes',
  })
  @IsOptional()
  @IsString()
  capacity?: string;

  @ApiProperty({
    description: 'Número máximo de huéspedes',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  maxGuests: number;

  @ApiPropertyOptional({
    description: 'Descripción de las camas',
    example: '1 Cama Queen Size',
  })
  @IsOptional()
  @IsString()
  bed?: string;

  @ApiProperty({
    description: 'Descripción de la habitación',
    example: 'Nuestra habitación estándar. Espaciosas habitaciones equipadas con una cama Queen size ideales para parejas que buscan confort y descanso.',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Precio actual de la habitación',
    example: 520,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Precio original (antes de descuento)',
    example: 632,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiProperty({
    description: 'Amenidades de la habitación',
    example: [
      'Aire acondicionado',
      'Smart TV',
      'Caja fuerte',
      'Kit de baño (Shampoo, body wash, algodones)',
    ],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  amenities: string[];

  @ApiProperty({
    description: 'URLs de las imágenes de la habitación (ya subidas a S3)',
    example: [
      'https://d31a2qy0rggbw3.cloudfront.net/rooms/room-1761082429641.png',
      'https://d31a2qy0rggbw3.cloudfront.net/rooms/room-1761082429642.png',
    ],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiPropertyOptional({
    description: 'Cantidad de habitaciones de este tipo disponibles',
    example: 11,
    minimum: 0,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  roomCount?: number;

  @ApiPropertyOptional({
    description: 'URL del video de la habitación (S3 o externa)',
    example: 'https://d31a2qy0rggbw3.cloudfront.net/rooms/room-1760668074263.mp4',
  })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Estado de la habitación',
    enum: RoomStatus,
    example: 'available',
    default: 'available',
  })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;
}

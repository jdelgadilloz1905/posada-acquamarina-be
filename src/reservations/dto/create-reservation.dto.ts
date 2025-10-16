import {
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({
    description: 'Fecha de llegada (check-in)',
    example: '2025-02-15',
    type: String,
  })
  @IsDateString()
  checkInDate: string;

  @ApiProperty({
    description: 'Fecha de salida (check-out)',
    example: '2025-02-20',
    type: String,
  })
  @IsDateString()
  checkOutDate: string;

  @ApiProperty({
    description: 'Número de adultos',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  numberOfAdults: number;

  @ApiProperty({
    description: 'Número de niños',
    example: 1,
    minimum: 0,
    default: 0,
  })
  @IsInt()
  @Min(0)
  numberOfChildren: number;

  @ApiProperty({
    description: 'Nombre completo del huésped',
    example: 'María González',
  })
  @IsString()
  guestName: string;

  @ApiProperty({
    description: 'Email del huésped',
    example: 'maria@example.com',
  })
  @IsEmail()
  guestEmail: string;

  @ApiProperty({
    description: 'Teléfono del huésped',
    example: '+58 414 123 4567',
  })
  @IsString()
  guestPhone: string;

  @ApiPropertyOptional({
    description: 'Solicitudes especiales (opcional)',
    example: 'Cama extra para niño, vista al mar',
  })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiProperty({
    description: 'ID de la habitación a reservar',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  roomId: string;
}

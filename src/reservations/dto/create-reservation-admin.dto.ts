import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationAdminDto {
  @ApiProperty({
    description: 'ID del cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  clientId: string;

  @ApiProperty({
    description: 'ID de la habitación',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  roomId: string;

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
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsInt()
  @Min(0)
  numberOfChildren: number;

  @ApiPropertyOptional({
    description: 'Solicitudes especiales (opcional)',
    example: 'Luna de miel, cumpleaños, alergias alimentarias',
  })
  @IsOptional()
  @IsString()
  specialRequests?: string;
}

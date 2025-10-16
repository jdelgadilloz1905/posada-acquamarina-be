import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateReservationAdminDto } from './create-reservation-admin.dto';
import { ReservationStatus } from '../entities/reservation.entity';

export class UpdateReservationAdminDto extends PartialType(CreateReservationAdminDto) {
  @ApiPropertyOptional({
    description: 'Estado de la reservación',
    enum: ReservationStatus,
    example: ReservationStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;
}

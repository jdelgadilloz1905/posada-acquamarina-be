import { IsString, IsDateString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AvailabilityQueryDto {
  @ApiProperty({
    description: 'Room ID to check availability',
    example: '1',
  })
  @IsString()
  roomId: string;

  @ApiProperty({
    description: 'Check-in date (YYYY-MM-DD)',
    example: '2025-12-01',
  })
  @IsDateString()
  checkInDate: string;

  @ApiProperty({
    description: 'Check-out date (YYYY-MM-DD)',
    example: '2025-12-05',
  })
  @IsDateString()
  checkOutDate: string;

  @ApiProperty({
    description: 'Number of adults',
    example: 2,
    required: false,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  adults?: number;

  @ApiProperty({
    description: 'Number of children',
    example: 0,
    required: false,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  children?: number;

  @ApiProperty({
    description: 'Number of rooms to book',
    example: 1,
    required: false,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  rooms?: number;

  @ApiProperty({
    description: 'Promotional code',
    example: 'SUMMER2025',
    required: false,
  })
  @IsOptional()
  @IsString()
  promoCode?: string;
}

export class BulkAvailabilityQueryDto {
  @ApiProperty({
    description: 'Check-in date (YYYY-MM-DD)',
    example: '2025-12-01',
  })
  @IsDateString()
  checkInDate: string;

  @ApiProperty({
    description: 'Check-out date (YYYY-MM-DD)',
    example: '2025-12-05',
  })
  @IsDateString()
  checkOutDate: string;

  @ApiProperty({
    description: 'Number of adults',
    example: 2,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  adults?: number;

  @ApiProperty({
    description: 'Number of children',
    example: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  children?: number;

  @ApiProperty({
    description: 'Number of rooms to book',
    example: 1,
    required: false,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  rooms?: number;

  @ApiProperty({
    description: 'Promotional code',
    example: 'SUMMER2025',
    required: false,
  })
  @IsOptional()
  @IsString()
  promoCode?: string;

  @ApiProperty({
    description: 'Include detailed rates per night',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  detailedRates?: boolean;
}

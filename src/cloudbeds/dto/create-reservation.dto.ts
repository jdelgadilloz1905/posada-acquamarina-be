import {
  IsString,
  IsDateString,
  IsEmail,
  IsArray,
  ValidateNested,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsISOCountry } from '../validators/iso-country.validator';

class CloudbedsRoomDto {
  @ApiProperty({ description: 'Room Type ID from Cloudbeds', example: '123456' })
  @IsString()
  roomTypeID: string;

  @ApiProperty({ description: 'Number of rooms', example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Room Rate ID (optional)', required: false })
  @IsOptional()
  @IsString()
  roomRateID?: string;

  @ApiProperty({ description: 'Specific Room ID (optional)', required: false })
  @IsOptional()
  @IsString()
  roomID?: string;
}

class CloudbedsGuestCountDto {
  @ApiProperty({ description: 'Room Type ID', example: '123456' })
  @IsString()
  roomTypeID: string;

  @ApiProperty({ description: 'Number of guests', example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Specific Room ID (optional)', required: false })
  @IsOptional()
  @IsString()
  roomID?: string;
}

class CloudbedsCustomFieldDto {
  @ApiProperty({ description: 'Custom field name', example: 'special_request' })
  @IsString()
  fieldName: string;

  @ApiProperty({ description: 'Custom field value', example: 'Late check-in' })
  @IsString()
  fieldValue: string;
}

export class CloudbedsCreateReservationDto {
  @ApiProperty({
    description: 'Check-in date (YYYY-MM-DD)',
    example: '2025-12-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Check-out date (YYYY-MM-DD)',
    example: '2025-12-05',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Guest first name', example: 'Juan' })
  @IsString()
  guestFirstName: string;

  @ApiProperty({ description: 'Guest last name', example: 'Pérez' })
  @IsString()
  guestLastName: string;

  @ApiProperty({ description: 'Guest email', example: 'juan@example.com' })
  @IsEmail()
  guestEmail: string;

  @ApiProperty({
    description: 'Guest country (ISO-2 code)',
    example: 'VE',
    minLength: 2,
    maxLength: 2,
  })
  @IsISOCountry()
  @Length(2, 2)
  guestCountry: string;

  @ApiProperty({ description: 'Guest ZIP/Postal code', example: '1010' })
  @IsString()
  guestZip: string;

  @ApiProperty({
    description: 'Guest phone (optional)',
    example: '+58-212-1234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  guestPhone?: string;

  @ApiProperty({
    description: 'Guest gender (optional)',
    enum: ['male', 'female', 'other'],
    required: false,
  })
  @IsOptional()
  @IsIn(['male', 'female', 'other'])
  guestGender?: 'male' | 'female' | 'other';

  @ApiProperty({
    description: 'Estimated arrival time (24h format: HH:MM)',
    example: '15:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  estimatedArrivalTime?: string;

  @ApiProperty({
    description: 'Array of rooms to book',
    type: [CloudbedsRoomDto],
    example: [{ roomTypeID: '123456', quantity: 1 }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CloudbedsRoomDto)
  rooms: CloudbedsRoomDto[];

  @ApiProperty({
    description: 'Array of adults per room',
    type: [CloudbedsGuestCountDto],
    example: [{ roomTypeID: '123456', quantity: 2 }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CloudbedsGuestCountDto)
  adults: CloudbedsGuestCountDto[];

  @ApiProperty({
    description: 'Array of children per room (optional)',
    type: [CloudbedsGuestCountDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CloudbedsGuestCountDto)
  children?: CloudbedsGuestCountDto[];

  @ApiProperty({
    description: 'Payment method',
    example: 'credit',
    enum: ['cash', 'credit', 'bank_transfer', 'paypal'],
  })
  @IsString()
  paymentMethod: string;

  @ApiProperty({
    description: 'Card token for Stripe (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  cardToken?: string;

  @ApiProperty({
    description: 'Payment authorization code for Stripe (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentAuthorizationCode?: string;

  @ApiProperty({
    description: 'Promotional code (optional)',
    example: 'SUMMER2025',
    required: false,
  })
  @IsOptional()
  @IsString()
  promoCode?: string;

  @ApiProperty({
    description: 'Allotment block code (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  allotmentBlockCode?: string;

  @ApiProperty({
    description: 'Custom fields (optional)',
    type: [CloudbedsCustomFieldDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CloudbedsCustomFieldDto)
  customFields?: CloudbedsCustomFieldDto[];
}

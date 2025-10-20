import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactSubject, ContactStatus } from '../entities/contact.entity';

export class CreateContactDto {
  @ApiProperty({
    description: 'Nombre completo del contacto',
    example: 'Juan Pérez',
  })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({
    description: 'Correo electrónico del contacto',
    example: 'juan@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Teléfono del contacto',
    example: '+58 414 123 4567',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Asunto del mensaje',
    enum: ContactSubject,
    example: ContactSubject.RESERVAS,
  })
  @IsEnum(ContactSubject)
  subject: ContactSubject;

  @ApiProperty({
    description: 'Mensaje del contacto',
    example: 'Me gustaría obtener información sobre disponibilidad de habitaciones...',
  })
  @IsString()
  @MinLength(10)
  message: string;

  @ApiPropertyOptional({
    description: 'Estado del mensaje de contacto',
    enum: ContactStatus,
    example: ContactStatus.PENDIENTE,
    default: ContactStatus.PENDIENTE,
  })
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;
}

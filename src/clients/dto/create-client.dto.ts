import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({
    description: 'Nombre completo del cliente',
    example: 'María González',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'Email del cliente',
    example: 'maria@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Teléfono del cliente',
    example: '+58 414 123 4567',
  })
  @IsString()
  phone: string;
}

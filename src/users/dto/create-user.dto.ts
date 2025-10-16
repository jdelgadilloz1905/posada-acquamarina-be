import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'nuevo@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contraseña (mínimo 6 caracteres)',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Nombre completo',
    example: 'Carlos Rodríguez',
  })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({
    description: 'Teléfono (opcional)',
    example: '+58 412 987 6543',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario',
    enum: UserRole,
    example: 'user',
    default: 'user',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

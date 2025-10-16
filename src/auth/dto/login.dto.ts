import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'admin@acquamarina.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contraseña',
    example: 'Admin123!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}

import { PartialType } from '@nestjs/swagger';
import { CreateContactDto } from './create-contact.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContactStatus } from '../entities/contact.entity';

export class UpdateContactDto extends PartialType(CreateContactDto) {
  @ApiPropertyOptional({
    description: 'Estado del mensaje de contacto',
    enum: ContactStatus,
    example: ContactStatus.EN_PROCESO,
  })
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;
}

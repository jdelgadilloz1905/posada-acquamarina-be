import { IsEnum, IsOptional, IsBoolean, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationModule } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ enum: NotificationModule })
  @IsEnum(NotificationModule)
  module: NotificationModule;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class UpdatePreferenceDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ enum: NotificationModule })
  module: NotificationModule;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  entityType?: string;

  @ApiPropertyOptional()
  entityId?: string;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  readAt?: Date;
}

export class PreferenceResponseDto {
  @ApiProperty({ enum: NotificationModule })
  module: NotificationModule;

  @ApiProperty()
  enabled: boolean;
}

export class UnreadCountResponseDto {
  @ApiProperty()
  count: number;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SyncType, SyncStatus } from '../entities/sync-log.entity';

export class SyncResultDto {
  @ApiProperty()
  processed: number;

  @ApiProperty()
  created: number;

  @ApiProperty()
  updated: number;

  @ApiPropertyOptional()
  errors?: string[];
}

export class SyncLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: SyncType })
  type: SyncType;

  @ApiProperty({ enum: SyncStatus })
  status: SyncStatus;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty()
  recordsProcessed: number;

  @ApiProperty()
  recordsCreated: number;

  @ApiProperty()
  recordsUpdated: number;

  @ApiPropertyOptional()
  errors?: string;

  @ApiProperty()
  createdAt: Date;
}

export class SyncStatusResponseDto {
  @ApiPropertyOptional()
  lastSync?: SyncLogResponseDto;

  @ApiProperty()
  isRunning: boolean;

  @ApiPropertyOptional()
  nextScheduledSync?: string;
}

export class TriggerSyncDto {
  @ApiPropertyOptional({ enum: SyncType, default: SyncType.ALL })
  type?: SyncType;
}

export class SyncDetailedResultDto {
  @ApiProperty()
  rooms: SyncResultDto;

  @ApiProperty()
  guests: SyncResultDto;

  @ApiProperty()
  reservations: SyncResultDto;

  @ApiProperty()
  syncLogId: string;

  @ApiProperty({ enum: SyncStatus })
  status: SyncStatus;

  @ApiProperty()
  duration: number;
}

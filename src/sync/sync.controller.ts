import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SyncService } from './sync.service';
import {
  SyncLogResponseDto,
  SyncStatusResponseDto,
  SyncDetailedResultDto,
} from './dto/sync.dto';

@ApiTags('Sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get sync logs history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of sync logs',
    type: [SyncLogResponseDto],
  })
  async getLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.syncService.getLogs(pageNum, limitNum);
  }

  @Get('logs/:id')
  @ApiOperation({ summary: 'Get sync log by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Sync log details',
    type: SyncLogResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Sync log not found' })
  async getLogById(@Param('id', ParseUUIDPipe) id: string) {
    return this.syncService.getLogById(id);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current sync status' })
  @ApiResponse({
    status: 200,
    description: 'Current sync status',
    type: SyncStatusResponseDto,
  })
  async getStatus() {
    return this.syncService.getStatus();
  }

  @Get('debug')
  @ApiOperation({ summary: '[DEBUG] Get sync debug info' })
  @ApiResponse({ status: 200, description: 'Debug info about sync logs and dates' })
  async getDebugInfo() {
    return this.syncService.getDebugSyncInfo();
  }

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger manual sync' })
  @ApiResponse({
    status: 200,
    description: 'Sync result',
    type: SyncDetailedResultDto,
  })
  @ApiResponse({ status: 409, description: 'Sync already in progress' })
  async triggerSync() {
    const result = await this.syncService.syncAll();

    return {
      syncLogId: result.syncLog.id,
      status: result.syncLog.status,
      rooms: {
        processed: result.rooms.processed,
        created: result.rooms.created,
        updated: result.rooms.updated,
        errors: result.rooms.errors,
      },
      guests: {
        processed: result.guests.processed,
        created: result.guests.created,
        updated: result.guests.updated,
        errors: result.guests.errors,
      },
      reservations: {
        processed: result.reservations.processed,
        created: result.reservations.created,
        updated: result.reservations.updated,
        errors: result.reservations.errors,
      },
      duration: result.syncLog.completedAt
        ? result.syncLog.completedAt.getTime() - result.syncLog.startedAt.getTime()
        : 0,
    };
  }
}

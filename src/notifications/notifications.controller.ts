import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Body,
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
import { NotificationsService } from './notifications.service';
import { NotificationModule } from './entities/notification.entity';
import {
  UpdatePreferenceDto,
  NotificationResponseDto,
  PreferenceResponseDto,
  UnreadCountResponseDto,
} from './dto/notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'filter', required: false, enum: ['all', 'unread', 'read'] })
  @ApiResponse({
    status: 200,
    description: 'List of notifications',
    type: [NotificationResponseDto],
  })
  async findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('filter') filter?: 'all' | 'unread' | 'read',
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.notificationsService.findAll(req.user.id, pageNum, limitNum, filter);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get only unread notifications (for dropdown bell)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of unread notifications',
    type: [NotificationResponseDto],
  })
  async findUnread(
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.notificationsService.findUnread(req.user.id, limitNum);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread notifications' })
  @ApiResponse({
    status: 200,
    description: 'Unread count',
    type: UnreadCountResponseDto,
  })
  async getUnreadCount(@Request() req): Promise<UnreadCountResponseDto> {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { message: 'All notifications marked as read' };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of preferences by module',
    type: [PreferenceResponseDto],
  })
  async getPreferences(@Request() req): Promise<PreferenceResponseDto[]> {
    return this.notificationsService.getPreferences(req.user.id);
  }

  @Patch('preferences/:module')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update notification preference for a module' })
  @ApiParam({ name: 'module', enum: NotificationModule })
  @ApiResponse({
    status: 200,
    description: 'Preference updated',
    type: PreferenceResponseDto,
  })
  async updatePreference(
    @Param('module') module: NotificationModule,
    @Body() dto: UpdatePreferenceDto,
    @Request() req,
  ): Promise<PreferenceResponseDto> {
    const preference = await this.notificationsService.updatePreference(
      req.user.id,
      module,
      dto.enabled,
    );
    return { module: preference.module, enabled: preference.enabled };
  }
}

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean, description: 'Filter by read status' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Items to fetch' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Items to skip' })
  @ApiResponse({ status: 200, description: 'List of notifications and unread count' })
  async getMyNotifications(
    @CurrentUser() user: any,
    @Query('isRead') isRead?: string,
    @Query('take') take?: number,
    @Query('skip') skip?: number,
  ) {
    const isReadBool = isRead !== undefined ? isRead === 'true' : undefined;
    return this.notificationsService.findUserNotifications(
      user.id,
      isReadBool,
      take ? Number(take) : 50,
      skip ? Number(skip) : 0,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get current user unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark single notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all user notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async deleteNotification(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.remove(id, user.id);
  }

  // Legacy route compatibility
  @Get('user/:userId')
  @ApiOperation({ summary: 'Legacy: Get user notifications by userId' })
  async getUserNotifications(@Param('userId') userId: string, @CurrentUser() user: any) {
    const targetUserId = user.role === 'ADMIN' ? userId : user.id;
    return this.notificationsService.findUserNotifications(targetUserId);
  }
}

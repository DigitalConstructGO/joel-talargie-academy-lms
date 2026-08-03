import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import {
  DeliveryListDto,
  MarkNotificationsReadDto,
  NotificationListDto,
  ReasonDto,
  TemplatePreviewDto,
} from '../dto/notifications.dto';
import { NotificationsService } from '../services/notifications.service';

@Controller('me/notifications')
@ApiTags('My Notifications')
@ApiBearerAuth()
export class MyNotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get()
  @ApiOperation({ summary: 'List the authenticated user notifications' })
  list(@CurrentUser() user: AuthUser, @Query() query: NotificationListDto) {
    return this.notifications.listMine(user.id, query);
  }
  @Get('unread-count') unread(@CurrentUser() user: AuthUser) {
    return this.notifications.unread(user.id);
  }
  @Get(':notificationId') detail(
    @CurrentUser() user: AuthUser,
    @Param('notificationId', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.mine(user.id, id);
  }
  @Patch(':notificationId/read') read(
    @CurrentUser() user: AuthUser,
    @Param('notificationId', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.mark(user.id, [id]);
  }
  @Patch('read') readMany(
    @CurrentUser() user: AuthUser,
    @Body() dto: MarkNotificationsReadDto,
  ) {
    return this.notifications.mark(user.id, dto.notificationIds);
  }
  @Patch('read-all') readAll(@CurrentUser() user: AuthUser) {
    return this.notifications.mark(user.id);
  }
  @Delete(':notificationId') archive(
    @CurrentUser() user: AuthUser,
    @Param('notificationId', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.archive(user.id, id);
  }
}

@Controller('admin/email-deliveries')
@ApiTags('Administrator Email Deliveries', 'Email Delivery Attempts')
@ApiBearerAuth()
export class AdminEmailDeliveriesController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get() @RequirePermissions('notifications.read') list(
    @Query() query: DeliveryListDto,
  ) {
    return this.notifications.listDeliveries(query);
  }
  @Get(':deliveryId/attempts')
  @RequirePermissions('notifications.view_delivery_attempts')
  attempts(@Param('deliveryId', ParseUUIDPipe) id: string) {
    return this.notifications.attempts(id);
  }
  @Get(':deliveryId') @RequirePermissions('notifications.read') detail(
    @Param('deliveryId', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.delivery(id);
  }
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':deliveryId/retry')
  @RequirePermissions('notifications.retry_email')
  retry(
    @CurrentUser() actor: AuthUser,
    @Param('deliveryId', ParseUUIDPipe) id: string,
    @Body() dto: ReasonDto,
  ) {
    return this.notifications.retry(actor.id, id, dto.reason);
  }
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':deliveryId/cancel')
  @RequirePermissions('notifications.cancel_email')
  cancel(
    @CurrentUser() actor: AuthUser,
    @Param('deliveryId', ParseUUIDPipe) id: string,
    @Body() dto: ReasonDto,
  ) {
    return this.notifications.cancel(actor.id, id, dto.reason);
  }
}

@Controller('admin/email-templates')
@ApiTags('Email Templates')
@ApiBearerAuth()
@RequirePermissions('notifications.manage_templates')
export class EmailTemplatesController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get() list() {
    return this.notifications.templates();
  }
  @Get(':templateId') detail(@Param('templateId', ParseUUIDPipe) id: string) {
    return this.notifications.template(id);
  }
  @Post(':templateId/preview') preview(
    @Param('templateId', ParseUUIDPipe) id: string,
    @Body() dto: TemplatePreviewDto,
  ) {
    return this.notifications.preview(id, dto.variables);
  }
}

@Controller('admin/notification-system')
@ApiTags('Notification System Health')
@ApiBearerAuth()
export class NotificationHealthController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get('health')
  @RequirePermissions('notifications.view_worker_health')
  health() {
    return this.notifications.health();
  }
}

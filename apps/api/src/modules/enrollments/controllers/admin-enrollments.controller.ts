import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import {
  EnrollmentActivityQueryDto,
  EnrollmentReasonDto,
  ListAdminEnrollmentsDto,
} from '../dto/enrollment.dto';
import { EnrollmentsService } from '../services/enrollments.service';

@ApiTags('Administrator Enrollments')
@ApiBearerAuth()
@Controller('admin/enrollments')
export class AdminEnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}
  @Get()
  @RequirePermissions('enrollments.read')
  @ApiOperation({ summary: 'Search and list enrollments' })
  list(@Query() query: ListAdminEnrollmentsDto) {
    return this.enrollments.adminList(query);
  }
  @Get(':id/activity')
  @RequirePermissions('enrollments.view_activity')
  @ApiOperation({ summary: 'List enrollment activity' })
  activity(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: EnrollmentActivityQueryDto,
  ) {
    return this.enrollments.activity(id, query);
  }
  @Get(':id')
  @RequirePermissions('enrollments.read')
  @ApiOperation({
    summary: 'Get enrollment, Student, course, and payment-attempt summaries',
  })
  detail(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.enrollments.adminDetail(id);
  }
  @Post(':id/cancel')
  @RequirePermissions('enrollments.cancel')
  @ApiOperation({ summary: 'Cancel an eligible enrollment' })
  cancel(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: EnrollmentReasonDto,
  ) {
    return this.enrollments.cancel(actor.id, id, dto.reason);
  }
  @Post(':id/revoke-access')
  @RequirePermissions('enrollments.revoke')
  @ApiOperation({ summary: 'Revoke active course access' })
  revoke(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: EnrollmentReasonDto,
  ) {
    return this.enrollments.revoke(actor.id, id, dto.reason);
  }
}

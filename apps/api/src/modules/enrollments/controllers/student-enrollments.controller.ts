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
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import {
  CreateEnrollmentDto,
  ListMyEnrollmentsDto,
} from '../dto/enrollment.dto';
import { EnrollmentsService } from '../services/enrollments.service';

@Controller()
@ApiTags('Student Enrollments')
@ApiBearerAuth()
export class StudentEnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}
  @Post('enrollments')
  @Roles('STUDENT')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Enroll the authenticated Student in an available course',
  })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateEnrollmentDto) {
    return this.enrollments.create(user, dto.courseId);
  }
  @Get('me/enrollments')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'List the authenticated Student’s enrollments' })
  list(@CurrentUser() user: AuthUser, @Query() query: ListMyEnrollmentsDto) {
    return this.enrollments.mine(user.id, query);
  }
  @Get('me/enrollments/course/:courseId')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Check enrollment state for one course' })
  byCourse(
    @CurrentUser() user: AuthUser,
    @Param('courseId', new ParseUUIDPipe()) id: string,
  ) {
    return this.enrollments.mineByCourse(user.id, id);
  }
  @Get('me/enrollments/:enrollmentId')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get one owned enrollment' })
  detail(
    @CurrentUser() user: AuthUser,
    @Param('enrollmentId', new ParseUUIDPipe()) id: string,
  ) {
    return this.enrollments.mineById(user.id, id);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { UpdateVideoPositionDto } from '../dto/learning.dto';
import { LearningService } from '../services/learning.service';

@Controller('me/learning/enrollments')
@ApiTags('Student Learning', 'Lesson Progress')
@ApiBearerAuth()
@Roles('STUDENT')
export class StudentLearningController {
  constructor(private readonly learning: LearningService) {}

  @Post(':enrollmentId/start')
  @ApiOperation({
    summary: 'Start or resume an accessible course idempotently',
  })
  start(
    @CurrentUser() user: AuthUser,
    @Param('enrollmentId', ParseUUIDPipe) id: string,
  ) {
    return this.learning.start(user, id);
  }

  @Get(':enrollmentId/resume')
  @ApiOperation({ summary: 'Get the next safe resume target' })
  resume(
    @CurrentUser() user: AuthUser,
    @Param('enrollmentId', ParseUUIDPipe) id: string,
  ) {
    return this.learning.resume(user, id);
  }

  @Get(':enrollmentId')
  @ApiOperation({ summary: 'Get ordered curriculum and progress overview' })
  overview(
    @CurrentUser() user: AuthUser,
    @Param('enrollmentId', ParseUUIDPipe) id: string,
  ) {
    return this.learning.overview(user, id);
  }

  @Post(':enrollmentId/lessons/:lessonId/open')
  @ApiOperation({
    summary: 'Open a published lesson without regressing completed progress',
  })
  open(
    @CurrentUser() user: AuthUser,
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.learning.open(user, enrollmentId, lessonId);
  }

  @Get(':enrollmentId/lessons/:lessonId')
  @ApiOperation({
    summary: 'Get safe lesson content and visible resource metadata',
  })
  lesson(
    @CurrentUser() user: AuthUser,
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.learning.lesson(user, enrollmentId, lessonId);
  }

  @Patch(':enrollmentId/lessons/:lessonId/position')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Save an exact bounded video playback position' })
  position(
    @CurrentUser() user: AuthUser,
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: UpdateVideoPositionDto,
  ) {
    return this.learning.position(
      user,
      enrollmentId,
      lessonId,
      dto.positionSeconds,
    );
  }

  @Post(':enrollmentId/lessons/:lessonId/complete')
  @ApiOperation({
    summary:
      'Complete a lesson and transactionally recalculate course progress',
  })
  complete(
    @CurrentUser() user: AuthUser,
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.learning.complete(user, enrollmentId, lessonId);
  }
}

import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import { LearningActivityQueryDto } from '../dto/learning.dto';
import { LearningService } from '../services/learning.service';

@Controller('admin/enrollments')
@ApiTags('Administrator Learning Progress')
@ApiBearerAuth()
export class AdminLearningController {
  constructor(private readonly learning: LearningService) {}

  @Get(':enrollmentId/progress')
  @RequirePermissions('learning.view_student_progress')
  @ApiOperation({ summary: 'View one Student enrollment progress summary' })
  progress(@Param('enrollmentId', ParseUUIDPipe) enrollmentId: string) {
    return this.learning.adminProgress(enrollmentId);
  }

  @Get(':enrollmentId/progress/activity')
  @RequirePermissions('learning.view_activity')
  @ApiOperation({ summary: 'View bounded learning activity history' })
  activity(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Query() query: LearningActivityQueryDto,
  ) {
    return this.learning.adminActivity(enrollmentId, query);
  }
}

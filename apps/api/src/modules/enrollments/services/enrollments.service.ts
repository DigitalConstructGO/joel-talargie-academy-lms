import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import {
  enrollmentAllowsLearningAccess,
  enrollmentNextAction,
} from '../constants/enrollment.constants';
import type {
  EnrollmentActivityQueryDto,
  ListAdminEnrollmentsDto,
  ListMyEnrollmentsDto,
} from '../dto/enrollment.dto';
import { EnrollmentsRepository } from '../repositories/enrollments.repository';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly repository: EnrollmentsRepository) {}
  private present<T extends { status: string }>(enrollment: T) {
    return {
      ...enrollment,
      nextAction: enrollmentNextAction(enrollment.status),
      hasLearningAccess: enrollmentAllowsLearningAccess(enrollment.status),
    };
  }
  private map(error: unknown): never {
    const value = String(error);
    for (const code of [
      'USER_NOT_FOUND',
      'COURSE_NOT_FOUND',
      'ENROLLMENT_NOT_FOUND',
    ])
      if (value.includes(code))
        throw new NotFoundException({
          code,
          message: code.replaceAll('_', ' ').toLowerCase(),
        });
    for (const code of [
      'ACCOUNT_NOT_ACTIVE',
      'EMAIL_NOT_VERIFIED',
      'STUDENT_ROLE_REQUIRED',
      'COURSE_NOT_PUBLISHED',
      'COURSE_ARCHIVED',
      'COURSE_CATEGORY_INACTIVE',
      'COURSE_PRIVATE',
      'ENROLLMENT_NOT_OPEN',
      'ENROLLMENT_CLOSED',
      'INVALID_PRICE_SNAPSHOT',
    ])
      if (value.includes(code))
        throw new UnprocessableEntityException({
          code,
          message: code.replaceAll('_', ' ').toLowerCase(),
        });
    for (const code of [
      'COURSE_CAPACITY_REACHED',
      'ENROLLMENT_CANCELLED',
      'ENROLLMENT_ACCESS_REVOKED',
      'ENROLLMENT_CANNOT_BE_CANCELLED',
      'ENROLLMENT_CANNOT_BE_REVOKED',
    ])
      if (value.includes(code))
        throw new ConflictException({
          code,
          message: code.replaceAll('_', ' ').toLowerCase(),
        });
    throw error;
  }
  async create(user: AuthUser, courseId: string) {
    if (!user.roles.includes('STUDENT'))
      throw new ForbiddenException({
        code: 'STUDENT_ROLE_REQUIRED',
        message: 'The Student role is required',
      });
    if (!user.emailVerified)
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'A verified email is required',
      });
    try {
      const result = await this.repository.create(user.id, courseId);
      return { ...result, enrollment: this.present(result.enrollment) };
    } catch (error) {
      this.map(error);
    }
  }
  async mine(userId: string, query: ListMyEnrollmentsDto) {
    const result = await this.repository.listMine(userId, query);
    return { ...result, items: result.items.map((item) => this.present(item)) };
  }
  async mineById(userId: string, enrollmentId: string) {
    const enrollment = await this.repository.studentEnrollment(
      userId,
      enrollmentId,
    );
    if (!enrollment)
      throw new NotFoundException({
        code: 'ENROLLMENT_NOT_FOUND',
        message: 'Enrollment not found',
      });
    return this.present(enrollment);
  }
  async mineByCourse(userId: string, courseId: string) {
    const enrollment = await this.repository.studentCourse(userId, courseId);
    return enrollment
      ? { enrolled: true, enrollment: this.present(enrollment) }
      : { enrolled: false, enrollment: null, nextAction: 'ENROLL' };
  }
  async adminList(query: ListAdminEnrollmentsDto) {
    const result = await this.repository.listAdmin(query);
    return { ...result, items: result.items.map((item) => this.present(item)) };
  }
  async adminDetail(id: string) {
    const enrollment = await this.repository.adminEnrollment(id);
    if (!enrollment)
      throw new NotFoundException({
        code: 'ENROLLMENT_NOT_FOUND',
        message: 'Enrollment not found',
      });
    return this.present(enrollment);
  }
  async cancel(actorId: string, id: string, reason: string) {
    try {
      return this.present(
        await this.repository.transition(actorId, id, 'cancel', reason),
      );
    } catch (error) {
      this.map(error);
    }
  }
  async revoke(actorId: string, id: string, reason: string) {
    try {
      return this.present(
        await this.repository.transition(actorId, id, 'revoke', reason),
      );
    } catch (error) {
      this.map(error);
    }
  }
  async activity(id: string, query: EnrollmentActivityQueryDto) {
    await this.adminDetail(id);
    return this.repository.activity(id, query);
  }
}

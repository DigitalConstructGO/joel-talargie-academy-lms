import { BadRequestException } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import type {
  CreateLessonDto,
  PricingDto,
  SettingsDto,
} from '../dto/catalog.dto';

export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
export const cleanRichText = (value: string) =>
  sanitizeHtml(value, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'em',
      'ul',
      'ol',
      'li',
      'h2',
      'h3',
      'blockquote',
      'a',
    ],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['https', 'mailto'],
  });
export const validatePricing = (
  dto: Pick<PricingDto, 'accessType' | 'price' | 'discountPrice' | 'currency'>,
) => {
  const price = Number(dto.price ?? 0),
    discount = dto.discountPrice == null ? null : Number(dto.discountPrice);
  if (
    !Number.isFinite(price) ||
    price < 0 ||
    (dto.accessType === 'FREE' && price !== 0) ||
    (dto.accessType === 'PAID' && price <= 0) ||
    (discount != null &&
      (!Number.isFinite(discount) || discount < 0 || discount > price))
  )
    throw new BadRequestException({
      code: 'INVALID_COURSE_PRICING',
      message: 'Course pricing is invalid',
    });
};
export const validateDates = (
  dto: Pick<SettingsDto, 'enrollmentOpenAt' | 'enrollmentCloseAt' | 'capacity'>,
) => {
  if (
    dto.enrollmentOpenAt &&
    dto.enrollmentCloseAt &&
    new Date(dto.enrollmentCloseAt) < new Date(dto.enrollmentOpenAt)
  )
    throw new BadRequestException({
      code: 'INVALID_COURSE_DATES',
      message: 'Enrollment close date must follow open date',
    });
  if (dto.capacity != null && dto.capacity <= 0)
    throw new BadRequestException({
      code: 'INVALID_COURSE_CAPACITY',
      message: 'Capacity must be positive',
    });
};
export const validateLesson = (dto: CreateLessonDto) => {
  const valid =
    dto.lessonType === 'VIDEO'
      ? Boolean(dto.videoUrl)
      : dto.lessonType === 'TEXT'
        ? Boolean(dto.content?.trim())
        : dto.lessonType === 'EXTERNAL_LINK'
          ? Boolean(dto.externalUrl)
          : dto.lessonType === 'DOCUMENT' || dto.lessonType === 'DOWNLOAD';
  if (!valid)
    throw new BadRequestException({
      code: 'INVALID_LESSON_TYPE_CONFIGURATION',
      message: 'Lesson content does not match its type',
    });
};

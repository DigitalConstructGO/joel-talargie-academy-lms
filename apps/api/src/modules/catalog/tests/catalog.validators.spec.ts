import { BadRequestException } from '@nestjs/common';
import { CourseAccessType, LessonType } from '../dto/catalog.dto';
import {
  cleanRichText,
  slugify,
  validateDates,
  validateLesson,
  validatePricing,
} from '../validators/catalog.validators';

describe('catalog validators', () => {
  it('generates deterministic safe slugs', () =>
    expect(slugify('  NestJS & PostgreSQL!  ')).toBe('nestjs-postgresql'));
  it('removes executable HTML', () =>
    expect(cleanRichText('<p>Safe</p><script>alert(1)</script>')).toBe(
      '<p>Safe</p>',
    ));
  it('accepts free zero pricing', () =>
    expect(() =>
      validatePricing({
        accessType: CourseAccessType.FREE,
        price: '0',
        currency: 'USD',
      }),
    ).not.toThrow());
  it('rejects a positive free-course price', () =>
    expect(() =>
      validatePricing({
        accessType: CourseAccessType.FREE,
        price: '10',
        currency: 'USD',
      }),
    ).toThrow(BadRequestException));
  it('rejects a paid course without a positive price', () =>
    expect(() =>
      validatePricing({
        accessType: CourseAccessType.PAID,
        price: '0',
        currency: 'USD',
      }),
    ).toThrow(BadRequestException));
  it('rejects a discount above its price', () =>
    expect(() =>
      validatePricing({
        accessType: CourseAccessType.PAID,
        price: '10',
        discountPrice: '11',
        currency: 'USD',
      }),
    ).toThrow(BadRequestException));
  it('rejects inverted enrollment dates', () =>
    expect(() =>
      validateDates({
        enrollmentOpenAt: '2026-08-03T10:00:00Z',
        enrollmentCloseAt: '2026-08-02T10:00:00Z',
      }),
    ).toThrow(BadRequestException));
  it('requires video content for video lessons', () =>
    expect(() =>
      validateLesson({ title: 'Video', lessonType: LessonType.VIDEO }),
    ).toThrow(BadRequestException));
  it('accepts text lesson content', () =>
    expect(() =>
      validateLesson({
        title: 'Text',
        lessonType: LessonType.TEXT,
        content: 'Safe lesson',
      }),
    ).not.toThrow());
});

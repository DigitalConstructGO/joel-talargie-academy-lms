import { describe, expect, it } from 'vitest';
import { formatReportValue, humanizeKey } from './humanize-key';

describe('humanizeKey', () => {
  it('splits camelCase into title case words', () => {
    expect(humanizeKey('courseTitle')).toBe('Course Title');
    expect(humanizeKey('studentEmail')).toBe('Student Email');
  });

  it('splits snake_case into title case words', () => {
    expect(humanizeKey('total_revenue')).toBe('Total Revenue');
  });

  it('leaves a single lowercase word capitalized', () => {
    expect(humanizeKey('status')).toBe('Status');
  });
});

describe('formatReportValue', () => {
  it('renders an em dash for null, undefined, and empty string', () => {
    expect(formatReportValue(null)).toBe('—');
    expect(formatReportValue(undefined)).toBe('—');
    expect(formatReportValue('')).toBe('—');
  });

  it('renders booleans as Yes/No', () => {
    expect(formatReportValue(true)).toBe('Yes');
    expect(formatReportValue(false)).toBe('No');
  });

  it('JSON-stringifies objects and arrays', () => {
    expect(formatReportValue({ a: 1 })).toBe('{"a":1}');
    expect(formatReportValue([1, 2])).toBe('[1,2]');
  });

  it('stringifies primitives as-is', () => {
    expect(formatReportValue(42)).toBe('42');
    expect(formatReportValue('hello')).toBe('hello');
  });
});

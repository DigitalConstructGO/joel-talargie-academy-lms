import { toUtcIsoString } from './date.helper';

describe('toUtcIsoString', () => {
  it('formats a Date as an ISO 8601 UTC string', () => {
    expect(toUtcIsoString(new Date('2024-01-15T10:30:00.000Z'))).toBe(
      '2024-01-15T10:30:00.000Z',
    );
  });
});

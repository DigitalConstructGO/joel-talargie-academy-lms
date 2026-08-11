import { createUuid } from './uuid.helper';

describe('createUuid', () => {
  it('produces a valid, unique v4 UUID', () => {
    const a = createUuid();
    const b = createUuid();
    expect(a).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(a).not.toBe(b);
  });
});

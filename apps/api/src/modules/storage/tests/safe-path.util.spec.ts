import {
  resolveSafeStoragePath,
  UnsafeStorageKeyError,
} from '../utils/safe-path.util';

describe('resolveSafeStoragePath', () => {
  const root = process.platform === 'win32' ? 'C:\\storage' : '/storage';

  it('resolves a plain nested key inside the root', () => {
    const resolved = resolveSafeStoragePath(root, 'avatars/abc.png');
    expect(resolved.startsWith(root)).toBe(true);
    expect(resolved.endsWith('abc.png')).toBe(true);
  });

  it.each([
    '../../etc/passwd',
    '../secret.txt',
    'avatars/../../secret.txt',
    '/etc/passwd',
    'C:\\Windows\\System32',
    'avatars/\0hidden',
    '',
  ])('rejects unsafe key %p', (key) => {
    expect(() => resolveSafeStoragePath(root, key)).toThrow(
      UnsafeStorageKeyError,
    );
  });
});

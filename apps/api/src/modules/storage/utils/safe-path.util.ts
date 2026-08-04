import { resolve, sep } from 'node:path';

export class UnsafeStorageKeyError extends Error {
  constructor(key: string) {
    super(`Unsafe storage key rejected: ${key}`);
    this.name = 'UnsafeStorageKeyError';
  }
}

const SAFE_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

/**
 * Validates a storage key is a relative, traversal-free path and resolves it
 * to an absolute filesystem path guaranteed to live inside `root`.
 * Never trust a key coming from a client or another module without this.
 */
export function resolveSafeStoragePath(root: string, key: string): string {
  if (
    !key ||
    key.includes('\0') ||
    key.includes('..') ||
    key.startsWith('/') ||
    key.startsWith('\\') ||
    /^[A-Za-z]:/.test(key) ||
    !SAFE_KEY_PATTERN.test(key)
  )
    throw new UnsafeStorageKeyError(key);
  const resolvedRoot = resolve(root);
  const resolvedPath = resolve(resolvedRoot, key);
  if (
    resolvedPath !== resolvedRoot &&
    !resolvedPath.startsWith(resolvedRoot + sep)
  )
    throw new UnsafeStorageKeyError(key);
  return resolvedPath;
}

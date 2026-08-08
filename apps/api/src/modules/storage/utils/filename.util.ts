import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';

/** Strips path separators/control characters and caps length; never trust a client filename otherwise. */
export function sanitizeOriginalFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name;
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 150);
  return cleaned || 'file';
}

/** True when the filename has more than one extension segment (e.g. `receipt.pdf.exe`). */
export function hasDoubleExtension(
  name: string,
  matchedExtension: string,
): boolean {
  const withoutMatched = name.slice(0, name.length - matchedExtension.length);
  return withoutMatched.includes('.');
}

export function buildStoredFileName(extension: string): string {
  return `${randomUUID()}${extension}`;
}

export function extensionOf(name: string): string {
  return extname(name).toLowerCase();
}

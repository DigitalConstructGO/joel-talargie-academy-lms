import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

export function sha256Buffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function sha256File(path: string): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(path);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolvePromise(hash.digest('hex')));
  });
}

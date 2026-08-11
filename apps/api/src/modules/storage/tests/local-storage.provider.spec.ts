import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ConfigService } from '@nestjs/config';
import { LocalStorageProvider } from '../providers/local-storage.provider';
import { UnsafeStorageKeyError } from '../utils/safe-path.util';

function createProvider(root: string) {
  const apiUrl = process.env.API_URL?.trim() || 'http://localhost:4000';
  const values: Record<string, unknown> = {
    STORAGE_ROOT: root,
    STORAGE_SIGNING_SECRET: 'test-signing-secret-at-least-32-chars',
    STORAGE_SIGNED_URL_TTL_SECONDS: 900,
    API_URL: apiUrl,
  };
  const config = {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
  const provider = new LocalStorageProvider(config);
  provider.onModuleInit();
  return provider;
}

describe('LocalStorageProvider', () => {
  let root: string;
  let provider: LocalStorageProvider;

  beforeEach(async () => {
    root = await fs.mkdtemp(join(tmpdir(), 'jta-storage-'));
    provider = createProvider(root);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('creates the mandated folder structure on init', async () => {
    for (const folder of [
      'avatars',
      'course-thumbnails',
      'lesson-files',
      'payment-receipts',
      'certificates',
      'temp',
      'exports',
    ]) {
      const stat = await fs.stat(join(root, folder));
      expect(stat.isDirectory()).toBe(true);
    }
  });

  it('writes and reads back a file, and stat matches', async () => {
    const body = Buffer.from('hello world');
    await provider.upload({
      key: 'avatars/one.txt',
      body,
      contentType: 'text/plain',
    });
    const stat = await provider.stat('avatars/one.txt');
    expect(stat.size).toBe(body.length);
    expect(await provider.exists('avatars/one.txt')).toBe(true);
  });

  it('deletes a file', async () => {
    await provider.upload({
      key: 'avatars/two.txt',
      body: Buffer.from('x'),
      contentType: 'text/plain',
    });
    await provider.delete('avatars/two.txt');
    expect(await provider.exists('avatars/two.txt')).toBe(false);
  });

  it('rejects a path-traversal key', async () => {
    await expect(
      provider.upload({
        key: '../outside.txt',
        body: Buffer.from('x'),
        contentType: 'text/plain',
      }),
    ).rejects.toThrow(UnsafeStorageKeyError);
  });

  it('mints a signed URL whose token this provider can verify', async () => {
    const url = await provider.getSignedUrl('certificates/one.pdf', 300);
    const expectedBase = `${process.env.API_URL?.trim() || 'http://localhost:4000'}/api/v1`;
    expect(url).toContain(`${expectedBase}/storage/files/`);
    const token = url.split('/files/')[1];
    const verification = provider.verifyToken(token);
    expect(verification).toMatchObject({
      valid: true,
      payload: { key: 'certificates/one.pdf' },
    });
  });

  it('commits a temp file into its final key location via rename', async () => {
    const tempPath = join(root, 'temp', 'upload-test.tmp');
    await fs.writeFile(tempPath, Buffer.from('lesson content'));
    const result = await provider.commitFromTempPath(
      tempPath,
      'lesson-files/final.pdf',
    );
    expect(result.fileSize).toBe(Buffer.from('lesson content').length);
    expect(await provider.exists('lesson-files/final.pdf')).toBe(true);
    await expect(fs.access(tempPath)).rejects.toThrow();
  });

  it('produces a stream descriptor with a stable ETag and inferred mimetype', async () => {
    await provider.upload({
      key: 'certificates/one.pdf',
      body: Buffer.from('%PDF-1.7 fake'),
      contentType: 'application/pdf',
    });
    const descriptor = await provider.readDescriptor(
      'certificates/one.pdf',
      'certificate.pdf',
    );
    expect(descriptor.mimeType).toBe('application/pdf');
    expect(descriptor.fileName).toBe('certificate.pdf');
    expect(descriptor.etag).toMatch(/^".+"$/);
    descriptor.stream.destroy();
  });

  it('purges abandoned temp files older than the max age but keeps fresh ones', async () => {
    const stale = join(root, 'temp', 'stale.tmp');
    const fresh = join(root, 'temp', 'fresh.tmp');
    await fs.writeFile(stale, 'old');
    await fs.writeFile(fresh, 'new');
    const oldTime = new Date(Date.now() - 48 * 60 * 60 * 1000);
    await fs.utimes(stale, oldTime, oldTime);
    const removed = await provider.cleanupTempFiles(24 * 60 * 60 * 1000);
    expect(removed).toBe(1);
    await expect(fs.access(stale)).rejects.toThrow();
    await expect(fs.access(fresh)).resolves.toBeUndefined();
  });
});

import type { Response } from 'express';
import type { FileStreamDescriptor } from '../interfaces/local-storage.interface';

export function writeFileResponse(
  response: Response,
  descriptor: FileStreamDescriptor,
  disposition: 'inline' | 'attachment',
): void {
  response.setHeader('Content-Type', descriptor.mimeType);
  response.setHeader('Content-Length', descriptor.size.toString());
  response.setHeader(
    'Content-Disposition',
    `${disposition}; filename="${descriptor.fileName}"`,
  );
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('ETag', descriptor.etag);
  response.setHeader('Last-Modified', descriptor.lastModified.toUTCString());
  response.removeHeader('X-Frame-Options');
  response.removeHeader('x-frame-options');
  response.status(200);
  descriptor.stream.pipe(response);
}

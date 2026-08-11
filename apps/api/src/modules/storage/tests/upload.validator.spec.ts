import {
  PayloadTooLargeException,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { validateUploadFile } from '../validators/upload.validator';

const PNG_HEADER = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const PDF_HEADER = Buffer.from('%PDF-1.7', 'ascii');
const ZIP_HEADER = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
const MP4_HEADER = Buffer.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70]);

describe('validateUploadFile', () => {
  it('accepts a valid PNG avatar', () => {
    const result = validateUploadFile({
      category: 'AVATAR',
      originalName: 'me.png',
      size: 1024,
      header: PNG_HEADER,
    });
    expect(result).toEqual({
      extension: '.png',
      mimeType: 'image/png',
      originalFileName: 'me.png',
    });
  });

  it('accepts a valid JPEG course thumbnail', () => {
    const result = validateUploadFile({
      category: 'COURSE_THUMBNAIL',
      originalName: 'cover.jpg',
      size: 2048,
      header: JPEG_HEADER,
    });
    expect(result.mimeType).toBe('image/jpeg');
  });

  it('rejects an empty file', () => {
    expect(() =>
      validateUploadFile({
        category: 'AVATAR',
        originalName: 'me.png',
        size: 0,
        header: PNG_HEADER,
      }),
    ).toThrow(UnprocessableEntityException);
  });

  it('rejects a file over the category size limit', () => {
    expect(() =>
      validateUploadFile({
        category: 'AVATAR',
        originalName: 'me.png',
        size: 6 * 1024 * 1024,
        header: PNG_HEADER,
      }),
    ).toThrow(PayloadTooLargeException);
  });

  it('rejects a disallowed extension for the category', () => {
    expect(() =>
      validateUploadFile({
        category: 'AVATAR',
        originalName: 'malware.exe',
        size: 1024,
        header: Buffer.from([0x4d, 0x5a]),
      }),
    ).toThrow(UnsupportedMediaTypeException);
  });

  it('rejects a double-extension filename', () => {
    expect(() =>
      validateUploadFile({
        category: 'AVATAR',
        originalName: 'receipt.pdf.png',
        size: 1024,
        header: PNG_HEADER,
      }),
    ).toThrow(/Double-extension/);
  });

  it('rejects a spoofed extension whose bytes do not match', () => {
    expect(() =>
      validateUploadFile({
        category: 'AVATAR',
        originalName: 'fake.png',
        size: 1024,
        header: JPEG_HEADER,
      }),
    ).toThrow(UnsupportedMediaTypeException);
  });

  it('accepts a valid PDF lesson resource', () => {
    const result = validateUploadFile({
      category: 'LESSON_RESOURCE',
      originalName: 'syllabus.pdf',
      size: 10_000,
      header: PDF_HEADER,
    });
    expect(result.mimeType).toBe('application/pdf');
  });

  it('accepts a ZIP-family docx lesson resource', () => {
    const result = validateUploadFile({
      category: 'LESSON_RESOURCE',
      originalName: 'handout.docx',
      size: 10_000,
      header: ZIP_HEADER,
    });
    expect(result.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('accepts a valid MP4 lesson resource', () => {
    const result = validateUploadFile({
      category: 'LESSON_RESOURCE',
      originalName: 'lecture.mp4',
      size: 10_000,
      header: MP4_HEADER,
    });
    expect(result.mimeType).toBe('video/mp4');
  });

  it('rejects a lesson resource extension not allowed for avatars', () => {
    expect(() =>
      validateUploadFile({
        category: 'AVATAR',
        originalName: 'lecture.mp4',
        size: 10_000,
        header: MP4_HEADER,
      }),
    ).toThrow(UnsupportedMediaTypeException);
  });
});

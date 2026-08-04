export function isJpeg(header: Buffer): boolean {
  return (
    header.length >= 3 &&
    header[0] === 0xff &&
    header[1] === 0xd8 &&
    header[2] === 0xff
  );
}
export function isPng(header: Buffer): boolean {
  return (
    header.length >= 8 &&
    header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  );
}
export function isWebp(header: Buffer): boolean {
  return (
    header.length >= 12 &&
    header.subarray(0, 4).toString('ascii') === 'RIFF' &&
    header.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}
export function isPdf(header: Buffer): boolean {
  return (
    header.length >= 5 && header.subarray(0, 5).toString('ascii') === '%PDF-'
  );
}
/** ZIP local-file-header / empty-archive / spanned-archive signatures. Also matches DOCX/PPTX/XLSX (OOXML is ZIP). */
export function isZipFamily(header: Buffer): boolean {
  return (
    header.length >= 4 &&
    header[0] === 0x50 &&
    header[1] === 0x4b &&
    (header[2] === 0x03 || header[2] === 0x05 || header[2] === 0x07)
  );
}
export function isMp4(header: Buffer): boolean {
  return (
    header.length >= 8 && header.subarray(4, 8).toString('ascii') === 'ftyp'
  );
}
export function isMp3(header: Buffer): boolean {
  if (header.length < 3) return false;
  if (header.subarray(0, 3).toString('ascii') === 'ID3') return true;
  return header[0] === 0xff && (header[1] & 0xe0) === 0xe0;
}

import { PublicStorageFilesController } from '../public-storage-files.controller';

describe('PublicStorageFilesController', () => {
  const storage = { streamByToken: jest.fn() };
  const controller = new PublicStorageFilesController(storage as never);

  it('streams a file as an attachment for a valid signed token', async () => {
    const stream = { pipe: jest.fn() };
    storage.streamByToken.mockResolvedValue({
      stream,
      size: 10,
      mimeType: 'application/pdf',
      fileName: 'certificate.pdf',
      etag: '"xyz"',
      lastModified: new Date('2024-01-01T00:00:00Z'),
      disposition: 'attachment',
    });
    const response = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    await controller.streamByToken('signed-token', response as never);
    expect(storage.streamByToken).toHaveBeenCalledWith('signed-token');
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('attachment'),
    );
    expect(stream.pipe).toHaveBeenCalledWith(response);
  });

  it('streams a file inline when the signed token was minted for a preview', async () => {
    const stream = { pipe: jest.fn() };
    storage.streamByToken.mockResolvedValue({
      stream,
      size: 10,
      mimeType: 'application/pdf',
      fileName: 'certificate.pdf',
      etag: '"xyz"',
      lastModified: new Date('2024-01-01T00:00:00Z'),
      disposition: 'inline',
    });
    const response = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    await controller.streamByToken('signed-token', response as never);
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('inline'),
    );
  });
});

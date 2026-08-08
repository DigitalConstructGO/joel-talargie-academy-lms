import { StorageController } from '../storage.controller';

function mockResponse() {
  return { setHeader: jest.fn(), status: jest.fn().mockReturnThis() };
}

describe('StorageController', () => {
  const storage = {
    uploadAvatar: jest.fn(),
    deleteAvatar: jest.fn(),
    streamAvatar: jest.fn(),
    registerCourseThumbnail: jest.fn(),
    registerLessonResource: jest.fn(),
  };
  const controller = new StorageController(storage as never);
  const user = { id: 'user-1', roles: ['STUDENT'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('uploads an avatar for the caller', () => {
    const file = { originalname: 'a.png' } as never;
    controller.uploadAvatar(user, file);
    expect(storage.uploadAvatar).toHaveBeenCalledWith(user, file);
  });

  it('deletes the caller’s own avatar', () => {
    controller.deleteAvatar(user);
    expect(storage.deleteAvatar).toHaveBeenCalledWith(user);
  });

  it('streams an avatar inline with the right headers', async () => {
    const stream = { pipe: jest.fn() };
    storage.streamAvatar.mockResolvedValue({
      stream,
      size: 100,
      mimeType: 'image/png',
      fileName: 'avatar.png',
      etag: '"abc"',
      lastModified: new Date('2024-01-01T00:00:00Z'),
    });
    const response = mockResponse();
    await controller.streamAvatar(user, 'target-user', response as never);
    expect(storage.streamAvatar).toHaveBeenCalledWith(user, 'target-user');
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'image/png',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('inline'),
    );
    expect(stream.pipe).toHaveBeenCalledWith(response);
  });

  it('registers a course thumbnail upload', () => {
    const file = { originalname: 'cover.png' } as never;
    controller.uploadCourseThumbnail(user, file);
    expect(storage.registerCourseThumbnail).toHaveBeenCalledWith(user, file);
  });

  it('registers a lesson resource upload', () => {
    const file = { originalname: 'slides.pdf' } as never;
    controller.uploadLessonResource(user, file);
    expect(storage.registerLessonResource).toHaveBeenCalledWith(user, file);
  });
});

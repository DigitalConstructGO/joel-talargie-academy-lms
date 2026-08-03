import { UnprocessableEntityException } from '@nestjs/common';
import { CertificatesService } from '../services/certificates.service';

describe('CertificatesService', () => {
  const repository = {
    eligibility: jest.fn(),
    createIdentity: jest.fn(),
    listMine: jest.fn(),
    mine: jest.fn(),
    verify: jest.fn(),
    listAdmin: jest.fn(),
    admin: jest.fn(),
    currentFile: jest.fn(),
    files: jest.fn(),
    file: jest.fn(),
    events: jest.fn(),
    queue: jest.fn(),
    revoke: jest.fn(),
    templates: jest.fn(),
    template: jest.fn(),
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    activateTemplate: jest.fn(),
  };
  const config = {
    get: jest.fn(() => 'https://academy.example/certificates/verify'),
  };
  const storage = {
    upload: jest.fn(),
    delete: jest.fn(),
    getSignedUrl: jest.fn(),
  };
  const service = new CertificatesService(
    repository as never,
    config as never,
    storage,
  );
  const user = {
    id: 'student',
    roles: ['STUDENT'],
    emailVerified: true,
  } as never;

  beforeEach(() => {
    jest.clearAllMocks();
    repository.eligibility.mockResolvedValue({
      enrollmentStatus: 'COMPLETED',
      completedAt: new Date(),
      progressPercentage: 100,
      required: 3,
      completed: 3,
      certificateEnabled: true,
    });
    repository.createIdentity.mockResolvedValue({
      created: true,
      certificate: { status: 'PENDING' },
    });
  });

  it('creates high-entropy, non-identifying certificate identity values', async () => {
    await service.request(user, 'enrollment');
    expect(repository.createIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        certificateNumber: expect.stringMatching(/^JTA-\d{4}-[A-F0-9]{32}$/),
        verificationToken: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      }),
    );
    const input = repository.createIdentity.mock.calls[0][0];
    expect(JSON.stringify(input)).not.toContain('student@');
  });

  it.each([
    { enrollmentStatus: 'IN_PROGRESS' },
    { progressPercentage: 99 },
    { required: 0, completed: 0 },
    { required: 3, completed: 2 },
  ])('rejects an ineligible completion state', async (override) => {
    repository.eligibility.mockResolvedValueOnce({
      enrollmentStatus: 'COMPLETED',
      completedAt: new Date(),
      progressPercentage: 100,
      required: 3,
      completed: 3,
      certificateEnabled: true,
      ...override,
    });
    await expect(service.request(user, 'enrollment')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('returns only safe public verification states', async () => {
    repository.verify.mockResolvedValueOnce({
      status: 'GENERATED',
      certificateNumber: 'JTA-2026-SAFE',
      studentName: 'Student Name',
      courseTitle: 'Course',
      completionDate: new Date(),
      issuedAt: new Date(),
    });
    await expect(service.verify('A'.repeat(43))).resolves.toMatchObject({
      state: 'VALID',
    });
    await expect(service.verify('bad')).resolves.toEqual({ state: 'INVALID' });
  });

  it('rejects executable template configuration', () => {
    expect(() =>
      service.createTemplate('actor', {
        name: 'Unsafe',
        version: 1,
        configuration: { footerText: '<script>alert(1)</script>' },
      }),
    ).toThrow();
  });
});

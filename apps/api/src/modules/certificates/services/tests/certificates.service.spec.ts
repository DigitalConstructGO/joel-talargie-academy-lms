import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CertificatesService } from '../certificates.service';

describe('CertificatesService', () => {
  const repository = {
    listMine: jest.fn(),
    mine: jest.fn(),
    verify: jest.fn(),
    listAdmin: jest.fn(),
    admin: jest.fn(),
    queue: jest.fn(),
    revoke: jest.fn(),
    files: jest.fn(),
    file: jest.fn(),
    events: jest.fn(),
    templates: jest.fn(),
    template: jest.fn(),
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    activateTemplate: jest.fn(),
    eligibility: jest.fn(),
    createIdentity: jest.fn(),
    currentFile: jest.fn(),
  };
  const config = { get: jest.fn(() => undefined) };
  const storage = { getSignedUrl: jest.fn() };
  const notifications = { notify: jest.fn().mockResolvedValue(undefined) };
  const service = new CertificatesService(
    repository as never,
    config as never,
    storage as never,
    notifications as never,
  );

  beforeEach(() => jest.clearAllMocks());

  const eligibleRow = {
    enrollmentStatus: 'COMPLETED',
    completedAt: new Date(),
    progressPercentage: 100,
    required: 3,
    completed: 3,
    certificateEnabled: true,
  };

  describe('request (student self-service)', () => {
    it('rejects a non-student role', async () => {
      await expect(
        service.request(
          { id: 'u1', roles: ['ADMINISTRATOR'] } as never,
          'enr-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates a certificate for an eligible enrollment', async () => {
      repository.eligibility.mockResolvedValueOnce(eligibleRow);
      repository.createIdentity.mockResolvedValueOnce({ id: 'cert-1' });
      const result = await service.request(
        { id: 'u1', roles: ['STUDENT'] } as never,
        'enr-1',
      );
      expect(repository.eligibility).toHaveBeenCalledWith('u1', 'enr-1');
      expect(result).toEqual({ id: 'cert-1' });
    });

    it('throws NotFoundException when the enrollment does not exist', async () => {
      repository.eligibility.mockResolvedValueOnce(undefined);
      await expect(
        service.request({ id: 'u1', roles: ['STUDENT'] } as never, 'enr-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it.each([
      ['enrollmentStatus', { ...eligibleRow, enrollmentStatus: 'IN_PROGRESS' }],
      ['completedAt', { ...eligibleRow, completedAt: null }],
      ['progressPercentage', { ...eligibleRow, progressPercentage: 90 }],
      ['required', { ...eligibleRow, required: 0 }],
      ['completed<required', { ...eligibleRow, completed: 1, required: 3 }],
    ])(
      'rejects when %s makes the enrollment ineligible',
      async (_label, row) => {
        repository.eligibility.mockResolvedValueOnce(row);
        await expect(
          service.request({ id: 'u1', roles: ['STUDENT'] } as never, 'enr-1'),
        ).rejects.toThrow(UnprocessableEntityException);
      },
    );

    it('rejects when certificates are disabled for the course', async () => {
      repository.eligibility.mockResolvedValueOnce({
        ...eligibleRow,
        certificateEnabled: false,
      });
      await expect(
        service.request({ id: 'u1', roles: ['STUDENT'] } as never, 'enr-1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('retries certificate-number collisions up to twice before succeeding', async () => {
      repository.eligibility.mockResolvedValueOnce(eligibleRow);
      repository.createIdentity
        .mockRejectedValueOnce(
          new Error('duplicate key value violates unique constraint'),
        )
        .mockResolvedValueOnce({ id: 'cert-1' });
      const result = await service.request(
        { id: 'u1', roles: ['STUDENT'] } as never,
        'enr-1',
      );
      expect(repository.createIdentity).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ id: 'cert-1' });
    });

    it('rethrows the raw error on the 3rd consecutive collision (retry budget only covers the first 2)', async () => {
      repository.eligibility.mockResolvedValueOnce(eligibleRow);
      repository.createIdentity.mockRejectedValue(
        new Error('duplicate key value violates unique constraint'),
      );
      await expect(
        service.request({ id: 'u1', roles: ['STUDENT'] } as never, 'enr-1'),
      ).rejects.toThrow('duplicate key value violates unique constraint');
      expect(repository.createIdentity).toHaveBeenCalledTimes(3);
    });

    it('maps a non-collision creation error via the error mapper', async () => {
      repository.eligibility.mockResolvedValueOnce(eligibleRow);
      repository.createIdentity.mockRejectedValueOnce(new Error('NOT_FOUND'));
      await expect(
        service.request({ id: 'u1', roles: ['STUDENT'] } as never, 'enr-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  it('adminRequest creates on behalf of a null (self-service-less) student using the provided template', async () => {
    repository.eligibility.mockResolvedValueOnce(eligibleRow);
    repository.createIdentity.mockResolvedValueOnce({ id: 'cert-1' });
    await service.adminRequest('admin-1', 'enr-1', {
      templateId: 'tpl-1',
    } as never);
    expect(repository.eligibility).toHaveBeenCalledWith(null, 'enr-1');
    expect(repository.createIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'admin-1', templateId: 'tpl-1' }),
    );
  });

  describe('listMine / mine / studentDownload', () => {
    it('listMine presents each row with downloadAvailable/verificationUrl and hides the raw token', async () => {
      repository.listMine.mockResolvedValueOnce([
        {
          id: 'c1',
          status: 'GENERATED',
          verificationToken: 'secret-token',
        },
      ]);
      const [result] = await service.listMine('student-1', {} as never);
      expect(result).not.toHaveProperty('verificationToken');
      expect(result.downloadAvailable).toBe(true);
      expect(result.verificationUrl).toContain('secret-token');
    });

    it('mine throws NotFoundException for a missing certificate', async () => {
      repository.mine.mockResolvedValueOnce(undefined);
      await expect(service.mine('student-1', 'c1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('mine hides the verificationUrl for a PENDING certificate', async () => {
      repository.mine.mockResolvedValueOnce({
        id: 'c1',
        status: 'PENDING',
        verificationToken: 'secret',
      });
      const result = await service.mine('student-1', 'c1');
      expect(result.verificationUrl).toBeNull();
    });

    it('studentDownload throws NotFoundException when the certificate does not exist', async () => {
      repository.mine.mockResolvedValueOnce(undefined);
      await expect(service.studentDownload('student-1', 'c1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('studentDownload rejects when the certificate is not yet GENERATED', async () => {
      repository.mine.mockResolvedValueOnce({ id: 'c1', status: 'PENDING' });
      await expect(service.studentDownload('student-1', 'c1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('studentDownload returns a signed URL for a GENERATED certificate', async () => {
      repository.mine.mockResolvedValueOnce({ id: 'c1', status: 'GENERATED' });
      repository.currentFile.mockResolvedValueOnce({
        storageKey: 'k1',
        originalFileName: 'cert.pdf',
      });
      storage.getSignedUrl.mockResolvedValueOnce('https://signed/cert.pdf');
      const result = await service.studentDownload('student-1', 'c1');
      expect(result.url).toBe('https://signed/cert.pdf');
    });
  });

  describe('verify', () => {
    it('returns INVALID for a malformed token or code', async () => {
      await expect(service.verify('a!')).resolves.toEqual({
        state: 'INVALID',
      });
      expect(repository.verify).not.toHaveBeenCalled();
    });

    it('returns INVALID when no certificate matches or its status is not verifiable', async () => {
      const token = 'a'.repeat(60);
      repository.verify.mockResolvedValueOnce(undefined);
      await expect(service.verify(token)).resolves.toEqual({
        state: 'INVALID',
      });
    });

    it('returns VALID for a GENERATED certificate by token or certificate code', async () => {
      const code = 'JTA-2026-000001';
      repository.verify.mockResolvedValueOnce({
        status: 'GENERATED',
        certificateNumber: 'JTA-2026-000001',
        studentName: 'Ada Lovelace',
        courseTitle: 'CS101',
        completionDate: new Date('2026-01-01'),
        issuedAt: new Date('2026-01-02'),
      });
      const result = await service.verify(code);
      expect(result.state).toBe('VALID');
      expect(result.certificateNumber).toBe('JTA-2026-000001');
      expect(result.studentName).toBe('Ada Lovelace');
    });

    it('returns REVOKED for a revoked certificate', async () => {
      const token = 'a'.repeat(60);
      repository.verify.mockResolvedValueOnce({
        status: 'REVOKED',
        certificateNumber: 'JTA-1',
        studentName: 'Ada',
        courseTitle: 'CS101',
        completionDate: new Date('2026-01-01'),
        issuedAt: new Date('2026-01-02'),
      });
      const result = await service.verify(token);
      expect(result.state).toBe('REVOKED');
    });
  });

  describe('admin listings', () => {
    it('listAdmin presents every row with a verificationUrl', async () => {
      repository.listAdmin.mockResolvedValueOnce([
        { id: 'c1', verificationToken: 'tok' },
      ]);
      const [result] = await service.listAdmin({} as never);
      expect(result).not.toHaveProperty('verificationToken');
      expect(result.verificationUrl).toContain('tok');
    });

    it('admin throws NotFoundException for a missing certificate', async () => {
      repository.admin.mockResolvedValueOnce(undefined);
      await expect(service.admin('c1')).rejects.toThrow(NotFoundException);
    });

    it('admin returns the presented certificate', async () => {
      repository.admin.mockResolvedValueOnce({
        id: 'c1',
        verificationToken: 'tok',
      });
      const result = await service.admin('c1');
      expect(result.id).toBe('c1');
    });
  });

  describe('retry / regenerate / revoke error mapping', () => {
    it('retry() maps a NOT_FOUND repository error', async () => {
      repository.queue.mockRejectedValueOnce(
        new Error('CERTIFICATE_NOT_FOUND'),
      );
      await expect(service.retry('admin-1', 'c1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retry() maps a REVOKED repository error to ConflictException', async () => {
      repository.queue.mockRejectedValueOnce(new Error('STATUS_REVOKED'));
      await expect(service.retry('admin-1', 'c1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('retry() succeeds and calls queue with "retry"', async () => {
      repository.queue.mockResolvedValueOnce({ id: 'c1', status: 'QUEUED' });
      const result = await service.retry('admin-1', 'c1');
      expect(repository.queue).toHaveBeenCalledWith('admin-1', 'c1', 'retry');
      expect(result).toEqual({ id: 'c1', status: 'QUEUED' });
    });

    it('regenerate() trims the reason and maps NOT_ELIGIBLE errors', async () => {
      repository.queue.mockRejectedValueOnce(
        new Error('CERTIFICATE_NOT_ELIGIBLE'),
      );
      await expect(
        service.regenerate('admin-1', 'c1', {
          reason: '  Data fix  ',
        } as never),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(repository.queue).toHaveBeenCalledWith(
        'admin-1',
        'c1',
        'regenerate',
        'Data fix',
      );
    });

    it('revoke() notifies the student and returns the repository result', async () => {
      repository.admin.mockResolvedValueOnce({
        studentId: 'student-1',
        studentEmail: 'ada@example.com',
        studentName: 'Ada',
        courseTitle: 'CS101',
        certificateNumber: 'JTA-1',
      });
      repository.revoke.mockResolvedValueOnce({ id: 'c1', status: 'REVOKED' });
      const result = await service.revoke('admin-1', 'c1', ' fraud ');
      expect(repository.revoke).toHaveBeenCalledWith('admin-1', 'c1', 'fraud');
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({ templateCode: 'CERTIFICATE_REVOKED' }),
      );
      expect(result).toEqual({ id: 'c1', status: 'REVOKED' });
    });

    it('revoke() skips the notification when the certificate cannot be looked up first', async () => {
      repository.admin.mockResolvedValueOnce(undefined);
      repository.revoke.mockResolvedValueOnce({ id: 'c1', status: 'REVOKED' });
      await service.revoke('admin-1', 'c1', 'reason');
      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('revoke() maps repository errors through the shared mapper', async () => {
      repository.admin.mockResolvedValueOnce(undefined);
      repository.revoke.mockRejectedValueOnce(
        new Error('CERTIFICATE_NOT_FOUND'),
      );
      await expect(service.revoke('admin-1', 'c1', 'reason')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('adminDownload / fileDownload', () => {
    it('adminDownload verifies existence, then returns a signed URL', async () => {
      repository.admin.mockResolvedValueOnce({
        id: 'c1',
        verificationToken: 't',
      });
      repository.currentFile.mockResolvedValueOnce({
        storageKey: 'k1',
        originalFileName: 'cert.pdf',
      });
      storage.getSignedUrl.mockResolvedValueOnce('https://signed/cert.pdf');
      const result = await service.adminDownload('c1');
      expect(result.url).toBe('https://signed/cert.pdf');
    });

    it('adminDownload throws NotFoundException when the certificate does not exist', async () => {
      repository.admin.mockResolvedValueOnce(undefined);
      await expect(service.adminDownload('c1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('download throws NotFoundException when no current file exists', async () => {
      repository.admin.mockResolvedValueOnce({
        id: 'c1',
        verificationToken: 't',
      });
      repository.currentFile.mockResolvedValueOnce(undefined);
      await expect(service.adminDownload('c1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('signed() maps a storage failure to ServiceUnavailableException', async () => {
      repository.admin.mockResolvedValueOnce({
        id: 'c1',
        verificationToken: 't',
      });
      repository.currentFile.mockResolvedValueOnce({
        storageKey: 'k1',
        originalFileName: 'cert.pdf',
      });
      storage.getSignedUrl.mockRejectedValueOnce(new Error('storage down'));
      await expect(service.adminDownload('c1')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('fileDownload throws NotFoundException for a missing file', async () => {
      repository.file.mockResolvedValueOnce(undefined);
      await expect(service.fileDownload('c1', 'f1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('fileDownload returns a signed URL for an existing file', async () => {
      repository.file.mockResolvedValueOnce({
        storageKey: 'k1',
        originalFileName: 'cert.pdf',
      });
      storage.getSignedUrl.mockResolvedValueOnce('https://signed/cert.pdf');
      const result = await service.fileDownload('c1', 'f1');
      expect(result.fileName).toBe('cert.pdf');
    });
  });

  it('files() and events() delegate to the repository', () => {
    service.files('c1');
    expect(repository.files).toHaveBeenCalledWith('c1');
    service.events('c1');
    expect(repository.events).toHaveBeenCalledWith('c1');
  });

  describe('templates', () => {
    it('strips templateStorageKey from every listed template', async () => {
      repository.templates.mockResolvedValueOnce([
        { id: 't1', templateStorageKey: 'secret-key' },
      ]);
      const [result] = await service.templates();
      expect(result).not.toHaveProperty('templateStorageKey');
    });

    it('template() throws NotFoundException for a missing template', async () => {
      repository.template.mockResolvedValueOnce(undefined);
      await expect(service.template('t1')).rejects.toThrow(NotFoundException);
    });

    it('template() strips templateStorageKey', async () => {
      repository.template.mockResolvedValueOnce({
        id: 't1',
        templateStorageKey: 'secret-key',
      });
      const result = await service.template('t1');
      expect(result).not.toHaveProperty('templateStorageKey');
    });
  });

  describe('createTemplate / updateTemplate / activateTemplate', () => {
    it('rejects a configuration with an unsupported key', () => {
      expect(() =>
        service.createTemplate('admin-1', {
          configuration: { unknownField: 'x' },
        } as never),
      ).toThrow(UnprocessableEntityException);
    });

    it('rejects a non-string configuration value', () => {
      expect(() =>
        service.createTemplate('admin-1', {
          configuration: { title: 123 as never },
        } as never),
      ).toThrow(UnprocessableEntityException);
    });

    it('rejects a configuration value containing a script or path traversal payload', () => {
      expect(() =>
        service.createTemplate('admin-1', {
          configuration: { title: '<script>alert(1)</script>' },
        } as never),
      ).toThrow(UnprocessableEntityException);
    });

    it('rejects a color field that is not a hex color', () => {
      expect(() =>
        service.createTemplate('admin-1', {
          configuration: { primaryColor: 'blue' },
        } as never),
      ).toThrow(UnprocessableEntityException);
    });

    it('accepts a valid configuration and delegates to the repository', () => {
      repository.createTemplate.mockReturnValueOnce({ id: 't1' });
      const result = service.createTemplate('admin-1', {
        configuration: { title: 'Certificate', primaryColor: '#112233' },
      } as never);
      expect(repository.createTemplate).toHaveBeenCalledWith(
        'admin-1',
        expect.objectContaining({ configuration: expect.any(Object) }),
      );
      expect(result).toEqual({ id: 't1' });
    });

    it('updateTemplate validates configuration only when provided', () => {
      repository.updateTemplate.mockReturnValueOnce({ id: 't1' });
      service.updateTemplate('t1', {} as never);
      expect(repository.updateTemplate).toHaveBeenCalledWith('t1', {});

      expect(() =>
        service.updateTemplate('t1', {
          configuration: { title: '<script>' },
        } as never),
      ).toThrow(UnprocessableEntityException);
    });

    it('activateTemplate delegates to the repository', () => {
      service.activateTemplate('t1', true);
      expect(repository.activateTemplate).toHaveBeenCalledWith('t1', true);
    });
  });
});

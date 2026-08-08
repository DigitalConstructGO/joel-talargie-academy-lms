import { generateCertificatePdf } from '../../generators/certificate.generator';
import { CertificateWorkerService } from '../certificate-worker.service';

jest.mock('../../generators/certificate.generator', () => ({
  generateCertificatePdf: jest.fn(),
}));

describe('CertificateWorkerService', () => {
  const configValues: Record<string, unknown> = {
    CERTIFICATE_WORKER_ENABLED: true,
    CERTIFICATE_WORKER_BATCH_SIZE: 2,
    CERTIFICATE_PUBLIC_BASE_URL: 'https://verify.example.com',
    CERTIFICATE_JOB_MAX_ATTEMPTS: 5,
    CERTIFICATE_JOB_LOCK_TIMEOUT_MS: 300000,
  };
  const config = { get: jest.fn((key: string) => configValues[key]) };
  const storage = { upload: jest.fn(), delete: jest.fn() };
  const notifications = { notify: jest.fn().mockResolvedValue(undefined) };

  function txMock() {
    return {
      execute: jest.fn(),
      query: { certificates: { findFirst: jest.fn() } },
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue(undefined),
    };
  }

  function selectChain(row: unknown) {
    return {
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(row ? [row] : []),
    };
  }

  const database = {
    client: {
      transaction: jest.fn(),
      select: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: CertificateWorkerService;
  const validPdf = Buffer.from('%PDF-' + '0'.repeat(120));

  const certificateRow = {
    id: 'cert-1',
    enrollmentId: 'enr-1',
    status: 'PENDING',
    number: 'CERT-0001',
    token: 'verify-token',
    studentName: 'Ada Lovelace',
    courseTitle: 'Intro to CS',
    completionDate: new Date('2026-08-01'),
    generationVersion: 1,
    templateConfiguration: {},
    studentId: 'student-1',
    studentEmail: 'ada@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    configValues.CERTIFICATE_WORKER_ENABLED = true;
    (generateCertificatePdf as jest.Mock).mockResolvedValue(validPdf);
    database.client.update.mockReturnValue({
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(undefined),
    });
    service = new CertificateWorkerService(
      database as never,
      config as never,
      storage as never,
      notifications as never,
    );
  });

  it('does nothing and returns 0 when the worker is disabled', async () => {
    configValues.CERTIFICATE_WORKER_ENABLED = false;
    const result = await service.tick();
    expect(result).toBe(0);
    expect(database.client.transaction).not.toHaveBeenCalled();
  });

  it('recovers stale locks before claiming jobs', async () => {
    const claimTx = txMock();
    claimTx.execute.mockResolvedValueOnce({ rows: [] });
    database.client.transaction.mockImplementationOnce(
      async (cb: (tx: unknown) => unknown) => cb(claimTx),
    );
    await service.tick();
    expect(database.client.update).toHaveBeenCalled();
  });

  it('claims and successfully generates a certificate, uploads the PDF, and marks the job completed', async () => {
    const claimTx = txMock();
    claimTx.execute.mockResolvedValueOnce({
      rows: [{ id: 'job-1', certificateId: 'cert-1', attempts: 1 }],
    });
    const processTx = txMock();
    processTx.query.certificates.findFirst.mockResolvedValueOnce({
      status: 'PENDING',
      generationVersion: 1,
      issuedAt: null,
    });
    database.client.transaction
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(claimTx),
      )
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(processTx),
      );
    database.client.select.mockReturnValueOnce(selectChain(certificateRow));

    const result = await service.tick();

    expect(storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'application/pdf' }),
    );
    expect(processTx.insert).toHaveBeenCalled();
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        templateCode: 'CERTIFICATE_READY',
        userId: 'student-1',
      }),
    );
    expect(result).toBe(1);
  });

  it('fails the job when the certificate is not in a PENDING state, without uploading anything', async () => {
    const claimTx = txMock();
    claimTx.execute.mockResolvedValueOnce({
      rows: [{ id: 'job-1', certificateId: 'cert-1', attempts: 1 }],
    });
    const failTx = txMock();
    database.client.transaction
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(claimTx),
      )
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(failTx),
      );
    database.client.select.mockReturnValueOnce(
      selectChain({ ...certificateRow, status: 'GENERATED' }),
    );

    await service.tick();

    expect(storage.upload).not.toHaveBeenCalled();
    expect(failTx.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'FAILED' }),
    );
  });

  it('rolls back the uploaded file when the certificate state changes mid-generation', async () => {
    const claimTx = txMock();
    claimTx.execute.mockResolvedValueOnce({
      rows: [{ id: 'job-1', certificateId: 'cert-1', attempts: 1 }],
    });
    const processTx = txMock();
    processTx.query.certificates.findFirst.mockResolvedValueOnce({
      status: 'GENERATED', // state changed since it was read
      generationVersion: 1,
      issuedAt: null,
    });
    const failTx = txMock();
    database.client.transaction
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(claimTx),
      )
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(processTx),
      )
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(failTx),
      );
    database.client.select.mockReturnValueOnce(selectChain(certificateRow));

    await service.tick();

    expect(storage.delete).toHaveBeenCalled();
    expect(failTx.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING' }),
    );
  });

  it('retries (non-terminal) a transient failure below the max attempt count', async () => {
    storage.upload.mockRejectedValueOnce(
      new Error('storage temporarily unavailable'),
    );
    const claimTx = txMock();
    claimTx.execute.mockResolvedValueOnce({
      rows: [{ id: 'job-1', certificateId: 'cert-1', attempts: 1 }],
    });
    const failTx = txMock();
    database.client.transaction
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(claimTx),
      )
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(failTx),
      );
    database.client.select.mockReturnValueOnce(selectChain(certificateRow));

    await service.tick();

    expect(failTx.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING' }),
    );
  });

  it('terminally fails once the maximum attempt count is reached', async () => {
    const claimTx = txMock();
    claimTx.execute.mockResolvedValueOnce({
      rows: [{ id: 'job-1', certificateId: 'cert-1', attempts: 5 }],
    });
    const failTx = txMock();
    database.client.transaction
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(claimTx),
      )
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(failTx),
      );
    database.client.select.mockReturnValueOnce(selectChain(undefined));

    await service.tick();

    expect(failTx.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'FAILED' }),
    );
  });

  it('fails the job when the generated PDF is invalid', async () => {
    (generateCertificatePdf as jest.Mock).mockResolvedValueOnce(
      Buffer.from('not-a-pdf'),
    );
    const claimTx = txMock();
    claimTx.execute.mockResolvedValueOnce({
      rows: [{ id: 'job-1', certificateId: 'cert-1', attempts: 1 }],
    });
    const failTx = txMock();
    database.client.transaction
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(claimTx),
      )
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(failTx),
      );
    database.client.select.mockReturnValueOnce(selectChain(certificateRow));

    await service.tick();

    expect(storage.upload).not.toHaveBeenCalled();
    expect(failTx.where).toHaveBeenCalled();
  });

  it('claims no jobs and returns 0 when the queue is empty', async () => {
    const claimTx = txMock();
    claimTx.execute.mockResolvedValueOnce({ rows: [] });
    database.client.transaction.mockImplementationOnce(
      async (cb: (tx: unknown) => unknown) => cb(claimTx),
    );
    const result = await service.tick();
    expect(result).toBe(0);
    expect(database.client.select).not.toHaveBeenCalled();
  });
});

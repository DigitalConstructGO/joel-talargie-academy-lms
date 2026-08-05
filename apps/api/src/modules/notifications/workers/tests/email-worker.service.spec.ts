import { EmailWorkerService } from '../email-worker.service';

describe('EmailWorkerService', () => {
  const configValues: Record<string, unknown> = {
    EMAIL_WORKER_ENABLED: true,
    EMAIL_WORKER_ID: 'worker-1',
    EMAIL_WORKER_BATCH_SIZE: 5,
    EMAIL_WORKER_LOCK_TIMEOUT_MS: 60000,
    EMAIL_INITIAL_RETRY_DELAY_SECONDS: 30,
    EMAIL_MAX_RETRY_DELAY_SECONDS: 3600,
  };
  const config = { get: jest.fn((key: string) => configValues[key]) };
  const mail = { sendMail: jest.fn() };

  function txMock() {
    return {
      execute: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue(undefined),
    };
  }

  const database = {
    client: {
      transaction: jest.fn(),
      execute: jest.fn(),
      insert: jest.fn(),
    },
  };

  let service: EmailWorkerService;

  beforeEach(() => {
    jest.clearAllMocks();
    configValues.EMAIL_WORKER_ENABLED = true;
    database.client.insert.mockReturnValue({
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 'attempt-1' }]),
    });
    service = new EmailWorkerService(
      database as never,
      mail as never,
      config as never,
    );
  });

  it('does nothing and returns 0 when the worker is disabled', async () => {
    configValues.EMAIL_WORKER_ENABLED = false;
    const result = await service.tick();
    expect(result).toBe(0);
    expect(database.client.transaction).not.toHaveBeenCalled();
  });

  it('recovers stale locks, claims jobs, processes each, and returns the claimed count', async () => {
    database.client.execute.mockResolvedValueOnce(undefined); // recoverStale
    const claimTx = txMock();
    claimTx.execute.mockResolvedValueOnce({
      rows: [
        {
          id: 'delivery-1',
          recipientEmail: 'a@b.com',
          subject: 'Hi',
          text: 'text',
          html: '<p>html</p>',
          attempt: 1,
          maximumAttempts: 5,
          userId: 'user-1',
        },
      ],
    });
    const processTx = txMock();
    database.client.transaction
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(claimTx),
      )
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(processTx),
      );
    mail.sendMail.mockResolvedValueOnce({
      status: 'sent',
      messageId: 'msg-1',
    });

    const result = await service.tick();

    expect(database.client.execute).toHaveBeenCalledTimes(1);
    expect(claimTx.execute).toHaveBeenCalledTimes(1);
    expect(mail.sendMail).toHaveBeenCalledWith({
      to: 'a@b.com',
      subject: 'Hi',
      text: 'text',
      html: '<p>html</p>',
    });
    expect(processTx.insert).toHaveBeenCalled();
    expect(result).toBe(1);
  });

  it('suppresses the delivery when mail is disabled', async () => {
    database.client.execute.mockResolvedValueOnce(undefined);
    const claimTx = txMock();
    claimTx.execute.mockResolvedValueOnce({
      rows: [
        {
          id: 'delivery-1',
          recipientEmail: 'a@b.com',
          subject: 'Hi',
          text: 't',
          html: 'h',
          attempt: 1,
          maximumAttempts: 5,
          userId: null,
        },
      ],
    });
    const suppressTx = txMock();
    database.client.transaction
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(claimTx),
      )
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(suppressTx),
      );
    mail.sendMail.mockResolvedValueOnce({ status: 'disabled' });

    await service.tick();

    expect(suppressTx.update).toHaveBeenCalledTimes(2);
    expect(suppressTx.set).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ status: 'SUPPRESSED' }),
    );
  });

  it('marks a delivery for retry on a temporary SMTP failure below the retry limit', async () => {
    database.client.execute.mockResolvedValueOnce(undefined);
    const claimTx = txMock();
    claimTx.execute.mockResolvedValueOnce({
      rows: [
        {
          id: 'delivery-1',
          recipientEmail: 'a@b.com',
          subject: 'Hi',
          text: 't',
          html: 'h',
          attempt: 1,
          maximumAttempts: 5,
          userId: null,
        },
      ],
    });
    const failTx = txMock();
    database.client.transaction
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(claimTx),
      )
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(failTx),
      );
    mail.sendMail.mockResolvedValueOnce({ status: 'failed' });

    await service.tick();

    expect(failTx.set).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ status: 'TEMPORARY_FAILURE' }),
    );
    expect(failTx.set).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ status: 'RETRY_SCHEDULED' }),
    );
  });

  it('marks a delivery FAILED (terminal) when a permanent SMTP error is thrown', async () => {
    database.client.execute.mockResolvedValueOnce(undefined);
    const claimTx = txMock();
    claimTx.execute.mockResolvedValueOnce({
      rows: [
        {
          id: 'delivery-1',
          recipientEmail: 'a@b.com',
          subject: 'Hi',
          text: 't',
          html: 'h',
          attempt: 1,
          maximumAttempts: 5,
          userId: null,
        },
      ],
    });
    const failTx = txMock();
    database.client.transaction
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(claimTx),
      )
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(failTx),
      );
    mail.sendMail.mockRejectedValueOnce(new Error('550 mailbox unavailable'));

    await service.tick();

    expect(failTx.set).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ status: 'PERMANENT_FAILURE' }),
    );
    expect(failTx.set).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ status: 'FAILED' }),
    );
  });

  it('marks a delivery FAILED (terminal) once the maximum attempt count is reached, even for a non-permanent error', async () => {
    database.client.execute.mockResolvedValueOnce(undefined);
    const claimTx = txMock();
    claimTx.execute.mockResolvedValueOnce({
      rows: [
        {
          id: 'delivery-1',
          recipientEmail: 'a@b.com',
          subject: 'Hi',
          text: 't',
          html: 'h',
          attempt: 5,
          maximumAttempts: 5,
          userId: null,
        },
      ],
    });
    const failTx = txMock();
    database.client.transaction
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(claimTx),
      )
      .mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
        cb(failTx),
      );
    mail.sendMail.mockRejectedValueOnce(new Error('connection reset'));

    await service.tick();

    expect(failTx.set).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ status: 'FAILED' }),
    );
  });

  it('does not process any deliveries when none are claimed', async () => {
    database.client.execute.mockResolvedValueOnce(undefined);
    const claimTx = txMock();
    claimTx.execute.mockResolvedValueOnce({ rows: [] });
    database.client.transaction.mockImplementationOnce(
      async (cb: (tx: unknown) => unknown) => cb(claimTx),
    );
    const result = await service.tick();
    expect(result).toBe(0);
    expect(mail.sendMail).not.toHaveBeenCalled();
  });
});

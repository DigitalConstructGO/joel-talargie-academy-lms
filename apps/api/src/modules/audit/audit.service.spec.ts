import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  it('sanitizes sensitive fields before persistence', async () => {
    const repository = {
      create: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuditRepository;
    await new AuditService(repository).logCreate('user', 'id-1', {
      email: 'a@example.com',
      password: 'secret',
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ newData: { email: 'a@example.com' } }),
    );
  });
});

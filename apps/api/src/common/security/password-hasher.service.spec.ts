import { ConfigService } from '@nestjs/config';
import { PasswordHasherService } from './password-hasher.service';
describe('PasswordHasherService', () => {
  const service = new PasswordHasherService(
    new ConfigService({ BCRYPT_SALT_ROUNDS: 10 }),
  );
  it('hashes and verifies a password', async () => {
    const password = 'Strong example password';
    const hash = await service.hashPassword(password);
    expect(hash).not.toBe(password);
    await expect(service.verifyPassword(password, hash)).resolves.toBe(true);
    await expect(service.verifyPassword('wrong', hash)).resolves.toBe(false);
  });
  it('creates unique salted hashes', async () => {
    const [a, b] = await Promise.all([
      service.hashPassword('same'),
      service.hashPassword('same'),
    ]);
    expect(a).not.toBe(b);
  });
  it('rejects invalid rounds', () =>
    expect(
      () =>
        new PasswordHasherService(new ConfigService({ BCRYPT_SALT_ROUNDS: 9 })),
    ).toThrow(/between 10 and 14/));
  it('rejects empty passwords', async () =>
    await expect(service.hashPassword('')).rejects.toThrow(/empty/));
});

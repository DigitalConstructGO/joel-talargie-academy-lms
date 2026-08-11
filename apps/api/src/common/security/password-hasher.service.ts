import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
@Injectable()
export class PasswordHasherService {
  private readonly saltRounds: number;
  constructor(config: ConfigService) {
    const value = config.get<number | string>('BCRYPT_SALT_ROUNDS', 12);
    this.saltRounds = Number(value);
    if (
      !Number.isInteger(this.saltRounds) ||
      this.saltRounds < 10 ||
      this.saltRounds > 14
    )
      throw new Error(
        'BCRYPT_SALT_ROUNDS must be an integer between 10 and 14',
      );
  }
  async hashPassword(plainPassword: string): Promise<string> {
    if (!plainPassword) throw new Error('Password must not be empty');
    return bcrypt.hash(plainPassword, this.saltRounds);
  }
  async verifyPassword(
    plainPassword: string,
    passwordHash: string,
  ): Promise<boolean> {
    if (!plainPassword) throw new Error('Password must not be empty');
    return bcrypt.compare(plainPassword, passwordHash);
  }
}

import { randomInt } from 'node:crypto';
import {
  COUPON_CODE_ALPHABET,
  COUPON_CODE_AMBIGUOUS_CHARS,
} from '../constants/promotion.constants';

export interface CouponCodeOptions {
  length?: number;
  prefix?: string;
  suffix?: string;
  excludeAmbiguous?: boolean;
}

/** Coupon codes are always compared case-insensitively - this is the single source of truth for normalization. */
export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

function alphabetFor(excludeAmbiguous: boolean): string {
  if (!excludeAmbiguous)
    return COUPON_CODE_ALPHABET + COUPON_CODE_AMBIGUOUS_CHARS;
  return COUPON_CODE_ALPHABET;
}

/** Uses crypto.randomInt (CSPRNG, unbiased) - never Math.random() - for unguessable codes. */
export function generateSecureCode(options: CouponCodeOptions = {}): string {
  const length = options.length ?? 10;
  const alphabet = alphabetFor(options.excludeAmbiguous ?? true);
  let body = '';
  for (let i = 0; i < length; i += 1)
    body += alphabet[randomInt(alphabet.length)];
  const prefix = options.prefix ? normalizeCouponCode(options.prefix) : '';
  const suffix = options.suffix ? normalizeCouponCode(options.suffix) : '';
  return normalizeCouponCode(`${prefix}${body}${suffix}`);
}

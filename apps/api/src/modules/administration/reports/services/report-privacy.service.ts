import { Injectable } from '@nestjs/common';
const secret =
  /(password|token|secret|authorization|cookie|database.?url|smtp|storage.?key)/i;
@Injectable()
export class ReportPrivacyService {
  maskEmail(email: string | null) {
    if (!email) return null;
    const [a, d = ''] = email.split('@');
    return `${a.slice(0, 1)}***@${d}`;
  }
  maskIp(ip: string | null) {
    if (!ip) return null;
    return ip.includes(':')
      ? `${ip.split(':').slice(0, 2).join(':')}:…`
      : `${ip.split('.').slice(0, 2).join('.')}.*.*`;
  }
  sanitize(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((v) => this.sanitize(v));
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [
          k,
          secret.test(k) ? '[REDACTED]' : this.sanitize(v),
        ]),
      );
    return value;
  }
  spreadsheet(value: unknown) {
    const text = value == null ? '' : String(value);
    return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  }
}

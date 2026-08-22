import { ConfigService } from '@nestjs/config';
import { GeezSmsProvider } from '../providers/geez-sms.provider';
import { LoggerSmsProvider } from '../providers/logger-sms.provider';
import { SmsService } from '../sms.service';

describe('SmsService', () => {
  const createService = (configMap: Record<string, unknown> = {}) => {
    const config = {
      get: (key: string) => configMap[key] ?? undefined,
    } as unknown as ConfigService;

    const geezProvider = new GeezSmsProvider(config as any);
    const loggerProvider = new LoggerSmsProvider();
    const service = new SmsService(config as any, geezProvider, loggerProvider);

    return { service, geezProvider, loggerProvider };
  };

  describe('formatGeezPhoneNumber', () => {
    const { service } = createService();

    it('formats local 09... numbers into 2519...', () => {
      expect(service.formatGeezPhoneNumber('0911234567')).toBe('251911234567');
      expect(service.formatGeezPhoneNumber('0912 34 56 78')).toBe(
        '251912345678',
      );
    });

    it('formats local 07... numbers into 2517...', () => {
      expect(service.formatGeezPhoneNumber('0711234567')).toBe('251711234567');
    });

    it('strips leading + from international +251...', () => {
      expect(service.formatGeezPhoneNumber('+251911234567')).toBe(
        '251911234567',
      );
      expect(service.formatGeezPhoneNumber('+251711234567')).toBe(
        '251711234567',
      );
    });

    it('handles 9-digit local numbers without leading 0', () => {
      expect(service.formatGeezPhoneNumber('911234567')).toBe('251911234567');
    });

    it('returns null for empty or invalid numbers', () => {
      expect(service.formatGeezPhoneNumber('')).toBeNull();
      expect(service.formatGeezPhoneNumber('abc')).toBeNull();
    });
  });

  describe('sendSms', () => {
    it('suppresses SMS if SMS_ENABLED is false', async () => {
      const { service } = createService({ SMS_ENABLED: false });
      const result = await service.sendSms({
        recipientPhone: '0911234567',
        messageText: 'Test SMS',
        templateCode: 'TEST',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMS_DISABLED');
    });

    it('uses LoggerSmsProvider in logger mode', async () => {
      const { service } = createService({
        SMS_ENABLED: true,
        SMS_PROVIDER: 'logger',
      });

      const result = await service.sendSms({
        recipientPhone: '0911234567',
        messageText: 'Hello from Logger',
        templateCode: 'TEST',
      });

      expect(result.success).toBe(true);
      expect(result.providerMessageId).toContain('logger-');
    });
  });
});

import { UnprocessableEntityException } from '@nestjs/common';
import { EmailRenderingService } from '../services/email-rendering.service';

describe('EmailRenderingService', () => {
  const service = new EmailRenderingService();
  const template = {
    code: 'PAYMENT_DECLINED',
    subjectTemplate: 'Payment update for {{courseTitle}}',
    htmlTemplate: '<p>Hello {{recipientName}}</p><p>{{declineReason}}</p>',
    textTemplate: 'Hello {{recipientName}}\n{{declineReason}}',
  };
  const variables = {
    recipientName: '<img src=x onerror=alert(1)>',
    courseTitle: 'Safe Course',
    declineReason: '<script>unsafe()</script>',
    paymentUrl: 'https://academy.example/payments',
    academyName: 'Academy',
  };
  it('escapes every HTML variable and produces a plain-text alternative', () => {
    const rendered = service.render(template, variables);
    expect(rendered.html).toContain('&lt;script&gt;');
    expect(rendered.html).not.toContain('<script>');
    expect(rendered.text).toContain('<script>unsafe()</script>');
    expect(rendered.subject).toBe('Payment update for Safe Course');
  });
  it('rejects missing, unknown, and header-injection placeholders', () => {
    expect(() =>
      service.render(template, {
        ...variables,
        recipientName: undefined as never,
      }),
    ).toThrow(UnprocessableEntityException);
    expect(() =>
      service.render({ ...template, htmlTemplate: '{{unknown}}' }, variables),
    ).toThrow(UnprocessableEntityException);
    expect(() =>
      service.render(
        { ...template, subjectTemplate: 'Safe\r\nBcc: attacker@example.com' },
        variables,
      ),
    ).toThrow(UnprocessableEntityException);
  });
});

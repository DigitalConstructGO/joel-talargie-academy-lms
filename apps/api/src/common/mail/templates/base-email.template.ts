import {
  DEFAULT_SUPPORT_EMAIL,
  PRODUCTION_DOMAIN_PLACEHOLDER,
} from '../mail.constants';

export interface BaseEmailTemplateOptions {
  title: string;
  content: string;
  textContent: string;
  callToAction?: { label: string; url: string };
  supportEmail?: string;
}

export interface EmailTemplate {
  html: string;
  text: string;
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

export function createBaseEmailTemplate(
  options: BaseEmailTemplateOptions,
): EmailTemplate {
  const supportEmail = options.supportEmail ?? DEFAULT_SUPPORT_EMAIL;
  const action = options.callToAction
    ? `<p style="margin:24px 0"><a href="${escapeHtml(options.callToAction.url)}" style="background:#18181b;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;display:inline-block">${escapeHtml(options.callToAction.label)}</a></p>`
    : '';
  const actionText = options.callToAction
    ? `\n\n${options.callToAction.label}: ${options.callToAction.url}`
    : '';

  return {
    html: `<!doctype html><html lang="en"><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b"><main style="max-width:600px;margin:0 auto;padding:32px 20px"><section style="background:#fff;border-radius:8px;padding:32px"><p style="font-weight:700">Joel Talargie Academy</p><h1 style="font-size:24px">${escapeHtml(options.title)}</h1><div>${options.content}</div>${action}</section><footer style="padding:20px;text-align:center;font-size:12px;color:#71717a">Need help? <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a><br><a href="${PRODUCTION_DOMAIN_PLACEHOLDER}">Academy website</a></footer></main></body></html>`,
    text: `Joel Talargie Academy\n\n${options.title}\n\n${options.textContent}${actionText}\n\nSupport: ${supportEmail}\n${PRODUCTION_DOMAIN_PLACEHOLDER}`,
  };
}

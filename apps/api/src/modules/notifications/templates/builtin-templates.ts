import {
  EMAIL_TEMPLATE_CONTENT,
  type EmailTemplateCode,
} from '@joel-academy/database';

export const BUILTIN_TEMPLATE_VERSION = 1;

export interface BuiltinTemplate {
  code: EmailTemplateCode;
  name: string;
  version: number;
  locale: string;
  description: string;
  isActive: true;
  subjectTemplate: string;
  htmlTemplate: string;
  textTemplate: string;
}

const titled = (code: string) =>
  code
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

/**
 * Resolves a code-defined system template. This is the fallback used by
 * `NotificationsService.notify()` when no active `email_templates` row exists,
 * so transactional emails never depend on a manual admin template being
 * seeded or created first.
 */
export function resolveBuiltinTemplate(
  code: string,
  locale: string,
): BuiltinTemplate | null {
  const content = EMAIL_TEMPLATE_CONTENT[code as EmailTemplateCode];
  if (!content || locale !== 'en') return null;
  return {
    code: code as EmailTemplateCode,
    name: titled(code),
    version: BUILTIN_TEMPLATE_VERSION,
    locale: 'en',
    description: `System transactional template for ${code}.`,
    isActive: true,
    subjectTemplate: content.subject,
    htmlTemplate: content.html,
    textTemplate: content.text,
  };
}

/** Number of system template codes available in code, regardless of seeding. */
export function builtinTemplateCount(): number {
  return Object.keys(EMAIL_TEMPLATE_CONTENT).length;
}

export function isBuiltinTemplateCode(code: string): boolean {
  return code in EMAIL_TEMPLATE_CONTENT;
}

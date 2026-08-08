import { MOCK_EMAIL_TEMPLATES } from './mock-email-templates.data';
import type {
  EmailTemplate,
  EmailTemplateDetail,
  TemplatePreviewResult,
} from '../types/email-template.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 404 };
  throw error;
}

function toSummary(template: EmailTemplateDetail): EmailTemplate {
  const { id, code, name, version, locale, isActive, description, updatedAt } = template;
  return { id, code, name, version, locale, isActive, description, updatedAt };
}

export const mockEmailTemplatesApi = {
  list: async (): Promise<EmailTemplate[]> => delay(MOCK_EMAIL_TEMPLATES.map(toSummary)),

  detail: async (templateId: string): Promise<EmailTemplateDetail> => {
    const template = MOCK_EMAIL_TEMPLATES.find((entry) => entry.id === templateId);
    if (!template) notFound('Email template not found');
    return delay(template);
  },

  preview: async (
    templateId: string,
    variables: Record<string, string>,
  ): Promise<TemplatePreviewResult> => {
    const template = MOCK_EMAIL_TEMPLATES.find((entry) => entry.id === templateId);
    if (!template) notFound('Email template not found');
    const fill = (text: string) =>
      text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => variables[key] ?? match);
    return delay({
      subject: fill(template.subjectTemplate),
      html: `<p>Preview rendering isn't available in demo mode - showing the subject only.</p>`,
      text: fill(template.subjectTemplate),
    });
  },
};

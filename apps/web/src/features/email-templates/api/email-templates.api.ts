import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockEmailTemplatesApi } from '../data/mock-email-templates.api';
import type {
  EmailTemplate,
  EmailTemplateDetail,
  TemplatePreviewResult,
} from '../types/email-template.types';

const liveEmailTemplatesApi = {
  list: async () => unwrap<EmailTemplate[]>(await authClient.get('/admin/email-templates')),

  detail: async (templateId: string) =>
    unwrap<EmailTemplateDetail>(
      await authClient.get(`/admin/email-templates/${encodeURIComponent(templateId)}`),
    ),

  preview: async (templateId: string, variables: Record<string, string>) =>
    unwrap<TemplatePreviewResult>(
      await authClient.post(`/admin/email-templates/${encodeURIComponent(templateId)}/preview`, {
        variables,
      }),
    ),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. Read-only on purpose - the backend has no create/update/activate endpoint for email templates. */
export const emailTemplatesApi =
  CATALOG_DATA_SOURCE === 'live' ? liveEmailTemplatesApi : mockEmailTemplatesApi;

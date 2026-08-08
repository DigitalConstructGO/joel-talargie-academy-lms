'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { emailTemplatesApi } from '../api/email-templates.api';

const emailTemplateKeys = {
  all: ['email-templates'] as const,
  lists: () => [...emailTemplateKeys.all, 'list'] as const,
  detail: (templateId: string) => [...emailTemplateKeys.all, 'detail', templateId] as const,
};

export function useEmailTemplates() {
  return useQuery({ queryKey: emailTemplateKeys.lists(), queryFn: () => emailTemplatesApi.list() });
}

export function useEmailTemplate(templateId: string) {
  return useQuery({
    queryKey: emailTemplateKeys.detail(templateId),
    queryFn: () => emailTemplatesApi.detail(templateId),
    enabled: Boolean(templateId),
  });
}

export function usePreviewEmailTemplate() {
  return useMutation({
    mutationFn: ({
      templateId,
      variables,
    }: {
      templateId: string;
      variables: Record<string, string>;
    }) => emailTemplatesApi.preview(templateId, variables),
  });
}

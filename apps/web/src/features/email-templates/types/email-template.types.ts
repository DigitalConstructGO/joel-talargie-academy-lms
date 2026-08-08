export interface EmailTemplate {
  id: string;
  code: string;
  name: string;
  version: number;
  locale: string;
  isActive: boolean;
  description: string | null;
  updatedAt: string;
}

export interface EmailTemplateDetail {
  id: string;
  code: string;
  name: string;
  subjectTemplate: string;
  version: number;
  locale: string;
  isActive: boolean;
  isSystem: boolean;
  description: string | null;
  createdBy: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  placeholders: string[];
  hasHtml: boolean;
  hasText: boolean;
}

export interface TemplatePreviewResult {
  subject: string;
  html: string;
  text: string;
}

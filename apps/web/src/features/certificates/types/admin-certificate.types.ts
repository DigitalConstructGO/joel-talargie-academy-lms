import type { CertificateStatus } from './certificate.types';

export interface AdminCertificate {
  id: string;
  enrollmentId: string;
  certificateNumber: string;
  status: CertificateStatus;
  studentId: string;
  studentEmail: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  completionDate: string | null;
  templateId: string | null;
  templateName: string | null;
  templateVersion: number | null;
  issuedAt: string | null;
  generatedAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  generationVersion: number;
  failureCode: string | null;
  failureMessage: string | null;
  createdAt: string;
  verificationUrl: string | null;
}

/** `GET /admin/certificates` returns a bare array - no `total` - same "load more" shape as admin payments. */
export type AdminCertificateListResult = AdminCertificate[];

export interface AdminCertificateListParams {
  page?: number;
  pageSize?: number;
  status?: CertificateStatus;
  courseId?: string;
  search?: string;
}

export interface CertificateFileEntry {
  id: string;
  originalFileName: string;
  createdAt: string;
}

export interface CertificateEventEntry {
  id: string;
  action: string;
  createdAt: string;
}

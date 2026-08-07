export type CertificateStatus = 'PENDING' | 'GENERATED' | 'FAILED' | 'REVOKED';

export interface Certificate {
  id: string;
  certificateNumber: string;
  status: CertificateStatus;
  studentName: string;
  courseTitle: string;
  courseId: string;
  completionDate: string | null;
  issuedAt: string | null;
  generatedAt: string | null;
  revokedAt: string | null;
  generationVersion: number;
  createdAt: string;
  downloadAvailable: boolean;
  verificationUrl: string | null;
}

export interface CertificateListParams {
  page?: number;
  pageSize?: number;
  status?: CertificateStatus;
  courseId?: string;
  /** Accepted by the backend DTO but not applied server-side for the student list - filtered client-side instead. */
  search?: string;
}

/** `GET /me/certificates` returns a bare array - no `total` - same load-more pattern as payments/notifications. */
export type CertificateListResult = Certificate[];

export interface CertificateDownload {
  url: string;
  expiresInSeconds: number;
  fileName: string;
}

export interface CertificateRequestResult {
  created: boolean;
  certificate: { id: string; status: CertificateStatus };
}

export interface CertificateVerification {
  state: 'VALID' | 'REVOKED' | 'INVALID';
  certificateNumber?: string;
  studentName?: string;
  courseTitle?: string;
  completionDate?: string;
  issuedAt?: string;
}

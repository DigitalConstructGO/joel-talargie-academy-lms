import { MOCK_ADMIN_CERTIFICATES } from './mock-admin-certificates.data';
import type {
  AdminCertificate,
  AdminCertificateListParams,
  AdminCertificateListResult,
  CertificateEventEntry,
  CertificateFileEntry,
} from '../types/admin-certificate.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 404 };
  throw error;
}

const store: AdminCertificate[] = MOCK_ADMIN_CERTIFICATES.map((entry) => ({ ...entry }));

export const mockAdminCertificatesApi = {
  list: async (params: AdminCertificateListParams = {}): Promise<AdminCertificateListResult> => {
    const filtered = store.filter((certificate) => {
      if (params.status && certificate.status !== params.status) return false;
      if (params.courseId && certificate.courseId !== params.courseId) return false;
      if (params.search) {
        const needle = params.search.toLowerCase();
        if (
          !certificate.certificateNumber.toLowerCase().includes(needle) &&
          !certificate.studentEmail.toLowerCase().includes(needle) &&
          !certificate.courseTitle.toLowerCase().includes(needle)
        )
          return false;
      }
      return true;
    });
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return delay(filtered.slice(start, start + pageSize));
  },

  detail: async (certificateId: string): Promise<AdminCertificate> => {
    const certificate = store.find((entry) => entry.id === certificateId);
    if (!certificate) notFound('Certificate not found');
    return delay(certificate);
  },

  retry: async (certificateId: string): Promise<AdminCertificate> => {
    const certificate = store.find((entry) => entry.id === certificateId);
    if (!certificate) notFound('Certificate not found');
    certificate.status = 'PENDING';
    certificate.failureCode = null;
    certificate.failureMessage = null;
    return delay(certificate);
  },

  regenerate: async (certificateId: string, _reason: string): Promise<AdminCertificate> => {
    const certificate = store.find((entry) => entry.id === certificateId);
    if (!certificate) notFound('Certificate not found');
    certificate.status = 'PENDING';
    certificate.generationVersion += 1;
    return delay(certificate);
  },

  revoke: async (certificateId: string, reason: string): Promise<AdminCertificate> => {
    const certificate = store.find((entry) => entry.id === certificateId);
    if (!certificate) notFound('Certificate not found');
    certificate.status = 'REVOKED';
    certificate.revokedAt = new Date().toISOString();
    certificate.revocationReason = reason;
    return delay(certificate);
  },

  download: async (certificateId: string) => {
    const certificate = store.find((entry) => entry.id === certificateId);
    if (!certificate) notFound('Certificate not found');
    return delay({
      url: '/images/hero/network-abstract.jpg',
      expiresInSeconds: 300,
      fileName: `${certificate.certificateNumber}.pdf`,
    });
  },

  files: async (_certificateId: string): Promise<CertificateFileEntry[]> => delay([]),
  events: async (_certificateId: string): Promise<CertificateEventEntry[]> => delay([]),
};

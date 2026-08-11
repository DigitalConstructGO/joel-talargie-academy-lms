import { MOCK_ENROLLMENTS } from '@/features/enrollments/data/mock-enrollments.data';
import { MOCK_CERTIFICATE_SEEDS, type CertificateSeed } from './mock-certificates.data';
import type {
  Certificate,
  CertificateDownload,
  CertificateListParams,
  CertificateListResult,
  CertificateRequestResult,
  CertificateVerification,
} from '../types/certificate.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 404 };
  throw error;
}

function forbidden(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 403 };
  throw error;
}

let store: CertificateSeed[] = MOCK_CERTIFICATE_SEEDS.map((seed) => ({
  enrollmentId: seed.enrollmentId,
  certificate: { ...seed.certificate },
}));

function filterCertificates(params: CertificateListParams) {
  return store
    .map((entry) => entry.certificate)
    .filter((certificate) => {
      if (params.status && certificate.status !== params.status) return false;
      if (params.courseId && certificate.courseId !== params.courseId) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const mockCertificatesApi = {
  listMine: async (params: CertificateListParams = {}): Promise<CertificateListResult> => {
    const filtered = filterCertificates(params);
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return delay(filtered.slice(start, start + pageSize));
  },

  detail: async (certificateId: string): Promise<Certificate> => {
    const entry = store.find((item) => item.certificate.id === certificateId);
    if (!entry) notFound('Certificate not found');
    return delay(entry.certificate);
  },

  download: async (certificateId: string, _inline = false): Promise<CertificateDownload> => {
    const entry = store.find((item) => item.certificate.id === certificateId);
    if (!entry) notFound('Certificate not found');
    if (entry.certificate.status !== 'GENERATED') forbidden('Certificate download is unavailable');
    return delay({
      url: '/images/hero/network-abstract.jpg',
      expiresInSeconds: 300,
      fileName: `certificate-${entry.certificate.certificateNumber}.jpg`,
    });
  },

  request: async (enrollmentId: string): Promise<CertificateRequestResult> => {
    const existing = store.find((item) => item.enrollmentId === enrollmentId);
    if (existing) {
      return delay({
        created: false,
        certificate: { id: existing.certificate.id, status: existing.certificate.status },
      });
    }
    const enrollment = MOCK_ENROLLMENTS.find((item) => item.id === enrollmentId);
    if (!enrollment) notFound('Enrollment not found');
    if (enrollment.status !== 'COMPLETED' || enrollment.progressPercentage !== 100) {
      const error = new Error('Certificate not eligible') as Error & {
        response?: { status: number };
      };
      error.response = { status: 422 };
      throw error;
    }
    const certificate: Certificate = {
      id: `certificate-${Date.now()}`,
      certificateNumber: `JTA-${new Date().getUTCFullYear()}-${Date.now().toString(16).toUpperCase()}`,
      status: 'PENDING',
      studentName: 'Demo Student',
      courseTitle: enrollment.courseTitle,
      courseId: enrollment.courseId,
      completionDate: enrollment.completedAt,
      issuedAt: null,
      generatedAt: null,
      revokedAt: null,
      generationVersion: 1,
      createdAt: new Date().toISOString(),
      downloadAvailable: false,
      verificationUrl: null,
    };
    store = [...store, { enrollmentId, certificate }];
    return delay({
      created: true,
      certificate: { id: certificate.id, status: certificate.status },
    });
  },

  verify: async (token: string): Promise<CertificateVerification> => {
    const entry = store.find((item) => item.certificate.verificationUrl?.endsWith(`/${token}`));
    if (!entry || !['GENERATED', 'REVOKED'].includes(entry.certificate.status)) {
      return delay({ state: 'INVALID' });
    }
    const { certificate } = entry;
    return delay({
      state: certificate.status === 'REVOKED' ? 'REVOKED' : 'VALID',
      certificateNumber: certificate.certificateNumber,
      studentName: certificate.studentName,
      courseTitle: certificate.courseTitle,
      completionDate: certificate.completionDate ?? undefined,
      issuedAt: certificate.issuedAt ?? undefined,
    });
  },
};

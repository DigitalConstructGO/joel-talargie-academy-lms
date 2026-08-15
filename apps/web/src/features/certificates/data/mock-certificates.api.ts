import {
  MOCK_CERTIFICATE_ENROLLMENTS,
  MOCK_CERTIFICATE_SEEDS,
  type CertificateSeed,
} from './mock-certificates.data';
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
    const entry =
      store.find((item) => item.certificate.id === certificateId) ??
      store.find((item) => item.enrollmentId === certificateId) ??
      store[0];
    if (!entry) notFound('Certificate not found');
    return delay(entry.certificate);
  },

  download: async (certificateId: string, _inline = false): Promise<CertificateDownload> => {
    const entry =
      store.find((item) => item.certificate.id === certificateId) ??
      store.find((item) => item.enrollmentId === certificateId) ??
      store[0];
    if (!entry) notFound('Certificate not found');
    if (entry.certificate.status !== 'GENERATED') forbidden('Certificate download is unavailable');
    const safeStudent = (entry.certificate.studentName || 'Student').replace(/[^A-Za-z0-9]/g, '_');
    const safeCourse = (entry.certificate.courseTitle || 'Course').replace(/[^A-Za-z0-9]/g, '_');
    return delay({
      url: '/sample-certificate.pdf',
      expiresInSeconds: 3600,
      fileName: `${safeStudent} - ${safeCourse} - JOEL TALARGIE ACADEMY.pdf`,
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
    const enrollment = MOCK_CERTIFICATE_ENROLLMENTS.find((item) => item.id === enrollmentId);
    const certificate: Certificate = {
      id: `certificate-${enrollmentId}`,
      certificateNumber: `JTA-${new Date().getUTCFullYear()}-${enrollmentId.replace('enrollment-', '').toUpperCase()}8F3C2A91`,
      status: 'GENERATED',
      studentName: 'Joel Talargie',
      courseTitle: enrollment?.courseTitle ?? 'Full-Stack Web Development Mastery',
      courseId: enrollment?.courseId ?? 'course-1',
      completionDate: new Date().toISOString(),
      issuedAt: new Date().toISOString(),
      generatedAt: new Date().toISOString(),
      revokedAt: null,
      generationVersion: 1,
      createdAt: new Date().toISOString(),
      downloadAvailable: true,
      verificationUrl:
        'http://localhost:3000/certificates/verify/mockVerificationToken0000000000000000000001',
    };
    store = [
      ...store,
      {
        enrollmentId,
        certificate,
      },
    ];
    return delay({
      created: true,
      certificate: { id: certificate.id, status: certificate.status },
    });
  },

  verify: async (tokenOrCode: string): Promise<CertificateVerification> => {
    const trimmed = (tokenOrCode ?? '').trim();
    if (!trimmed) return delay({ state: 'INVALID' });

    const entry = store.find((item) => {
      const { certificate } = item;
      const certNum = certificate.certificateNumber.toLowerCase();
      const searchTarget = trimmed.toLowerCase();
      return (
        certificate.verificationUrl?.endsWith(`/${trimmed}`) ||
        certificate.verificationUrl?.toLowerCase() === searchTarget ||
        certNum === searchTarget ||
        certNum.replace(/-/g, '') === searchTarget.replace(/-/g, '') ||
        certificate.id.toLowerCase() === searchTarget
      );
    });

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

import { MOCK_ENROLLMENTS } from '@/features/enrollments/data/mock-enrollments.data';
import type { Enrollment } from '@/features/enrollments/types/enrollment.types';
import type { Certificate } from '../types/certificate.types';

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** Links a certificate to the enrollment it was requested for - kept internal to the mock data layer only. */
export interface CertificateSeed {
  enrollmentId: string;
  certificate: Certificate;
}

function issuedCertificate(enrollment: Enrollment): CertificateSeed {
  return {
    enrollmentId: enrollment.id,
    certificate: {
      id: 'certificate-001',
      certificateNumber: 'JTA-2025-8F3C2A91B7D4E650',
      status: 'GENERATED',
      studentName: 'Demo Student',
      courseTitle: enrollment.courseTitle,
      courseId: enrollment.courseId,
      completionDate: enrollment.completedAt,
      issuedAt: daysAgo(55),
      generatedAt: daysAgo(55),
      revokedAt: null,
      generationVersion: 1,
      createdAt: daysAgo(60),
      downloadAvailable: true,
      verificationUrl:
        'http://localhost:3000/certificates/verify/mockVerificationToken0000000000000000000001',
    },
  };
}

function pendingCertificate(enrollment: Enrollment): CertificateSeed {
  return {
    enrollmentId: enrollment.id,
    certificate: {
      id: 'certificate-002',
      certificateNumber: 'JTA-2026-1A2B3C4D5E6F7089',
      status: 'PENDING',
      studentName: 'Demo Student',
      courseTitle: enrollment.courseTitle,
      courseId: enrollment.courseId,
      completionDate: enrollment.completedAt,
      issuedAt: null,
      generatedAt: null,
      revokedAt: null,
      generationVersion: 1,
      createdAt: daysAgo(5),
      downloadAvailable: false,
      verificationUrl: null,
    },
  };
}

const iosEnrollment = MOCK_ENROLLMENTS.find((entry) => entry.id === 'enrollment-006');
const pythonEnrollment = MOCK_ENROLLMENTS.find((entry) => entry.id === 'enrollment-007');

export const MOCK_CERTIFICATE_SEEDS: CertificateSeed[] = [
  iosEnrollment ? issuedCertificate(iosEnrollment) : null,
  pythonEnrollment ? pendingCertificate(pythonEnrollment) : null,
].filter((seed): seed is CertificateSeed => seed !== null);

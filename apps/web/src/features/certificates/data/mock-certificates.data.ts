import { MOCK_COURSE_RECORDS } from '@/features/catalog/data/build-mock-courses';
import type { Certificate } from '../types/certificate.types';

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** Links a certificate to the enrollment it was requested for - kept internal to the mock data layer only. */
export interface CertificateSeed {
  enrollmentId: string;
  certificate: Certificate;
}

export interface DemoCertificateEnrollment {
  id: string;
  courseTitle: string;
  courseId: string;
  completedAt: string | null;
  status: 'COMPLETED';
  progressPercentage: 100;
}

function demoEnrollment(
  courseIndex: number,
  id: string,
  completedDaysAgo: number,
): DemoCertificateEnrollment | null {
  const record = MOCK_COURSE_RECORDS[courseIndex];
  if (!record) return null;
  return {
    id,
    courseTitle: record.title,
    courseId: record.id,
    completedAt: daysAgo(completedDaysAgo),
    status: 'COMPLETED',
    progressPercentage: 100,
  };
}

export const MOCK_CERTIFICATE_ENROLLMENTS: DemoCertificateEnrollment[] = MOCK_COURSE_RECORDS.map(
  (record, index) => ({
    id: `enrollment-00${index + 1}`,
    courseTitle: record.title,
    courseId: record.id,
    completedAt: daysAgo(index * 3 + 1),
    status: 'COMPLETED' as const,
    progressPercentage: 100 as const,
  }),
);

function issuedCertificate(enrollment: DemoCertificateEnrollment, index: number): CertificateSeed {
  return {
    enrollmentId: enrollment.id,
    certificate: {
      id: `certificate-00${index + 1}`,
      certificateNumber: `JTA-${new Date().getUTCFullYear()}-${(index + 1).toString().padStart(2, '0')}${enrollment.id.replace('enrollment-', '').toUpperCase()}8F3C2A91`,
      status: 'GENERATED',
      studentName: 'Joel Talargie',
      courseTitle: enrollment.courseTitle,
      courseId: enrollment.courseId,
      completionDate: enrollment.completedAt,
      issuedAt: enrollment.completedAt,
      generatedAt: enrollment.completedAt,
      revokedAt: null,
      generationVersion: 1,
      createdAt: enrollment.completedAt ?? daysAgo(1),
      downloadAvailable: true,
      verificationUrl:
        'http://localhost:3000/certificates/verify/mockVerificationToken0000000000000000000001',
    },
  };
}

export const MOCK_CERTIFICATE_SEEDS: CertificateSeed[] = MOCK_CERTIFICATE_ENROLLMENTS.map(
  (enrollment, index) => issuedCertificate(enrollment, index),
);

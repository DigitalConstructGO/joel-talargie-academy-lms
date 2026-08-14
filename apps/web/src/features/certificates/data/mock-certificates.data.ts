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

export const MOCK_CERTIFICATE_ENROLLMENTS: DemoCertificateEnrollment[] = [
  demoEnrollment(10, 'enrollment-006', 60),
  demoEnrollment(12, 'enrollment-007', 10),
].filter((entry): entry is DemoCertificateEnrollment => entry !== null);

function issuedCertificate(enrollment: DemoCertificateEnrollment): CertificateSeed {
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

function pendingCertificate(enrollment: DemoCertificateEnrollment): CertificateSeed {
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

const iosEnrollment = MOCK_CERTIFICATE_ENROLLMENTS.find((entry) => entry.id === 'enrollment-006');
const pythonEnrollment = MOCK_CERTIFICATE_ENROLLMENTS.find((entry) => entry.id === 'enrollment-007');

export const MOCK_CERTIFICATE_SEEDS: CertificateSeed[] = [
  iosEnrollment ? issuedCertificate(iosEnrollment) : null,
  pythonEnrollment ? pendingCertificate(pythonEnrollment) : null,
].filter((seed): seed is CertificateSeed => seed !== null);

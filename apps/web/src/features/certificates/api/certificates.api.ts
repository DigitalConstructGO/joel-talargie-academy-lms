import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockCertificatesApi } from '../data/mock-certificates.api';
import type {
  Certificate,
  CertificateDownload,
  CertificateListParams,
  CertificateListResult,
  CertificateRequestResult,
  CertificateVerification,
} from '../types/certificate.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

/** Talks to the real backend's authenticated `/me/certificates` endpoints. */
const liveCertificatesApi = {
  listMine: async (params: CertificateListParams = {}) =>
    unwrap<CertificateListResult>(
      await authClient.get('/me/certificates', { params: cleanParams(params) }),
    ),

  detail: async (certificateId: string) =>
    unwrap<Certificate>(
      await authClient.get(`/me/certificates/${encodeURIComponent(certificateId)}`),
    ),

  download: async (certificateId: string) =>
    unwrap<CertificateDownload>(
      await authClient.get(`/me/certificates/${encodeURIComponent(certificateId)}/download`),
    ),

  request: async (enrollmentId: string) =>
    unwrap<CertificateRequestResult>(
      await authClient.post(`/me/enrollments/${encodeURIComponent(enrollmentId)}/certificate`),
    ),

  verify: async (token: string) =>
    unwrap<CertificateVerification>(
      await authClient.get(`/certificates/verify/${encodeURIComponent(token)}`),
    ),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const certificatesApi =
  CATALOG_DATA_SOURCE === 'live' ? liveCertificatesApi : mockCertificatesApi;

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

  download: async (certificateId: string, inline = false) =>
    unwrap<CertificateDownload>(
      await authClient.get(`/me/certificates/${encodeURIComponent(certificateId)}/download`, {
        params: inline ? { inline: 'true' } : undefined,
      }),
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

/** Live or mock backend API for certificates and public verification. */
export const certificatesApi = {
  ...liveCertificatesApi,
  verify: async (tokenOrCode: string): Promise<CertificateVerification> => {
    if (CATALOG_DATA_SOURCE === 'mock') {
      return mockCertificatesApi.verify(tokenOrCode);
    }
    try {
      return await liveCertificatesApi.verify(tokenOrCode);
    } catch {
      return { state: 'INVALID' };
    }
  },
};


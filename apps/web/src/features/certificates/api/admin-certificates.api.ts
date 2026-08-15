import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockAdminCertificatesApi } from '../data/mock-admin-certificates.api';
import type {
  AdminCertificate,
  AdminCertificateListParams,
  AdminCertificateListResult,
  CertificateEventEntry,
  CertificateFileEntry,
} from '../types/admin-certificate.types';
import type { CertificateDownload } from '../types/certificate.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

const liveAdminCertificatesApi = {
  list: async (params: AdminCertificateListParams = {}) =>
    unwrap<AdminCertificateListResult>(
      await authClient.get('/admin/certificates', { params: cleanParams(params) }),
    ),

  detail: async (certificateId: string) =>
    unwrap<AdminCertificate>(
      await authClient.get(`/admin/certificates/${encodeURIComponent(certificateId)}`),
    ),

  retry: async (certificateId: string) =>
    unwrap<AdminCertificate>(
      await authClient.post(`/admin/certificates/${encodeURIComponent(certificateId)}/retry`),
    ),

  regenerate: async (certificateId: string, reason: string) =>
    unwrap<AdminCertificate>(
      await authClient.post(`/admin/certificates/${encodeURIComponent(certificateId)}/regenerate`, {
        reason,
      }),
    ),

  revoke: async (certificateId: string, reason: string) =>
    unwrap<AdminCertificate>(
      await authClient.post(`/admin/certificates/${encodeURIComponent(certificateId)}/revoke`, {
        reason,
      }),
    ),

  download: async (certificateId: string) =>
    unwrap<CertificateDownload>(
      await authClient.get(`/admin/certificates/${encodeURIComponent(certificateId)}/download`),
    ),

  files: async (certificateId: string) =>
    unwrap<CertificateFileEntry[]>(
      await authClient.get(`/admin/certificates/${encodeURIComponent(certificateId)}/files`),
    ),

  events: async (certificateId: string) =>
    unwrap<CertificateEventEntry[]>(
      await authClient.get(`/admin/certificates/${encodeURIComponent(certificateId)}/events`),
    ),
};

/** Live backend API for admin certificates. */
export const adminCertificatesApi = liveAdminCertificatesApi;

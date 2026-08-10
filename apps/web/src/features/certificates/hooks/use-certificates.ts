'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { certificatesApi } from '../api/certificates.api';
import { certificateKeys } from '../api/query-keys';
import type { CertificateListParams } from '../types/certificate.types';

export function useMyCertificates(params: CertificateListParams = {}) {
  return useQuery({
    queryKey: certificateKeys.list(params),
    queryFn: () => certificatesApi.listMine(params),
  });
}

export function useCertificate(certificateId: string) {
  return useQuery({
    queryKey: certificateKeys.detail(certificateId),
    queryFn: () => certificatesApi.detail(certificateId),
    enabled: Boolean(certificateId),
  });
}

/**
 * Query form, used to render the inline preview (iframe) and the Print
 * button - requests the `inline` disposition so the browser renders the PDF
 * instead of trying to save it. `useCertificateDownload` below is for the
 * explicit Download button click, which wants the `attachment` disposition
 * (forces a save) via a fresh, not potentially stale, signed URL.
 */
export function useCertificateFile(certificateId: string | undefined) {
  return useQuery({
    queryKey: [...certificateKeys.detail(certificateId ?? ''), 'preview'],
    queryFn: () => certificatesApi.download(certificateId!, true),
    enabled: Boolean(certificateId),
  });
}

export function useCertificateDownload() {
  return useMutation({
    mutationFn: (certificateId: string) => certificatesApi.download(certificateId),
  });
}

export function useRequestCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: string) => certificatesApi.request(enrollmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: certificateKeys.all });
    },
  });
}

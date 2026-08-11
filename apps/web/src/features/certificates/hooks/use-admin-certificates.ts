'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminCertificatesApi } from '../api/admin-certificates.api';
import type { AdminCertificateListParams } from '../types/admin-certificate.types';

const adminCertificateKeys = {
  all: ['admin-certificates'] as const,
  lists: () => [...adminCertificateKeys.all, 'list'] as const,
  list: (params: AdminCertificateListParams) => [...adminCertificateKeys.lists(), params] as const,
  detail: (certificateId: string) =>
    [...adminCertificateKeys.all, 'detail', certificateId] as const,
  files: (certificateId: string) => [...adminCertificateKeys.all, 'files', certificateId] as const,
  events: (certificateId: string) =>
    [...adminCertificateKeys.all, 'events', certificateId] as const,
};

export function useAdminCertificates(params: AdminCertificateListParams = {}) {
  return useQuery({
    queryKey: adminCertificateKeys.list(params),
    queryFn: () => adminCertificatesApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminCertificate(certificateId: string) {
  return useQuery({
    queryKey: adminCertificateKeys.detail(certificateId),
    queryFn: () => adminCertificatesApi.detail(certificateId),
    enabled: Boolean(certificateId),
  });
}

export function useAdminCertificateFiles(certificateId: string) {
  return useQuery({
    queryKey: adminCertificateKeys.files(certificateId),
    queryFn: () => adminCertificatesApi.files(certificateId),
    enabled: Boolean(certificateId),
  });
}

export function useAdminCertificateEvents(certificateId: string) {
  return useQuery({
    queryKey: adminCertificateKeys.events(certificateId),
    queryFn: () => adminCertificatesApi.events(certificateId),
    enabled: Boolean(certificateId),
  });
}

export function useDownloadAdminCertificate() {
  return useMutation({
    mutationFn: (certificateId: string) => adminCertificatesApi.download(certificateId),
  });
}

function useCertificateMutation<TInput = void>(
  mutationFn: (certificateId: string, input: TInput) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ certificateId, input }: { certificateId: string; input: TInput }) =>
      mutationFn(certificateId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminCertificateKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: adminCertificateKeys.detail(variables.certificateId),
      });
    },
  });
}

export function useRetryCertificate() {
  return useCertificateMutation<void>((certificateId) => adminCertificatesApi.retry(certificateId));
}

export function useRegenerateCertificate() {
  return useCertificateMutation<string>((certificateId, reason) =>
    adminCertificatesApi.regenerate(certificateId, reason),
  );
}

export function useRevokeCertificate() {
  return useCertificateMutation<string>((certificateId, reason) =>
    adminCertificatesApi.revoke(certificateId, reason),
  );
}

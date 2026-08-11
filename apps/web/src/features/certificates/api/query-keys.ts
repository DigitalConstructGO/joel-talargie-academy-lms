import type { CertificateListParams } from '../types/certificate.types';

export const certificateKeys = {
  all: ['certificates'] as const,
  lists: () => [...certificateKeys.all, 'list'] as const,
  list: (params: CertificateListParams) => [...certificateKeys.lists(), params] as const,
  detail: (certificateId: string) => [...certificateKeys.all, 'detail', certificateId] as const,
};

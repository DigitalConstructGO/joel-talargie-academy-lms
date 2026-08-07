import { cache } from 'react';
import { certificatesApi } from './certificates.api';

/** `React.cache()` dedupes this within a single server render, matching `catalog.server.ts`'s pattern. */
export const verifyCertificateToken = cache((token: string) => certificatesApi.verify(token));

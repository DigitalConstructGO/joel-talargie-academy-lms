import { ApiClientError } from './api-error';

const normalizeBaseUrl = (value?: string) => value?.trim().replace(/\/+$/, '');

export const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.INTERNAL_API_URL;
  if (envUrl) {
    return normalizeBaseUrl(envUrl)!;
  }
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return 'http://localhost:4000/api/v1';
};

export async function apiFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = path.startsWith('http') ? path : `${base}${cleanPath}`;
  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
    signal: init.signal ?? AbortSignal.timeout(60_000),
    headers: { Accept: 'application/json', ...init.headers },
  });
  if (!response.ok)
    throw new ApiClientError(`API request failed (${response.status})`, response.status);
  return response.json();
}

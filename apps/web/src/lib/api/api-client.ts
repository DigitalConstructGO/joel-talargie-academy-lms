import { ApiClientError } from './api-error';
export async function apiFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new ApiClientError('NEXT_PUBLIC_API_URL is not configured');
  const response = await fetch(`${base}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { Accept: 'application/json', ...init.headers },
  });
  if (!response.ok)
    throw new ApiClientError(`API request failed (${response.status})`, response.status);
  return response.json();
}

import axios from 'axios';

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

export const authClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  timeout: 60_000,
});

export const unwrap = <T>(response: { data: { data?: T } | T }): T =>
  'data' in (response.data as object) ? (response.data as { data: T }).data : (response.data as T);

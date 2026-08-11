import axios from 'axios';

const normalizeBaseUrl = (value?: string) => value?.trim().replace(/\/+$/, '');

export const getApiBaseUrl = () => normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL) ?? '';

export const authClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

export const unwrap = <T>(response: { data: { data?: T } | T }): T =>
  'data' in (response.data as object) ? (response.data as { data: T }).data : (response.data as T);

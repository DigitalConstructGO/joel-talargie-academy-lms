import axios from 'axios';
export const authClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
export const unwrap = <T>(response: { data: { data?: T } | T }): T =>
  'data' in (response.data as object) ? (response.data as { data: T }).data : (response.data as T);

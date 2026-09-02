import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';

export interface TelegramStatus {
  connected: boolean;
  username?: string | null;
  linkedAt?: string | null;
}

export interface TelegramLinkResponse {
  telegramUrl: string;
  expiresAt: string;
  alreadyLinked: boolean;
}

const liveTelegramApi = {
  getStatus: async (): Promise<TelegramStatus> =>
    unwrap<TelegramStatus>(await authClient.get('/telegram/status')),

  createLink: async (): Promise<TelegramLinkResponse> =>
    unwrap<TelegramLinkResponse>(await authClient.post('/telegram/link')),

  unlink: async (): Promise<{ success: boolean }> =>
    unwrap<{ success: boolean }>(await authClient.delete('/telegram/link')),
};

let mockConnected = false;
let mockUsername: string | null = null;
let mockLinkedAt: string | null = null;

const mockTelegramApi = {
  getStatus: async (): Promise<TelegramStatus> => {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            connected: mockConnected,
            username: mockUsername,
            linkedAt: mockLinkedAt,
          }),
        150,
      ),
    );
  },

  createLink: async (): Promise<TelegramLinkResponse> => {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            telegramUrl: 'https://t.me/Joel_Talargie_Academy_Bot?start=mock-link-payload',
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            alreadyLinked: mockConnected,
          }),
        200,
      ),
    );
  },
};

export const telegramApi = liveTelegramApi;

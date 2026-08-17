import { authClient, unwrap } from '@/lib/api/auth-client';

export interface NewsletterSubscriptionResponse {
  success: boolean;
  message: string;
  status: 'subscribed' | 'already_subscribed';
}

export const newsletterApi = {
  subscribe: async (email: string) =>
    unwrap<NewsletterSubscriptionResponse>(
      await authClient.post('/newsletter/subscribe', { email }),
    ),
};

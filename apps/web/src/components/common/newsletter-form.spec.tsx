import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NewsletterForm } from './newsletter-form';
import { newsletterApi } from '@/features/newsletter/api/newsletter.api';
import { toast } from '@/lib/toast';

vi.mock('@/features/newsletter/api/newsletter.api', () => ({
  newsletterApi: {
    subscribe: vi.fn(),
  },
}));

vi.mock('@/lib/toast', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('NewsletterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates email input format', async () => {
    render(<NewsletterForm />);

    const button = screen.getByRole('button', { name: /subscribe/i });
    await userEvent.click(button);

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(newsletterApi.subscribe).not.toHaveBeenCalled();
  });

  it('subscribes successfully and resets the input', async () => {
    vi.mocked(newsletterApi.subscribe).mockResolvedValueOnce({
      success: true,
      message: "You're subscribed successfully!",
      status: 'subscribed',
    });

    render(<NewsletterForm />);

    const input = screen.getByPlaceholderText(/you@example.com/i);
    await userEvent.type(input, 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    await waitFor(() => {
      expect(newsletterApi.subscribe).toHaveBeenCalledWith('test@example.com');
      expect(toast.success).toHaveBeenCalledWith(
        "You're subscribed!",
        "You're subscribed successfully!",
      );
    });
  });

  it('shows already subscribed info toast when subscriber already exists', async () => {
    vi.mocked(newsletterApi.subscribe).mockResolvedValueOnce({
      success: true,
      message: "You're already subscribed to our newsletter.",
      status: 'already_subscribed',
    });

    render(<NewsletterForm />);

    const input = screen.getByPlaceholderText(/you@example.com/i);
    await userEvent.type(input, 'existing@example.com');
    await userEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    await waitFor(() => {
      expect(newsletterApi.subscribe).toHaveBeenCalledWith('existing@example.com');
      expect(toast.info).toHaveBeenCalledWith(
        'Already subscribed',
        "You're already subscribed to our newsletter.",
      );
    });
  });
});

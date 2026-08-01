import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthStatus } from './health-status';
import * as health from '@/lib/api/health';
vi.mock('@/lib/api/health');
const response = {
  data: {
    service: 'joel-talargie-academy-api' as const,
    status: 'ok' as const,
    environment: 'test' as const,
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  },
  meta: {},
  error: null,
};
describe('HealthStatus', () => {
  beforeEach(() => vi.resetAllMocks());
  it('shows loading then connected', async () => {
    vi.mocked(health.getHealth).mockResolvedValue(response);
    render(<HealthStatus />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(await screen.findByText('Connected')).toBeInTheDocument();
  });
  it('shows an error and retries', async () => {
    vi.mocked(health.getHealth)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(response);
    render(<HealthStatus />);
    expect(await screen.findByText(/Disconnected: offline/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.getByText('Connected')).toBeInTheDocument());
  });
});

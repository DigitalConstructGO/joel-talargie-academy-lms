import { render, screen } from '@testing-library/react';
import { vi, it, expect } from 'vitest';
import Home from './page';
vi.mock('@/components/health-status', () => ({ HealthStatus: () => <p>Health</p> }));
it('renders the academy homepage', () => {
  render(<Home />);
  expect(screen.getByRole('heading', { name: 'Joel Talargie Academy' })).toBeInTheDocument();
});

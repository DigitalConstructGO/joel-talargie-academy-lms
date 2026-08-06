import { render, screen } from '@testing-library/react';
import { vi, it, expect } from 'vitest';
import Home from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/features/catalog/api/catalog.api', () => ({
  catalogApi: {
    featuredCourses: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
}));

it('renders the academy homepage', async () => {
  render(await Home());
  expect(
    screen.getByRole('heading', { name: 'Engineer Your Next Career Move.' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Ready to Start?' })).toBeInTheDocument();
});

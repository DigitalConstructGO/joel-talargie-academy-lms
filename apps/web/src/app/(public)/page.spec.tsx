import { render, screen } from '@testing-library/react';
import { vi, it, expect } from 'vitest';
import Home from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/features/catalog/api/catalog.api', () => ({
  catalogApi: {
    listCategories: vi.fn().mockResolvedValue({
      items: [{ id: 'cat-1', name: 'Web Development', slug: 'web-development', description: null }],
      total: 1,
    }),
    featuredCourses: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listCourses: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
}));

it('renders the academy homepage', async () => {
  render(await Home());
  expect(
    screen.getByRole('heading', { name: 'Learn with purpose. Build with confidence.' }),
  ).toBeInTheDocument();
  expect(screen.getByText('Web Development')).toBeInTheDocument();
});

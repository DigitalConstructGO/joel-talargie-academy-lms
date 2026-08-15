import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SidebarUserFooter } from './sidebar-user-footer';
import { useAuthStore } from '@/stores';
import { ROUTES } from '@/constants/routes';

const mockLogout = vi.fn();
vi.mock('@/hooks/use-logout', () => ({
  useLogout: () => mockLogout,
}));
vi.mock('@/features/account/hooks/use-avatar', () => ({
  useAvatarImage: () => ({ url: null, isLoading: false }),
}));

describe('SidebarUserFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'usr_admin_1',
        email: 'admin@example.com',
        firstName: 'Habtamu',
        lastName: 'Baye',
        roles: ['ADMINISTRATOR'],
        avatarUrl: null,
        provider: 'LOCAL',
        emailVerified: true,
      },
    });
  });

  it('renders the user name, role label, and initials fallback', () => {
    render(<SidebarUserFooter roleLabel="Administrator" />);

    expect(screen.getByText('Habtamu Baye')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
    expect(screen.getByText('HB')).toBeInTheDocument();
  });

  it('links the user profile container to the unified profile page', () => {
    render(
      <SidebarUserFooter
        roleLabel="Administrator"
        profileHref={ROUTES.admin.systemProfile}
      />,
    );

    const link = screen.getByRole('link', { name: /view profile/i });
    expect(link).toHaveAttribute('href', ROUTES.admin.systemProfile);
  });

  it('calls logout when the logout button is clicked', async () => {
    render(<SidebarUserFooter roleLabel="Administrator" />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await userEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});

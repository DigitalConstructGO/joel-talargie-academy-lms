import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PermissionPicker } from './permission-picker';
import { useAuthStore } from '@/stores/auth.store';
import * as catalogHook from '@/features/permissions/hooks/use-permission-catalog';

vi.mock('@/features/permissions/hooks/use-permission-catalog');

const CATALOG = {
  groups: [
    {
      module: 'courses',
      permissions: [
        { id: 'perm-courses-read', code: 'courses.read', module: 'courses', description: null },
        { id: 'perm-courses-create', code: 'courses.create', module: 'courses', description: null },
      ],
    },
    {
      module: 'users',
      permissions: [
        { id: 'perm-users-archive', code: 'users.archive', module: 'users', description: null },
      ],
    },
  ],
};

function mockCatalog() {
  vi.mocked(catalogHook.usePermissionCatalog).mockReturnValue({
    data: CATALOG,
    isLoading: false,
  } as unknown as ReturnType<typeof catalogHook.usePermissionCatalog>);
}

describe('PermissionPicker', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCatalog();
    useAuthStore.setState({ permissions: [], isAdministrator: false });
  });

  it('mirrors the backend privilege-escalation rule: a non-admin can only check permissions they hold', async () => {
    useAuthStore.setState({ permissions: ['courses.read'], isAdministrator: false });
    const onChange = vi.fn();
    render(<PermissionPicker selected={[]} onChange={onChange} />);

    await userEvent.click(screen.getByText('courses'));
    const readCheckbox = screen.getByRole('checkbox', { name: /courses\.read/ });
    const createCheckbox = screen.getByRole('checkbox', { name: /courses\.create/ });

    expect(readCheckbox).not.toBeDisabled();
    expect(createCheckbox).toBeDisabled();
    expect(screen.getByText(/you don't hold this permission/)).toBeInTheDocument();
  });

  it('an administrator can select every permission regardless of their own grants', async () => {
    useAuthStore.setState({ permissions: [], isAdministrator: true });
    const onChange = vi.fn();
    render(<PermissionPicker selected={[]} onChange={onChange} />);

    await userEvent.click(screen.getByText('courses'));
    expect(screen.getByRole('checkbox', { name: /courses\.create/ })).not.toBeDisabled();
  });

  it('toggling a permitted checkbox reports the permission id to onChange', async () => {
    useAuthStore.setState({ permissions: ['courses.read'], isAdministrator: false });
    const onChange = vi.fn();
    render(<PermissionPicker selected={[]} onChange={onChange} />);

    await userEvent.click(screen.getByText('courses'));
    await userEvent.click(screen.getByRole('checkbox', { name: /courses\.read/ }));

    expect(onChange).toHaveBeenCalledWith(['perm-courses-read']);
  });

  it('"Select all" only selects permissions the actor is permitted to assign', async () => {
    useAuthStore.setState({ permissions: ['courses.read'], isAdministrator: false });
    const onChange = vi.fn();
    render(<PermissionPicker selected={[]} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Select all' }));

    expect(onChange).toHaveBeenCalledWith(['perm-courses-read']);
  });
});

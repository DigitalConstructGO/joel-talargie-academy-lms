import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { Can } from './can';
import { useAuthStore } from '@/stores';

function seedAuth(overrides: {
  permissions?: string[];
  roles?: string[];
  isAdministrator?: boolean;
}) {
  useAuthStore.setState({
    permissions: overrides.permissions ?? [],
    roles: overrides.roles ?? [],
    isAdministrator: overrides.isAdministrator ?? false,
  });
}

describe('Can', () => {
  beforeEach(() => seedAuth({}));

  it('renders children when no condition is given', () => {
    render(
      <Can>
        <span>Always visible</span>
      </Can>,
    );
    expect(screen.getByText('Always visible')).toBeInTheDocument();
  });

  it('renders children when the required permission is granted', () => {
    seedAuth({ permissions: ['courses.create'] });
    render(
      <Can permission="courses.create">
        <span>Create Course</span>
      </Can>,
    );
    expect(screen.getByText('Create Course')).toBeInTheDocument();
  });

  it('renders nothing when the required permission is missing and no fallback is given', () => {
    seedAuth({ permissions: ['courses.read'] });
    render(
      <Can permission="courses.create">
        <span>Create Course</span>
      </Can>,
    );
    expect(screen.queryByText('Create Course')).not.toBeInTheDocument();
  });

  it('renders the fallback when the permission is missing and a fallback is given', () => {
    seedAuth({ permissions: ['courses.read'] });
    render(
      <Can permission="courses.create" fallback={<span>Read-only</span>}>
        <span>Create Course</span>
      </Can>,
    );
    expect(screen.getByText('Read-only')).toBeInTheDocument();
    expect(screen.queryByText('Create Course')).not.toBeInTheDocument();
  });

  it('anyOf passes when at least one required permission is granted', () => {
    seedAuth({ permissions: ['courses.archive'] });
    render(
      <Can anyOf={['courses.update', 'courses.archive']}>
        <span>Manage</span>
      </Can>,
    );
    expect(screen.getByText('Manage')).toBeInTheDocument();
  });

  it('allOf requires every permission to be granted', () => {
    seedAuth({ permissions: ['courses.update'] });
    render(
      <Can allOf={['courses.update', 'courses.archive']}>
        <span>Full control</span>
      </Can>,
    );
    expect(screen.queryByText('Full control')).not.toBeInTheDocument();
  });

  it('role passes when the account carries the exact role code', () => {
    seedAuth({ roles: ['ADMINISTRATOR'] });
    render(
      <Can role="ADMINISTRATOR">
        <span>Staff only</span>
      </Can>,
    );
    expect(screen.getByText('Staff only')).toBeInTheDocument();
  });

  it('anyRole passes when the account carries at least one of the listed roles', () => {
    seedAuth({ roles: ['CONTENT_MANAGER'] });
    render(
      <Can anyRole={['ADMINISTRATOR', 'CONTENT_MANAGER']}>
        <span>Manager area</span>
      </Can>,
    );
    expect(screen.getByText('Manager area')).toBeInTheDocument();
  });

  it('isAdministrator bypasses a permission check the account was not explicitly granted', () => {
    seedAuth({ permissions: [], isAdministrator: true });
    render(
      <Can permission="courses.delete">
        <span>Delete Course</span>
      </Can>,
    );
    expect(screen.getByText('Delete Course')).toBeInTheDocument();
  });

  it('isAdministrator bypasses a role check for a role the account does not carry', () => {
    seedAuth({ roles: ['STUDENT'], isAdministrator: true });
    render(
      <Can role="ADMINISTRATOR">
        <span>Staff only</span>
      </Can>,
    );
    expect(screen.getByText('Staff only')).toBeInTheDocument();
  });

  it('requires every given condition to pass when more than one is specified', () => {
    seedAuth({ permissions: ['courses.update'], roles: ['STUDENT'] });
    render(
      <Can permission="courses.update" role="ADMINISTRATOR">
        <span>Both required</span>
      </Can>,
    );
    expect(screen.queryByText('Both required')).not.toBeInTheDocument();
  });
});

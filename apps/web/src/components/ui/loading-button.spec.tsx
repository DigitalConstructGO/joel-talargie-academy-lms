import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoadingButton } from './loading-button';

describe('LoadingButton', () => {
  it('renders its children and is clickable when idle', async () => {
    const onClick = vi.fn();
    render(<LoadingButton onClick={onClick}>Save Changes</LoadingButton>);

    const button = screen.getByRole('button', { name: 'Save Changes' });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('aria-busy', 'false');

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables itself, marks aria-busy, and shows a spinner while loading', () => {
    render(<LoadingButton loading>Save Changes</LoadingButton>);

    const button = screen.getByRole('button', { name: 'Save Changes' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('swaps to loadingText while loading and restores the original label when idle again', () => {
    const { rerender } = render(
      <LoadingButton loading loadingText="Saving...">
        Save Changes
      </LoadingButton>,
    );
    expect(screen.getByRole('button', { name: /Saving.../ })).toBeInTheDocument();
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();

    rerender(
      <LoadingButton loading={false} loadingText="Saving...">
        Save Changes
      </LoadingButton>,
    );
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
  });

  it('keeps the original label with just a spinner added when no loadingText is given', () => {
    render(<LoadingButton loading>Archive</LoadingButton>);
    expect(screen.getByRole('button', { name: /Archive/ })).toBeInTheDocument();
  });

  it('does not fire onClick while loading (rapid re-clicks are no-ops once disabled)', async () => {
    const onClick = vi.fn();
    render(
      <LoadingButton loading onClick={onClick}>
        Save Changes
      </LoadingButton>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('stays disabled when disabled is set independently of loading', () => {
    render(<LoadingButton disabled>Save Changes</LoadingButton>);
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
  });

  it('never ends up permanently disabled after loading turns back off', () => {
    const { rerender } = render(<LoadingButton loading>Save Changes</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();

    rerender(<LoadingButton loading={false}>Save Changes</LoadingButton>);
    expect(screen.getByRole('button')).toBeEnabled();
  });

  it('forwards standard Button props like variant, size, and type', () => {
    render(
      <LoadingButton variant="destructive" size="sm" type="submit">
        Delete
      </LoadingButton>,
    );
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveAttribute('type', 'submit');
  });
});

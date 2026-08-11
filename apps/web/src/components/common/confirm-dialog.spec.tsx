import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './confirm-dialog';
import { Button } from '@/components/ui/button';

describe('ConfirmDialog', () => {
  it('calls onConfirm and closes the dialog on success', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ConfirmDialog
        trigger={<Button>Archive</Button>}
        title="Archive this?"
        description="Are you sure?"
        onConfirm={onConfirm}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Archive' }));
    expect(await screen.findByText('Archive this?')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText('Archive this?')).not.toBeInTheDocument());
  });

  it('keeps the dialog open when onConfirm throws', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('failed'));
    render(
      <ConfirmDialog
        trigger={<Button>Archive</Button>}
        title="Archive this?"
        description="Are you sure?"
        onConfirm={onConfirm}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Archive' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Archive this?')).toBeInTheDocument();
  });

  it('disables confirm when confirmDisabled is true', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        trigger={<Button>Archive</Button>}
        title="Archive this?"
        description="Are you sure?"
        onConfirm={onConfirm}
        confirmDisabled
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Archive' }));
    expect(await screen.findByRole('button', { name: 'Confirm' })).toBeDisabled();
  });
});

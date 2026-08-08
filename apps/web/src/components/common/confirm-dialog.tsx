'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => Promise<void> | void;
  /** Extra content rendered between the description and the footer buttons, e.g. a reason textarea. */
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disables the confirm button beyond the built-in pending state, e.g. while a required reason is empty. */
  confirmDisabled?: boolean;
}

/**
 * Shared confirmation dialog for every archive/suspend/decline/revoke-style
 * action across the admin surfaces. Owns its own pending state so a slow
 * mutation can't be double-submitted, and only closes on success - a thrown
 * error keeps the dialog open so the caller's toast/error UI stays visible.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setUncontrolledOpen;

  async function handleConfirm(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // Keep the dialog open - the caller is responsible for its own error toast.
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending || confirmDisabled}
            className={cn(variant === 'destructive' && buttonVariants({ variant: 'destructive' }))}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import { toast as sonnerToast } from 'sonner';

/**
 * Centralized toast helpers - use these instead of calling `sonner` or the
 * browser's `alert`/`confirm` directly, so copy/behavior stays consistent
 * everywhere a feature needs to notify the user.
 */
export const toast = {
  success: (message: string, description?: string) => sonnerToast.success(message, { description }),
  error: (message: string, description?: string) => sonnerToast.error(message, { description }),
  info: (message: string, description?: string) => sonnerToast.info(message, { description }),
  warning: (message: string, description?: string) => sonnerToast.warning(message, { description }),
  loading: (message: string) => sonnerToast.loading(message),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
  ) => sonnerToast.promise(promise, messages),
};

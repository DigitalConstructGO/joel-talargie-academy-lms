import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from './button';

export interface LoadingButtonProps extends ButtonProps {
  /** Whether the action this button triggers is currently in flight - typically a mutation's `isPending`. */
  loading?: boolean;
  /** Replaces the button's children while `loading` is true (e.g. "Saving..."). Omit to keep the same label with just a spinner added. */
  loadingText?: React.ReactNode;
}

/**
 * A `Button` that owns the idle/loading visual state for an API-triggering
 * action: disables itself, marks `aria-busy`, and shows a spinner (plus an
 * optional loading label) whenever `loading` is true. Doesn't support
 * `asChild` - it renders its own spinner content, which needs a real
 * `<button>` element, not `Slot`'s single-child passthrough.
 */
const LoadingButton = React.forwardRef<HTMLButtonElement, Omit<LoadingButtonProps, 'asChild'>>(
  ({ loading = false, loadingText, disabled, children, ...props }, ref) => {
    return (
      <Button ref={ref} disabled={disabled || loading} aria-busy={loading} {...props}>
        {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
        {loading && loadingText !== undefined ? loadingText : children}
      </Button>
    );
  },
);
LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };

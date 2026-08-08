import { AlertTriangle, FileQuestion, Lock, ServerCrash, ShieldAlert, WifiOff } from 'lucide-react';
import { ErrorState, type ErrorStateProps } from '@/components/common/error-state';

type PresetProps = Partial<
  Pick<ErrorStateProps, 'title' | 'description' | 'onRetry' | 'retryLabel' | 'className'>
>;

/**
 * In-shell error presets - these render as a content-area block (unlike
 * `StatusPage`, which takes over the whole viewport), so the dashboard
 * sidebar and header stay visible while an error is shown.
 */

export function DashboardNotFoundState(props: PresetProps) {
  return (
    <ErrorState
      icon={FileQuestion}
      title="Page not found"
      description="The page you're looking for doesn't exist or may have been moved."
      {...props}
    />
  );
}

export function DashboardForbiddenState(props: PresetProps) {
  return (
    <ErrorState
      icon={ShieldAlert}
      title="Access denied"
      description="You don't have permission to view this page."
      {...props}
    />
  );
}

export function DashboardServerErrorState(props: PresetProps) {
  return (
    <ErrorState
      icon={ServerCrash}
      title="Something went wrong"
      description="An unexpected error occurred on our end. Please try again."
      {...props}
    />
  );
}

export function DashboardNetworkErrorState(props: PresetProps) {
  return (
    <ErrorState
      icon={WifiOff}
      title="Connection lost"
      description="Check your internet connection and try again."
      retryLabel="Retry"
      {...props}
    />
  );
}

export function DashboardApiErrorState(props: PresetProps) {
  return (
    <ErrorState
      icon={AlertTriangle}
      title="Couldn't load data"
      description="We couldn't reach the server. Please try again in a moment."
      {...props}
    />
  );
}

export function DashboardUnauthorizedState(props: PresetProps) {
  return (
    <ErrorState
      icon={Lock}
      title="Sign in required"
      description="You need to sign in to access this page."
      {...props}
    />
  );
}

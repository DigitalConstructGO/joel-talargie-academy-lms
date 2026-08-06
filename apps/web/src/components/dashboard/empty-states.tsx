import { BarChart3, Bell, BookOpen, CreditCard, Inbox, SearchX } from 'lucide-react';
import { EmptyState, type EmptyStateProps } from '@/components/common/empty-state';

type PresetProps = Partial<Pick<EmptyStateProps, 'title' | 'description' | 'action' | 'className'>>;

export function NoDataEmptyState(props: PresetProps) {
  return (
    <EmptyState
      icon={Inbox}
      title="No data yet"
      description="There is nothing to show here yet."
      {...props}
    />
  );
}

export function NoSearchResultsEmptyState(props: PresetProps) {
  return (
    <EmptyState
      icon={SearchX}
      title="No results found"
      description="Try adjusting your search or filters."
      {...props}
    />
  );
}

export function NoNotificationsEmptyState(props: PresetProps) {
  return (
    <EmptyState
      icon={Bell}
      title="You're all caught up"
      description="New notifications will appear here."
      {...props}
    />
  );
}

export function NoCoursesEmptyState(props: PresetProps) {
  return (
    <EmptyState
      icon={BookOpen}
      title="No courses yet"
      description="Courses you interact with will show up here."
      {...props}
    />
  );
}

export function NoPaymentsEmptyState(props: PresetProps) {
  return (
    <EmptyState
      icon={CreditCard}
      title="No payments yet"
      description="Your payment history will appear here."
      {...props}
    />
  );
}

export function NoReportsEmptyState(props: PresetProps) {
  return (
    <EmptyState
      icon={BarChart3}
      title="No reports yet"
      description="Generated reports will appear here."
      {...props}
    />
  );
}

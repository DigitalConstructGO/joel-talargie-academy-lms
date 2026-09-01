'use client';

import { Award, BarChart3, Bell, BookOpen, CreditCard, Heart, Inbox, SearchX } from 'lucide-react';
import { EmptyState, type EmptyStateProps } from '@/components/common/empty-state';
import { useLanguage } from '@/lib/i18n/language-provider';

type PresetProps = Partial<Pick<EmptyStateProps, 'title' | 'description' | 'action' | 'className'>>;

export function NoDataEmptyState(props: PresetProps) {
  const { locale } = useLanguage();
  return (
    <EmptyState
      icon={Inbox}
      title={locale === 'am' ? 'ምንም መረጃ የለም' : 'No data yet'}
      description={
        locale === 'am' ? 'እስካሁን ምንም የሚታይ ነገር የለም።' : 'There is nothing to show here yet.'
      }
      {...props}
    />
  );
}

export function NoSearchResultsEmptyState(props: PresetProps) {
  const { locale } = useLanguage();
  return (
    <EmptyState
      icon={SearchX}
      title={locale === 'am' ? 'ምንም ውጤት አልተገኘም' : 'No results found'}
      description={
        locale === 'am'
          ? 'ፍለጋዎን ወይም ማጣሪያዎችዎን ለማስተካከል ይሞክሩ።'
          : 'Try adjusting your search or filters.'
      }
      {...props}
    />
  );
}

export function NoNotificationsEmptyState(props: PresetProps) {
  const { locale } = useLanguage();
  return (
    <EmptyState
      icon={Bell}
      title={locale === 'am' ? 'ምንም አዲስ ማስታወቂያ የለም' : "You're all caught up"}
      description={
        locale === 'am' ? 'አዳዲስ ማስታወቂያዎች እዚህ ይታያሉ።' : 'New notifications will appear here.'
      }
      {...props}
    />
  );
}

export function NoCoursesEmptyState(props: PresetProps) {
  const { locale } = useLanguage();
  return (
    <EmptyState
      icon={BookOpen}
      title={locale === 'am' ? 'ምንም ኮርሶች የሉም' : 'No courses yet'}
      description={
        locale === 'am' ? 'እስካሁን በምንም ኮርስ አልተመዘገቡም።' : "You haven't enrolled in any courses yet."
      }
      {...props}
    />
  );
}

export function NoWishlistEmptyState(props: PresetProps) {
  const { locale } = useLanguage();
  return (
    <EmptyState
      icon={Heart}
      title={locale === 'am' ? 'የምኞት ዝርዝርዎ ባዶ ነው' : 'Your wishlist is empty'}
      description={
        locale === 'am'
          ? 'ለኋላ ያስቀመጧቸው ኮርሶች እዚህ ይታያሉ።'
          : 'Courses you save for later will show up here.'
      }
      {...props}
    />
  );
}

export function NoPaymentsEmptyState(props: PresetProps) {
  const { locale } = useLanguage();
  return (
    <EmptyState
      icon={CreditCard}
      title={locale === 'am' ? 'ምንም ክፍያዎች የሉም' : 'No payments yet'}
      description={
        locale === 'am' ? 'የክፍያ ታሪክዎ እዚህ ይታያሉ።' : 'Your payment history will appear here.'
      }
      {...props}
    />
  );
}

export function NoCertificatesEmptyState(props: PresetProps) {
  const { locale } = useLanguage();
  return (
    <EmptyState
      icon={Award}
      title={locale === 'am' ? 'ምንም ሰርተፊኬቶች የሉም' : 'No certificates yet'}
      description={
        locale === 'am'
          ? 'የመጀመሪያዎን ሰርተፊኬት ለማግኘት ኮርስ ያጠናቅቁ።'
          : 'Complete a certificate-eligible course to earn your first certificate.'
      }
      {...props}
    />
  );
}

export function NoReportsEmptyState(props: PresetProps) {
  const { locale } = useLanguage();
  return (
    <EmptyState
      icon={BarChart3}
      title={locale === 'am' ? 'ምንም ሪፖርቶች የሉም' : 'No reports yet'}
      description={
        locale === 'am' ? 'የተፈጠሩ ሪፖርቶች እዚህ ይታያሉ።' : 'Generated reports will appear here.'
      }
      {...props}
    />
  );
}

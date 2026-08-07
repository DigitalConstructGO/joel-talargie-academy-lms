import Link from 'next/link';
import { BookOpen, Plus } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/auth/can';
import { ROUTES } from '@/constants/routes';

export default function AdminCoursesPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Courses"
        description="Manage the course catalog."
        actions={
          <Can permission="courses.create">
            <Button asChild className="gap-2">
              <Link href={ROUTES.admin.academicsCourseCreate}>
                <Plus className="size-4" />
                New Course
              </Link>
            </Button>
          </Can>
        }
      />
      <ComingSoonSection feature="Course management" icon={BookOpen} />
    </ContentContainer>
  );
}

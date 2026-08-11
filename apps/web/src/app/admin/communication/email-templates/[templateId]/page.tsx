'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useEmailTemplate,
  usePreviewEmailTemplate,
} from '@/features/email-templates/hooks/use-email-templates';
import { ROUTES } from '@/constants/routes';
import { formatDateTime } from '@/lib/date';
import { toast } from '@/lib/toast';

export default function AdminEmailTemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const templateQuery = useEmailTemplate(templateId);
  const previewMutation = usePreviewEmailTemplate();
  const [variables, setVariables] = useState<Record<string, string>>({});
  const template = templateQuery.data;

  async function handlePreview() {
    try {
      await previewMutation.mutateAsync({ templateId, variables });
      toast.success('Preview rendered');
    } catch {
      toast.error('Could not render a preview');
    }
  }

  if (templateQuery.isError) {
    return (
      <ContentContainer>
        <PageHeader title="Email template" />
        <ErrorState
          onRetry={() => templateQuery.refetch()}
          description="Unable to load this template."
        />
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Communication', href: ROUTES.admin.communication },
          { label: 'Email Templates', href: ROUTES.admin.communicationEmailTemplates },
          { label: template?.name ?? 'Template' },
        ]}
      />
      <PageHeader
        title={template?.name ?? 'Email template'}
        description={template?.subjectTemplate}
      />

      {templateQuery.isLoading || !template ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Template key</dt>
                  <dd>
                    <code className="text-xs">{template.code}</code>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <Badge variant={template.isActive ? 'success' : 'outline'}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Version</dt>
                  <dd className="font-medium text-foreground">{template.version}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Locale</dt>
                  <dd className="font-medium text-foreground">{template.locale}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Last updated</dt>
                  <dd className="font-medium text-foreground">
                    {formatDateTime(template.updatedAt)}
                  </dd>
                </div>
                {template.description && (
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Description</dt>
                    <dd className="text-foreground">{template.description}</dd>
                  </div>
                )}
              </dl>

              <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                The subject and body content of system email templates are managed in code and
                aren&apos;t editable from the admin dashboard yet. Use the preview panel to see how
                this template renders with sample values.
              </p>

              {template.placeholders.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-foreground">Available variables</p>
                  <div className="space-y-2">
                    {template.placeholders.map((placeholder) => (
                      <div key={placeholder} className="space-y-1">
                        <Label htmlFor={`var-${placeholder}`} className="text-xs">
                          {'{{'}
                          {placeholder}
                          {'}}'}
                        </Label>
                        <Input
                          id={`var-${placeholder}`}
                          placeholder={`Sample ${placeholder}`}
                          value={variables[placeholder] ?? ''}
                          onChange={(event) =>
                            setVariables((prev) => ({ ...prev, [placeholder]: event.target.value }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handlePreview} disabled={previewMutation.isPending}>
                {previewMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Render preview
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {!previewMutation.data ? (
                <p className="text-sm text-muted-foreground">
                  Fill in sample values and click &quot;Render preview&quot; to see the rendered
                  email.
                </p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Subject</p>
                    <p className="font-medium text-foreground">{previewMutation.data.subject}</p>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <iframe
                      title="Email preview"
                      srcDoc={previewMutation.data.html}
                      sandbox=""
                      className="h-96 w-full bg-white"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </ContentContainer>
  );
}

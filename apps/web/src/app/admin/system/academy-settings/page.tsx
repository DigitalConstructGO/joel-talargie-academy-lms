'use client';

import { useEffect, useState } from 'react';
import { History, Loader2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Can } from '@/components/auth/can';
import { SettingField } from '@/features/settings/components/setting-field';
import {
  useSettingHistory,
  useSettings,
  useUpdateSettingsBatch,
} from '@/features/settings/hooks/use-settings';
import {
  SETTING_CATEGORY_LABELS,
  type SettingCategory,
} from '@/features/settings/types/settings.types';
import { formatDateTime } from '@/lib/date';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/constants/routes';

const CATEGORIES = Object.keys(SETTING_CATEGORY_LABELS) as SettingCategory[];

function HistoryDialog({
  settingKey,
  onClose,
}: {
  settingKey: string | null;
  onClose: () => void;
}) {
  const historyQuery = useSettingHistory(settingKey ?? undefined);
  return (
    <Dialog open={Boolean(settingKey)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change history</DialogTitle>
        </DialogHeader>
        {historyQuery.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !historyQuery.data?.length ? (
          <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
        ) : (
          <ul className="max-h-80 space-y-3 overflow-y-auto text-sm">
            {historyQuery.data.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                <p>
                  <span className="text-muted-foreground">
                    {JSON.stringify(entry.previousValue)}
                  </span>
                  {' → '}
                  <span className="font-medium text-foreground">
                    {JSON.stringify(entry.newValue)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">Reason: {entry.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CategoryTab({ category }: { category: SettingCategory }) {
  const settingsQuery = useSettings({ category });
  const updateBatch = useUpdateSettingsBatch();
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [historyKey, setHistoryKey] = useState<string | null>(null);

  useEffect(() => {
    if (settingsQuery.data) {
      setDraft(
        Object.fromEntries(settingsQuery.data.map((setting) => [setting.key, setting.value])),
      );
    }
  }, [settingsQuery.data]);

  const dirtyKeys = (settingsQuery.data ?? [])
    .filter((setting) => draft[setting.key] !== setting.value)
    .map((setting) => setting.key);

  async function handleSave() {
    try {
      await updateBatch.mutateAsync({
        reason,
        items: dirtyKeys.map((key) => ({ key, value: draft[key] })),
      });
      toast.success('Settings updated');
      setReason('');
      setReasonDialogOpen(false);
    } catch {
      toast.error('Could not update settings', 'Check you hold the required permission.');
    }
  }

  if (settingsQuery.isError) {
    return (
      <ErrorState onRetry={() => settingsQuery.refetch()} description="Unable to load settings." />
    );
  }

  if (settingsQuery.isLoading || !settingsQuery.data) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (settingsQuery.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No settings registered in this category.</p>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {settingsQuery.data.map((setting) => (
          <div key={setting.key} className="flex items-start gap-2">
            <div className="flex-1">
              <SettingField
                setting={setting}
                value={draft[setting.key]}
                onChange={(value) => setDraft((prev) => ({ ...prev, [setting.key]: value }))}
                disabled={updateBatch.isPending}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-1 size-8 shrink-0"
              aria-label="View history"
              onClick={() => setHistoryKey(setting.key)}
            >
              <History className="size-4" />
            </Button>
          </div>
        ))}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            {dirtyKeys.length > 0 ? `${dirtyKeys.length} unsaved change(s)` : 'No unsaved changes'}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={dirtyKeys.length === 0}
              onClick={() =>
                setDraft(
                  Object.fromEntries(
                    settingsQuery.data.map((setting) => [setting.key, setting.value]),
                  ),
                )
              }
            >
              Reset
            </Button>
            <Can permission={`settings.update_${category}`}>
              <Button
                type="button"
                disabled={dirtyKeys.length === 0}
                onClick={() => setReasonDialogOpen(true)}
              >
                Save changes
              </Button>
            </Can>
          </div>
        </div>
      </CardContent>

      <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm settings update</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (required)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleSave}
              disabled={reason.trim().length < 5 || updateBatch.isPending}
            >
              {updateBatch.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HistoryDialog settingKey={historyKey} onClose={() => setHistoryKey(null)} />
    </Card>
  );
}

export default function AdminAcademySettingsPage() {
  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'System', href: ROUTES.admin.system },
          { label: 'Academy Settings' },
        ]}
      />
      <PageHeader title="Academy Settings" description="Platform-wide configuration." />

      <Tabs defaultValue={CATEGORIES[0]}>
        <TabsList className="flex-wrap">
          {CATEGORIES.map((category) => (
            <TabsTrigger key={category} value={category}>
              {SETTING_CATEGORY_LABELS[category]}
            </TabsTrigger>
          ))}
        </TabsList>
        {CATEGORIES.map((category) => (
          <TabsContent key={category} value={category}>
            <CategoryTab category={category} />
          </TabsContent>
        ))}
      </Tabs>
    </ContentContainer>
  );
}

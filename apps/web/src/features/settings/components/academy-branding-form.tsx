'use client';

import { useState } from 'react';
import { Loader2, Palette, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { ImageUploadField } from './image-upload-field';
import { useUpdateSettingsBatch } from '../hooks/use-settings';
import type { AcademyBrandingSettings } from '../types/settings.types';

import { useLanguage } from '@/lib/i18n/language-provider';

export function AcademyBrandingForm({
  initialData,
  disabled = false,
}: {
  initialData: AcademyBrandingSettings;
  disabled?: boolean;
}) {
  const { locale } = useLanguage();
  const updateBatch = useUpdateSettingsBatch();
  const [form, setForm] = useState<AcademyBrandingSettings>(initialData);

  function handleChange<K extends keyof AcademyBrandingSettings>(
    key: K,
    value: AcademyBrandingSettings[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateBatch.mutateAsync({
        reason: 'Updated Academy branding assets and color theme',
        items: [{ key: 'academy.branding', value: form }],
      });
      toast.success('Branding settings saved successfully');
    } catch {
      toast.error('Failed to save branding', 'Please verify your permissions and try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{locale === 'am' ? 'ሎጎ እና አይኮኖች' : 'Logo & Icon Assets'}</CardTitle>
          <CardDescription>
            {locale === 'am'
              ? 'በናቪጌሽን ባር፣ ፋቪኮን እና በኢሜይል ርዕሶች ላይ የሚታዩ ይፋዊ ምስሎች።'
              : 'Official imagery displayed in the navigation bar, favicon, and email headers. Upload or paste a URL.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <ImageUploadField
              id="logoUrl"
              label={locale === 'am' ? 'የአካዳሚው ሎጎ' : 'Academy Logo'}
              value={form.logoUrl}
              onChange={(url) => handleChange('logoUrl', url)}
              description={
                locale === 'am'
                  ? 'ከፍተኛ ጥራት ያለው PNG, SVG, ወይም WebP ሎጎ።'
                  : 'High-resolution PNG, SVG, or WebP logo.'
              }
              placeholder="/brand/logo.svg"
              disabled={disabled || updateBatch.isPending}
              aspectRatio="square"
            />

            <ImageUploadField
              id="faviconUrl"
              label={locale === 'am' ? 'ፋቪኮን (Favicon)' : 'Favicon Asset'}
              value={form.faviconUrl}
              onChange={(url) => handleChange('faviconUrl', url)}
              description={
                locale === 'am'
                  ? 'ለብራውዘር ታቦች የሚሆን ስኩዌር አይኮን።'
                  : 'Square icon (ICO, PNG) for browser tabs.'
              }
              placeholder="/favicon.ico"
              disabled={disabled || updateBatch.isPending}
              aspectRatio="square"
            />
          </div>

          <ImageUploadField
            id="heroBackgroundUrl"
            label={locale === 'am' ? 'የHero ክፍል ዳራ ምስል' : 'Hero Section Background Imagery'}
            value={form.heroBackgroundUrl}
            onChange={(url) => handleChange('heroBackgroundUrl', url)}
            description={
              locale === 'am'
                ? 'ለአካዳሚው መነሻ ገጽ ነባሪ ዳራ ምስል።'
                : 'Default background visual banner for the landing page.'
            }
            placeholder="/images/hero/network-abstract.jpg"
            disabled={disabled || updateBatch.isPending}
            aspectRatio="banner"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-brand" />
            <CardTitle>{locale === 'am' ? 'የብራንድ ቀለሞች' : 'Brand Color Palette'}</CardTitle>
          </div>
          <CardDescription>
            {locale === 'am'
              ? 'ለሰርተፊኬቶች፣ ባጆች እና ዋና አዝራሮች የሚያገለግሉ የብራንድ ቀለሞች።'
              : 'Signature brand colors used for luxury certificate accents, badges, and primary buttons.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">
                {locale === 'am' ? 'ዋና ቀለም (አረንጓዴ)' : 'Primary Color (Forest Green)'}
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor || '#1F4700'}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="size-10 cursor-pointer rounded border border-border bg-transparent p-0"
                  disabled={disabled || updateBatch.isPending}
                />
                <Input
                  id="primaryColor"
                  value={form.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  placeholder="#1F4700"
                  disabled={disabled || updateBatch.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">
                {locale === 'am' ? 'ሁለተኛ ቀለም (ወርቃማ)' : 'Secondary Color (Gold Accent)'}
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.secondaryColor || '#C5A059'}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
                  className="size-10 cursor-pointer rounded border border-border bg-transparent p-0"
                  disabled={disabled || updateBatch.isPending}
                />
                <Input
                  id="secondaryColor"
                  value={form.secondaryColor}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
                  placeholder="#C5A059"
                  disabled={disabled || updateBatch.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">
                {locale === 'am' ? 'አስመጪ / የደመቀ ቀለም' : 'Highlight / Emerald Accent'}
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.accentColor || '#10B981'}
                  onChange={(e) => handleChange('accentColor', e.target.value)}
                  className="size-10 cursor-pointer rounded border border-border bg-transparent p-0"
                  disabled={disabled || updateBatch.isPending}
                />
                <Input
                  id="accentColor"
                  value={form.accentColor}
                  onChange={(e) => handleChange('accentColor', e.target.value)}
                  placeholder="#10B981"
                  disabled={disabled || updateBatch.isPending}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={disabled || updateBatch.isPending} className="min-w-32">
          {updateBatch.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {locale === 'am' ? 'በማስቀመጥ ላይ...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" />
              {locale === 'am' ? 'ብራንዲንግ አስቀምጥ' : 'Save Branding'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

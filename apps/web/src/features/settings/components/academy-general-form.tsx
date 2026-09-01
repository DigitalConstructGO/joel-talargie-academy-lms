'use client';

import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { useUpdateSettingsBatch } from '../hooks/use-settings';
import type { AcademyGeneralSettings } from '../types/settings.types';

import { useLanguage } from '@/lib/i18n/language-provider';

export function AcademyGeneralForm({
  initialData,
  disabled = false,
}: {
  initialData: AcademyGeneralSettings;
  disabled?: boolean;
}) {
  const { locale } = useLanguage();
  const updateBatch = useUpdateSettingsBatch();
  const [form, setForm] = useState<AcademyGeneralSettings>(initialData);

  function handleChange<K extends keyof AcademyGeneralSettings>(
    key: K,
    value: AcademyGeneralSettings[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSocialChange(
    platform: keyof NonNullable<AcademyGeneralSettings['socialLinks']>,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks ?? {}),
        [platform]: value,
      },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateBatch.mutateAsync({
        reason: 'Updated Academy general information and contact details',
        items: [
          { key: 'academy.general', value: form },
          { key: 'academy.name', value: form.academyName },
          { key: 'academy.support_email', value: form.contactEmail },
          { key: 'academy.support_phone', value: form.contactPhone },
        ],
      });
      toast.success('Academy information saved successfully');
    } catch {
      toast.error('Failed to save settings', 'Please verify your permissions and try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{locale === 'am' ? 'የአካዳሚው ማንነት' : 'Academy Identity'}</CardTitle>
          <CardDescription>
            {locale === 'am'
              ? 'በይፋዊ ድህረ ገፅ እና በኢሜይሎች ላይ የሚታዩ አጠቃላይ የተቋም ዝርዝሮች።'
              : 'General institution details displayed throughout the public website and emails.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="academyName">{locale === 'am' ? 'የአካዳሚው ስም' : 'Academy Name'}</Label>
              <Input
                id="academyName"
                value={form.academyName}
                onChange={(e) => handleChange('academyName', e.target.value)}
                required
                disabled={disabled || updateBatch.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortDescription">
                {locale === 'am' ? 'አጭር መሪ ቃል' : 'Short Tagline'}
              </Label>
              <Input
                id="shortDescription"
                value={form.shortDescription}
                onChange={(e) => handleChange('shortDescription', e.target.value)}
                placeholder="e.g. Engineer Your Next Career Move"
                disabled={disabled || updateBatch.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{locale === 'am' ? 'ሙሉ መግለጫ' : 'Full Description'}</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detailed description of the academy mission and focus"
              disabled={disabled || updateBatch.isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{locale === 'am' ? 'ግንኙነት እና አድራሻ' : 'Contact & Location'}</CardTitle>
          <CardDescription>
            {locale === 'am'
              ? 'ለተማሪዎች ጥያቄ እና ድጋፍ የሚሆኑ ይፋዊ የእውቂያ ዝርዝሮች።'
              : 'Public contact details for learner inquiries and support.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">
                {locale === 'am' ? 'የእውቂያ ኢሜይል' : 'Contact Email'}
              </Label>
              <Input
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                required
                disabled={disabled || updateBatch.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">
                {locale === 'am' ? 'የእውቂያ ስልክ' : 'Contact Phone'}
              </Label>
              <Input
                id="contactPhone"
                value={form.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                placeholder="+251 900 000 000"
                disabled={disabled || updateBatch.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">
                {locale === 'am' ? 'የድህረ ገጽ አድራሻ (URL)' : 'Website URL'}
              </Label>
              <Input
                id="website"
                type="url"
                value={form.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://joeltalargie.com"
                disabled={disabled || updateBatch.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{locale === 'am' ? 'አካላዊ አድራሻ' : 'Physical Address'}</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Addis Ababa, Ethiopia"
                disabled={disabled || updateBatch.isPending}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{locale === 'am' ? 'የማህበራዊ ሚዲያ ሊንኮች' : 'Social Media Links'}</CardTitle>
          <CardDescription>
            {locale === 'am'
              ? 'በታችኛው ክፍል እና ርዕሶች ላይ የሚታዩ ይፋዊ ማህበራዊ ገጾች።'
              : 'Official social profile links displayed in the footer and headers.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="twitter">X / Twitter</Label>
              <Input
                id="twitter"
                value={form.socialLinks?.twitter ?? ''}
                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                placeholder="https://twitter.com/..."
                disabled={disabled || updateBatch.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={form.socialLinks?.linkedin ?? ''}
                onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/company/..."
                disabled={disabled || updateBatch.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={form.socialLinks?.github ?? ''}
                onChange={(e) => handleSocialChange('github', e.target.value)}
                placeholder="https://github.com/..."
                disabled={disabled || updateBatch.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                value={form.socialLinks?.youtube ?? ''}
                onChange={(e) => handleSocialChange('youtube', e.target.value)}
                placeholder="https://youtube.com/@..."
                disabled={disabled || updateBatch.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={form.socialLinks?.facebook ?? ''}
                onChange={(e) => handleSocialChange('facebook', e.target.value)}
                placeholder="https://facebook.com/..."
                disabled={disabled || updateBatch.isPending}
              />
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
              {locale === 'am' ? 'አጠቃላይ መረጃ አስቀምጥ' : 'Save General Info'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

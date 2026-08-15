'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';
import { adminStorageApi } from '@/features/catalog/api/admin-storage.api';

interface ImageUploadFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  aspectRatio?: 'video' | 'square' | 'banner';
}

export function ImageUploadField({
  id,
  label,
  value,
  onChange,
  description,
  placeholder = '/images/hero/network-abstract.jpg',
  disabled = false,
  aspectRatio = 'video',
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', 'Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', 'Image size must be less than 10MB.');
      return;
    }

    try {
      setIsUploading(true);
      const res = await adminStorageApi.uploadCourseThumbnail(file);
      const key = res.thumbnailKey || res.storageKey || '';
      const cleanKey = key.replace(/^course-thumbnails\//, '');
      const publicUrl = `/api/v1/storage/course-thumbnails/${cleanKey}`;
      onChange(publicUrl);
      toast.success('Image uploaded successfully');
    } catch {
      toast.error('Upload failed', 'Failed to upload image. Please check your permissions.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square max-w-44'
      : aspectRatio === 'banner'
        ? 'aspect-16/6 max-w-lg'
        : 'aspect-video max-w-md';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor={id} className="text-sm font-semibold">
            {label}
          </Label>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {showUrlInput ? 'Hide URL field' : 'Edit URL manually'}
        </Button>
      </div>

      {/* Upload Zone & Preview */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {value ? (
          <div className="relative group overflow-hidden rounded-xl border border-border bg-muted/40 shadow-xs">
            <div className={`relative ${aspectClass} w-full bg-surface-dark/10`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt={label}
                className="size-full object-cover"
                onError={() => {}}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="gap-1.5 shadow-md"
              >
                {isUploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="size-3.5" />
                )}
                Change
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onChange('')}
                disabled={disabled || isUploading}
                className="gap-1.5 shadow-md"
              >
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
            className={`flex ${aspectClass} w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-center transition-colors hover:border-brand/50 hover:bg-muted/40 ${
              disabled || isUploading ? 'cursor-not-allowed opacity-60' : ''
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-8 animate-spin text-brand" />
                <p className="text-xs text-muted-foreground">Uploading image...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <ImagePlus className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Click to upload image</p>
                  <p className="text-[10px] text-muted-foreground">PNG, JPG, WebP up to 10MB</p>
                </div>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          onChange={handleFileSelected}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>

      {/* Manual URL Input (collapsible) */}
      {showUrlInput && (
        <div className="space-y-1.5 pt-1">
          <Label htmlFor={`${id}-url`} className="text-xs text-muted-foreground">
            Image Asset URL / Path
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id={`${id}-url`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled || isUploading}
              className="text-xs"
            />
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange('')}
                className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

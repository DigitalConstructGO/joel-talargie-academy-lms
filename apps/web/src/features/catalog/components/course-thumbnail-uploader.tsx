'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Camera, ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CourseThumbnail } from './course-thumbnail';
import { adminStorageApi } from '../api/admin-storage.api';
import { formatFileSize } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

export interface CourseThumbnailUploaderProps {
  value?: string | null;
  onChange: (thumbnailKey: string | null) => void;
  title?: string;
  categoryName?: string;
  categorySlug?: string;
  disabled?: boolean;
  className?: string;
}

export function CourseThumbnailUploader({
  value,
  onChange,
  title = 'Course thumbnail',
  categoryName,
  categorySlug,
  disabled = false,
  className,
}: CourseThumbnailUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL when component unmounts or previewUrl changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);
      setIsUploading(true);

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setFileDetails({ name: file.name, size: file.size });

      try {
        const result = await adminStorageApi.uploadCourseThumbnail(file);
        const uploadedKey = result.thumbnailKey || result.storageKey || null;
        onChange(uploadedKey);
        toast.success('Thumbnail uploaded successfully');
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Could not upload thumbnail. Please try again.';
        setError(message);
        toast.error('Upload failed', message);
      } finally {
        setIsUploading(false);
      }
    },
    [onChange],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        const rejectionError = rejections[0]?.errors[0]?.message ?? 'File not accepted';
        setError(rejectionError);
        toast.error('Invalid file', rejectionError);
        return;
      }

      if (acceptedFiles.length > 0 && acceptedFiles[0]) {
        void handleUpload(acceptedFiles[0]);
      }
    },
    [handleUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    maxSize: MAX_THUMBNAIL_BYTES,
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  function handleRemove() {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileDetails(null);
    setError(null);
    onChange(null);
    toast.success('Thumbnail removed');
  }

  const hasThumbnail = Boolean(value || previewUrl);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid gap-6 sm:grid-cols-2 items-start">
        {/* Preview Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Preview</span>
            {hasThumbnail ? (
              <Badge variant="success" className="text-[10px]">
                {previewUrl ? 'Uploaded image' : 'Custom thumbnail'}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                Default placeholder
              </Badge>
            )}
          </div>
          <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <CourseThumbnail
              title={title}
              categoryName={categoryName}
              categorySlug={categorySlug}
              thumbnailKey={value}
              thumbnailUrl={previewUrl}
              className="aspect-video w-full"
            />
            {isUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-xs">
                <Loader2 className="size-8 animate-spin text-brand" />
                <p className="text-xs font-medium text-foreground">Uploading thumbnail...</p>
              </div>
            )}
          </div>
          {fileDetails && (
            <p className="text-xs text-muted-foreground truncate">
              {fileDetails.name} ({formatFileSize(fileDetails.size)})
            </p>
          )}
        </div>

        {/* Upload Dropzone / Controls */}
        <div className="space-y-3">
          <div
            {...getRootProps()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-8 text-center transition-colors hover:border-brand/50 hover:bg-muted/40',
              isDragActive && 'border-brand bg-brand/5',
              (disabled || isUploading) && 'pointer-events-none opacity-50',
            )}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            {hasThumbnail ? (
              <Camera className="size-8 text-muted-foreground" aria-hidden="true" />
            ) : (
              <UploadCloud className="size-8 text-muted-foreground" aria-hidden="true" />
            )}
            <p className="text-sm font-medium text-foreground">
              {isDragActive
                ? 'Drop image here'
                : hasThumbnail
                  ? 'Drag & drop to replace image'
                  : 'Drag & drop course thumbnail'}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, WebP up to {formatFileSize(MAX_THUMBNAIL_BYTES)} (16:9 recommended)
            </p>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              {isUploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : hasThumbnail ? (
                <ImagePlus className="size-3.5" />
              ) : (
                <UploadCloud className="size-3.5" />
              )}
              {hasThumbnail ? 'Change image' : 'Choose image'}
            </Button>
            {hasThumbnail && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-destructive"
                onClick={handleRemove}
                disabled={disabled || isUploading}
              >
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

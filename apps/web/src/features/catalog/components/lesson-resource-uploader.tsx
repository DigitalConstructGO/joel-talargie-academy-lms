'use client';

import { useCallback, useRef, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import {
  FileText,
  FileUp,
  Link as LinkIcon,
  Loader2,
  Paperclip,
  UploadCloud,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { adminStorageApi } from '../api/admin-storage.api';
import { formatFileSize } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

const MAX_RESOURCE_BYTES = 50 * 1024 * 1024; // 50 MB

export interface UploadedResourceData {
  title: string;
  storageKey?: string;
  externalUrl?: string;
  originalFileName?: string;
  mimeType?: string;
  fileSize?: number;
}

interface LessonResourceUploaderProps {
  onResourceReady?: (resource: UploadedResourceData | null) => void;
  /** If provided, called directly to save to an existing lesson */
  onSaveResource?: (resource: UploadedResourceData) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function LessonResourceUploader({
  onResourceReady,
  onSaveResource,
  disabled = false,
  className,
}: LessonResourceUploaderProps) {
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [title, setTitle] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedData, setUploadedData] = useState<UploadedResourceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (file: File, customTitle?: string) => {
      setError(null);
      setIsUploading(true);
      setSelectedFile(file);

      const resourceTitle =
        customTitle?.trim() ||
        title.trim() ||
        file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      setTitle(resourceTitle);

      try {
        const result = await adminStorageApi.uploadLessonResource(file);
        const data: UploadedResourceData = {
          title: resourceTitle,
          storageKey: result.storageKey || undefined,
          originalFileName: result.originalFileName || file.name,
          mimeType: result.mimeType || file.type,
          fileSize: result.fileSize || file.size,
        };

        setUploadedData(data);
        onResourceReady?.(data);

        if (onSaveResource) {
          await onSaveResource(data);
          // Reset after save
          setSelectedFile(null);
          setUploadedData(null);
          setTitle('');
          toast.success('Resource uploaded and attached to lesson');
        } else {
          toast.success('File ready to attach');
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Could not upload resource file. Please try again.';
        setError(message);
        toast.error('Upload failed', message);
        setUploadedData(null);
        onResourceReady?.(null);
      } finally {
        setIsUploading(false);
      }
    },
    [title, onResourceReady, onSaveResource],
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
        void handleFileUpload(acceptedFiles[0]);
      }
    },
    [handleFileUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_RESOURCE_BYTES,
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  const handleLinkSubmit = async () => {
    if (!title.trim() || !externalUrl.trim()) return;
    if (!/^https:\/\//i.test(externalUrl.trim())) {
      setError('External URL must start with https://');
      return;
    }

    const data: UploadedResourceData = {
      title: title.trim(),
      externalUrl: externalUrl.trim(),
    };

    if (onSaveResource) {
      setIsUploading(true);
      try {
        await onSaveResource(data);
        setTitle('');
        setExternalUrl('');
        toast.success('External resource attached');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not attach resource.';
        toast.error('Failed to attach resource', message);
      } finally {
        setIsUploading(false);
      }
    } else {
      setUploadedData(data);
      onResourceReady?.(data);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadedData(null);
    setError(null);
    onResourceReady?.(null);
  };

  return (
    <div className={cn('space-y-3 rounded-xl border border-border bg-card/60 p-4', className)}>
      {/* Mode Switcher */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Paperclip className="size-3.5 text-primary" />
          <span>Lesson Resource</span>
        </div>
        <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors',
              mode === 'upload'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <FileUp className="size-3" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode('link')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors',
              mode === 'link'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <LinkIcon className="size-3" />
            External Link
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div className="space-y-3">
          {!selectedFile && !uploadedData ? (
            <div
              {...getRootProps()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30',
                isDragActive && 'border-primary bg-primary/5',
                (disabled || isUploading) && 'pointer-events-none opacity-50',
              )}
            >
              <input {...getInputProps()} ref={fileInputRef} />
              <UploadCloud className="size-7 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-xs font-medium text-foreground">
                  {isDragActive ? 'Drop file here' : 'Drag & drop resource file or click to browse'}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  PDF, DOCX, XLSX, PPTX, ZIP, MP3, MP4 up to {formatFileSize(MAX_RESOURCE_BYTES)}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">
                      {selectedFile?.name || uploadedData?.originalFileName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatFileSize(selectedFile?.size || uploadedData?.fileSize || 0)}
                      {uploadedData && ' · Ready to attach'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isUploading ? (
                    <div className="flex items-center gap-1.5 text-xs text-primary">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={handleClearFile}
                      disabled={disabled || isUploading}
                      title="Remove selected file"
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-border/40 pt-2.5">
                <Label htmlFor="uploaded-res-title" className="text-xs">
                  Display Title (Optional)
                </Label>
                <Input
                  id="uploaded-res-title"
                  value={title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setTitle(newTitle);
                    if (uploadedData) {
                      const updated = { ...uploadedData, title: newTitle };
                      setUploadedData(updated);
                      onResourceReady?.(updated);
                    }
                  }}
                  placeholder="e.g. Masterclass Cheatsheet PDF"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="link-res-title" className="text-xs">
                Resource Title
              </Label>
              <Input
                id="link-res-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (externalUrl.trim()) {
                    onResourceReady?.({ title: e.target.value, externalUrl: externalUrl.trim() });
                  }
                }}
                placeholder="e.g., GitHub Starter Repository"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link-res-url" className="text-xs">
                External URL (https://)
              </Label>
              <Input
                id="link-res-url"
                value={externalUrl}
                onChange={(e) => {
                  setExternalUrl(e.target.value);
                  if (title.trim()) {
                    onResourceReady?.({ title: title.trim(), externalUrl: e.target.value });
                  }
                }}
                placeholder="https://github.com/..."
                className="h-8 text-xs"
              />
            </div>
          </div>

          {onSaveResource && (
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleLinkSubmit}
                disabled={!title.trim() || !externalUrl.trim() || isUploading}
              >
                {isUploading && <Loader2 className="size-3.5 animate-spin" />}
                Add External Link
              </Button>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}

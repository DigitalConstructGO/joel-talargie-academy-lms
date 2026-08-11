'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { File as FileIcon, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSizeBytes?: number;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  onFilesSelected,
  accept,
  maxSizeBytes,
  maxFiles = 1,
  disabled,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        setError(rejections[0]?.errors[0]?.message ?? 'File was rejected');
        return;
      }
      setError(null);
      setFiles(accepted);
      onFilesSelected(accepted);
    },
    [onFilesSelected],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: maxSizeBytes,
    maxFiles,
    disabled,
  });

  function removeFile(name: string) {
    const next = files.filter((file) => file.name !== name);
    setFiles(next);
    onFilesSelected(next);
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-10 text-center transition-colors hover:border-brand/50 hover:bg-muted/40',
          isDragActive && 'border-brand bg-brand/5',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">
          {isDragActive ? 'Drop the file here' : 'Drag & drop a file, or click to browse'}
        </p>
        {maxSizeBytes && (
          <p className="text-xs text-muted-foreground">
            Maximum size {formatFileSize(maxSizeBytes)}
          </p>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.name}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={() => removeFile(file.name)}
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

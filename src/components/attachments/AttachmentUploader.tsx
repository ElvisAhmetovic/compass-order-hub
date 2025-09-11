import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileImage, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface AttachmentFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  error?: string;
}

interface AttachmentUploaderProps {
  files: AttachmentFile[];
  onFilesChange: (files: AttachmentFile[]) => void;
  maxFiles?: number;
  maxSizeBytes?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;

const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  files,
  onFilesChange,
  maxFiles = MAX_FILES,
  maxSizeBytes = MAX_SIZE_BYTES,
  acceptedTypes = ACCEPTED_TYPES,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generatePreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use PNG, JPG, WebP or PDF files.`;
    }
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${Math.round(maxSizeBytes / (1024 * 1024))}MB`;
    }
    return null;
  }, [acceptedTypes, maxSizeBytes]);

  const addFiles = useCallback(async (newFiles: File[]) => {
    if (disabled) return;

    // Check file count limit
    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }

    const processedFiles: AttachmentFile[] = [];

    for (const file of newFiles) {
      const error = validateFile(file);
      const preview = await generatePreview(file);

      processedFiles.push({
        id: crypto.randomUUID(),
        file,
        preview,
        progress: 0,
        error: error || undefined
      });

      if (error) {
        toast({
          title: "File validation failed",
          description: error,
          variant: "destructive",
        });
      }
    }

    onFilesChange([...files, ...processedFiles]);
  }, [files, maxFiles, disabled, validateFile, generatePreview, onFilesChange]);

  const removeFile = useCallback((fileId: string) => {
    if (disabled) return;
    onFilesChange(files.filter(f => f.id !== fileId));
  }, [files, disabled, onFilesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(false);
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, [disabled, addFiles]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (disabled) return;

    const items = Array.from(e.clipboardData.items);
    const pastedFiles: File[] = [];

    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) pastedFiles.push(file);
      }
    }

    if (pastedFiles.length > 0) {
      e.preventDefault();
      addFiles(pastedFiles);
    }
  }, [disabled, addFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [addFiles]);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4" onPaste={handlePaste} tabIndex={0}>
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-foreground mb-2">
          <span className="font-semibold">Click to upload</span> or drag & drop files
        </p>
        <p className="text-xs text-muted-foreground mb-2">
          Or paste a screenshot with Ctrl/⌘+V
        </p>
        <p className="text-xs text-muted-foreground">
          Up to {maxFiles} files, max {Math.round(maxSizeBytes / (1024 * 1024))}MB each (PNG/JPG/WebP/PDF)
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          className="hidden"
          onChange={handleFileInput}
          disabled={disabled}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((attachmentFile) => (
            <div
              key={attachmentFile.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg border bg-card
                ${attachmentFile.error ? 'border-destructive bg-destructive/5' : 'border-border'}
              `}
            >
              {/* File Preview/Icon */}
              <div className="flex-shrink-0">
                {attachmentFile.preview ? (
                  <img
                    src={attachmentFile.preview}
                    alt={attachmentFile.file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    {getFileIcon(attachmentFile.file)}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {attachmentFile.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachmentFile.file.size)}
                </p>
                {attachmentFile.error && (
                  <p className="text-xs text-destructive mt-1">
                    {attachmentFile.error}
                  </p>
                )}
              </div>

              {/* Progress/Status */}
              <div className="flex-shrink-0">
                {attachmentFile.progress > 0 && attachmentFile.progress < 100 ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs text-muted-foreground">
                      {attachmentFile.progress}%
                    </span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(attachmentFile.id)}
                    disabled={disabled}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttachmentUploader;
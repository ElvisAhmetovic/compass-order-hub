import React, { useState, useRef, useCallback } from 'react';
import { Upload, File, Image, X, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  AttachmentUpload, 
  TicketAttachment, 
  ATTACHMENT_LIMITS 
} from '@/types/ticket-attachments';
import { 
  compressImage, 
  getImageDimensions, 
  isImageFile,
  getFilePreview,
  revokeFilePreview
} from '@/utils/imageUtils';

interface AttachmentUploaderProps {
  ticketId?: string;
  onAttachmentsChange?: (attachments: TicketAttachment[]) => void;
  className?: string;
  disabled?: boolean;
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  ticketId,
  onAttachmentsChange,
  className = '',
  disabled = false
}) => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<AttachmentUpload[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ATTACHMENT_LIMITS.ALLOWED_TYPES.includes(file.type as any)) {
      return 'Unsupported file type. Please use PNG, JPG, WebP, or PDF files.';
    }
    if (file.size > ATTACHMENT_LIMITS.MAX_SIZE_BYTES) {
      return `File is too large. Maximum size is ${ATTACHMENT_LIMITS.MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const generateUniqueId = () => crypto.randomUUID();

  const addToQueue = useCallback((files: File[]) => {
    if (disabled) return;

    const currentCount = uploads.length;
    const newFiles = files.slice(0, ATTACHMENT_LIMITS.MAX_FILES - currentCount);
    
    if (newFiles.length < files.length) {
      toast({
        title: "File limit exceeded",
        description: `Maximum ${ATTACHMENT_LIMITS.MAX_FILES} files allowed.`,
        variant: "destructive"
      });
    }

    const validUploads: AttachmentUpload[] = [];
    
    newFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        toast({
          title: "Invalid file",
          description: error,
          variant: "destructive"
        });
        return;
      }

      validUploads.push({
        id: generateUniqueId(),
        file,
        status: 'pending',
        progress: 0
      });
    });

    setUploads(prev => [...prev, ...validUploads]);

    // Start uploading if ticketId is available
    if (ticketId && validUploads.length > 0) {
      validUploads.forEach(upload => uploadFile(upload));
    }
  }, [uploads.length, disabled, ticketId]);

  const uploadFile = async (upload: AttachmentUpload) => {
    if (!user || !ticketId) return;

    setUploads(prev => prev.map(u => 
      u.id === upload.id 
        ? { ...u, status: 'uploading', progress: 0 }
        : u
    ));

    try {
      let fileToUpload = upload.file;

      // Compress images if needed
      if (isImageFile(upload.file.type)) {
        fileToUpload = await compressImage(upload.file);
      }

      // Generate file path
      const fileExt = fileToUpload.name.split('.').pop()?.toLowerCase() || 'bin';
      const fileName = `${generateUniqueId()}.${fileExt}`;
      const filePath = `ticket_attachments/${ticketId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(filePath, fileToUpload, {
          contentType: fileToUpload.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploads(prev => prev.map(u => 
        u.id === upload.id ? { ...u, progress: 50 } : u
      ));

      // Get image dimensions if it's an image
      let width: number | undefined;
      let height: number | undefined;
      
      if (isImageFile(fileToUpload.type)) {
        try {
          const dimensions = await getImageDimensions(fileToUpload);
          width = dimensions.width;
          height = dimensions.height;
        } catch (error) {
          console.warn('Failed to get image dimensions:', error);
        }
      }

      // Create database record
      const { data: attachment, error: dbError } = await supabase
        .from('ticket_attachments')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          path: filePath,
          mime_type: fileToUpload.type,
          size_bytes: fileToUpload.size,
          width,
          height,
          original_name: upload.file.name
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploads(prev => prev.map(u => 
        u.id === upload.id 
          ? { ...u, status: 'completed', progress: 100, attachment }
          : u
      ));

      // Notify parent component
      if (onAttachmentsChange) {
        const allAttachments = uploads
          .filter(u => u.status === 'completed' && u.attachment)
          .map(u => u.attachment!)
          .concat([attachment]);
        onAttachmentsChange(allAttachments);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploads(prev => prev.map(u => 
        u.id === upload.id 
          ? { ...u, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
          : u
      ));
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: "destructive"
      });
    }
  };

  const retryUpload = (uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (upload && ticketId) {
      uploadFile(upload);
    }
  };

  const removeUpload = async (uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload) return;

    // If completed, remove from storage and database
    if (upload.attachment && ticketId) {
      try {
        await supabase.storage
          .from('ticket-attachments')
          .remove([upload.attachment.path]);

        await supabase
          .from('ticket_attachments')
          .delete()
          .eq('id', upload.attachment.id);
      } catch (error) {
        console.error('Error removing attachment:', error);
      }
    }

    setUploads(prev => prev.filter(u => u.id !== uploadId));
  };

  // Clipboard paste handler
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (disabled) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      addToQueue(files);
    }
  }, [addToQueue, disabled]);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    addToQueue(files);
  };

  // File input handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    addToQueue(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Register paste listener
  React.useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const renderFilePreview = (upload: AttachmentUpload) => {
    const isImage = isImageFile(upload.file.type);
    const isPdf = upload.file.type === 'application/pdf';
    
    return (
      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
        <div className="flex-shrink-0">
          {isImage ? (
            <div className="w-12 h-12 rounded overflow-hidden bg-muted">
              <img 
                src={getFilePreview(upload.file)} 
                alt={upload.file.name}
                className="w-full h-full object-cover"
                onLoad={(e) => {
                  // Clean up preview URL after a delay to ensure it's displayed
                  setTimeout(() => {
                    revokeFilePreview((e.target as HTMLImageElement).src);
                  }, 1000);
                }}
              />
            </div>
          ) : isPdf ? (
            <div className="w-12 h-12 rounded bg-red-100 flex items-center justify-center">
              <File className="w-6 h-6 text-red-600" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
              <File className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{upload.file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(upload.file.size / 1024 / 1024).toFixed(1)} MB
          </p>
          
          {upload.status === 'uploading' && (
            <Progress value={upload.progress} className="h-1 mt-1" />
          )}
          
          {upload.status === 'error' && (
            <div className="flex items-center mt-1 text-xs text-destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              {upload.error}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {upload.status === 'error' && ticketId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => retryUpload(upload.id)}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeUpload(upload.id)}
            className="h-8 w-8 p-0"
            disabled={upload.status === 'uploading'}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ATTACHMENT_LIMITS.ALLOWED_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Drag & drop files here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl/⌘+V</kbd> to paste screenshots
          </p>
          <p className="text-xs text-muted-foreground">
            Up to {ATTACHMENT_LIMITS.MAX_FILES} files, max {ATTACHMENT_LIMITS.MAX_SIZE_MB}MB each. 
            Images (PNG/JPG/WebP) and PDF supported.
          </p>
        </div>
      </div>

      {/* File List */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Attachments ({uploads.length})</p>
          {uploads.map(upload => (
            <div key={upload.id}>
              {renderFilePreview(upload)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
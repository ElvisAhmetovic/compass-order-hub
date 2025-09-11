import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, Image, X, Clipboard, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AttachmentFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  error?: string;
}

interface CreateTechSupportWithImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTechSupportWithImageModal: React.FC<CreateTechSupportWithImageModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [company_name, setCompanyName] = useState('');
  const [problem_description, setProblemDescription] = useState('');
  const [action_needed, setActionNeeded] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isPasteReady, setIsPasteReady] = useState(false);
  const [totalSize, setTotalSize] = useState(0);
  
  const { user } = useAuth();
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File size limits (in bytes)
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB per file
  const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total

  const defaultEmails = [
    'angelina@abmedia-team.com',
    'service@team-abmedia.com',
    'thomas.thomasklein@gmail.com',
    'kleinabmedia@gmail.com',
    'jungabmedia@gmail.com',
    'wolfabmedia@gmail.com',
    'marcusabmedia@gmail.com',
    'paulkatz.abmedia@gmail.com'
  ];

  // Generate preview for image files
  const generatePreview = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }
    return undefined;
  };

  // Compress image if it's too large
  const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/') || file.size <= MAX_FILE_SIZE) {
      return file;
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = document.createElement('img');
      
      img.onload = () => {
        // Calculate new dimensions to reduce file size
        let { width, height } = img;
        const maxDimension = 1200;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8 // 80% quality
        );
      };
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Validate file before adding
  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Only image files are allowed';
    }
    
    if (file.size > MAX_FILE_SIZE * 2) { // Allow 2x limit before compression
      return 'File is too large (maximum 4MB)';
    }
    
    return null;
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Add files to attachments
  const addFiles = useCallback(async (newFiles: File[]) => {
    const validFiles: File[] = [];
    
    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: "File Error",
          description: `${file.name}: ${error}`,
          variant: "destructive",
        });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Check total size
    const currentTotalSize = attachments.reduce((sum, att) => sum + att.file.size, 0);
    const newTotalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
    
    if (currentTotalSize + newTotalSize > MAX_TOTAL_SIZE) {
      toast({
        title: "Size Limit Exceeded",
        description: `Total upload size cannot exceed ${formatFileSize(MAX_TOTAL_SIZE)}`,
        variant: "destructive",
      });
      return;
    }

    for (const file of validFiles) {
      try {
        const id = Math.random().toString(36).substr(2, 9);
        
        // Compress if needed
        let processedFile = file;
        if (file.size > MAX_FILE_SIZE) {
          processedFile = await compressImage(file);
          toast({
            title: "Image Compressed",
            description: `${file.name} was compressed to reduce size`,
          });
        }
        
        const preview = await generatePreview(processedFile);
        
        const attachmentFile: AttachmentFile = {
          id,
          file: processedFile,
          preview,
          progress: 100,
        };

        setAttachments(prev => {
          const updated = [...prev, attachmentFile];
          const newSize = updated.reduce((sum, att) => sum + att.file.size, 0);
          setTotalSize(newSize);
          return updated;
        });
      } catch (error) {
        console.error('Error processing file:', error);
        toast({
          title: "Processing Error",
          description: `Failed to process ${file.name}`,
          variant: "destructive",
        });
      }
    }
  }, [attachments]);

  // Handle paste events
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = Array.from(clipboardData.items);
    const pastedFiles: File[] = [];

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          pastedFiles.push(file);
        }
      }
    }

    if (pastedFiles.length > 0) {
      e.preventDefault();
      await addFiles(pastedFiles);
      toast({
        title: "Image pasted successfully!",
        description: `${pastedFiles.length} image(s) added from clipboard`,
      });
    }
  }, [addFiles]);

  // Global paste handler
  useEffect(() => {
    if (!isOpen) return;

    const globalPasteHandler = (e: ClipboardEvent) => {
      handlePaste(e);
    };

    document.addEventListener('paste', globalPasteHandler);
    setIsPasteReady(true);

    return () => {
      document.removeEventListener('paste', globalPasteHandler);
      setIsPasteReady(false);
    };
  }, [isOpen, handlePaste]);

  // Focus management
  useEffect(() => {
    if (isOpen && dropZoneRef.current) {
      dropZoneRef.current.focus();
    }
  }, [isOpen]);

  // Handle file input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  // Remove attachment
  const removeFile = (fileId: string) => {
    setAttachments(prev => {
      const updated = prev.filter(file => file.id !== fileId);
      const newSize = updated.reduce((sum, att) => sum + att.file.size, 0);
      setTotalSize(newSize);
      return updated;
    });
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Serialize attachments for submission
  const serializeAttachments = async (attachments: AttachmentFile[]) => {
    const serializedAttachments = [];
    for (const attachment of attachments) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(attachment.file);
      });

      serializedAttachments.push({
        name: attachment.file.name,
        type: attachment.file.type,
        size: attachment.file.size,
        base64: base64.split(',')[1], // Remove data:image/png;base64, prefix
      });
    }
    return serializedAttachments;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!company_name.trim() || !problem_description.trim() || !action_needed.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a ticket",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const serializedAttachments = await serializeAttachments(attachments);
      
      // Calculate payload size
      const payloadSize = JSON.stringify({
        company_name: company_name.trim(),
        problem_description: problem_description.trim(),
        action_needed: action_needed.trim(),
        attachments: serializedAttachments
      }).length;

      console.log('Payload size:', formatFileSize(payloadSize));
      console.log('Attachment count:', serializedAttachments.length);
      console.log('Individual file sizes:', attachments.map(a => ({ name: a.file.name, size: formatFileSize(a.file.size) })));

      // Warn about large payloads
      if (payloadSize > 5 * 1024 * 1024) { // 5MB
        toast({
          title: "Large Upload",
          description: "This is a large upload and may take some time...",
        });
      }

      const response = await supabase.functions.invoke('create-tech-support-ticket', {
        body: {
          company_name: company_name.trim(),
          problem_description: problem_description.trim(),
          action_needed: action_needed.trim(),
          attachments: serializedAttachments
        }
      });

      if (response.error) {
        console.error('Error creating ticket:', response.error);
        console.error('Response data:', response.data);
        console.error('Payload size:', formatFileSize(payloadSize));
        console.error('Attachment details:', attachments.map(a => ({ 
          name: a.file.name, 
          size: a.file.size, 
          type: a.file.type 
        })));
        
        // Provide more specific error messages
        let errorMessage = response.error.message || 'Failed to create ticket';
        
        if (errorMessage.includes('payload') || errorMessage.includes('size')) {
          errorMessage = 'Upload too large. Try reducing image sizes or removing some attachments.';
        } else if (errorMessage.includes('timeout')) {
          errorMessage = 'Request timed out. Try reducing the number of attachments.';
        } else if (errorMessage.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: "Success",
        description: "Tech support ticket created successfully! Email notifications have been sent.",
      });

      // Reset form
      setCompanyName('');
      setProblemDescription('');
      setActionNeeded('');
      setAttachments([]);
      setTotalSize(0);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating tech support ticket:', error);
      
      // Retry logic for network errors
      if (error.message.includes('network') || error.message.includes('timeout')) {
        toast({
          title: "Network Error",
          description: "Connection failed. Please try again in a moment.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create tech support ticket",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Create Ticket with Image
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto">
          {/* Paste Zone - Prominent at the top */}
          <div
            ref={dropZoneRef}
            tabIndex={0}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              isPasteReady 
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                : 'border-border bg-muted/20'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className={`p-4 rounded-full ${isPasteReady ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Clipboard className={`w-8 h-8 ${isPasteReady ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {isPasteReady ? 'Ready to paste! Press Ctrl+V' : 'Image Upload Zone'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Take a screenshot and paste it here, or drag & drop image files
                </p>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Browse Files
                </Button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Show attached images */}
          {attachments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Attached Images ({attachments.length})</Label>
                <div className="text-xs text-muted-foreground">
                  Total: {formatFileSize(totalSize)} / {formatFileSize(MAX_TOTAL_SIZE)}
                </div>
              </div>
              
              {/* Size warning */}
              {totalSize > MAX_TOTAL_SIZE * 0.8 && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Approaching size limit. Large uploads may fail.</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="relative border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {attachment.preview && (
                          <img 
                            src={attachment.preview} 
                            alt="Preview" 
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(attachment.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={company_name}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="problem_description">Problem Description *</Label>
              <Textarea
                id="problem_description"
                value={problem_description}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Describe the problem in detail"
                rows={4}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="action_needed">Action Needed *</Label>
              <Textarea
                id="action_needed"
                value={action_needed}
                onChange={(e) => setActionNeeded(e.target.value)}
                placeholder="What action is needed to resolve this?"
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Email Notifications</h4>
            <p className="text-sm text-muted-foreground mb-2">
              The following team members will be notified:
            </p>
            <div className="flex flex-wrap gap-2">
              {defaultEmails.map((email, index) => (
                <span key={index} className="px-2 py-1 bg-background border rounded text-xs">
                  {email}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTechSupportWithImageModal;
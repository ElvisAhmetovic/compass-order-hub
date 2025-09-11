import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Image, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import AttachmentUploader from '@/components/attachments/AttachmentUploader';

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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    problem_description: '',
    action_needed: ''
  });
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const { user } = useAuth();

  const serializeAttachmentsAsBase64 = async () => {
    const serializedAttachments = [];
    for (const attachment of attachments) {
      if (attachment.error) continue; // Skip files with errors

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

    if (!formData.company_name.trim() || !formData.problem_description.trim() || !formData.action_needed.trim()) {
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
      // Serialize attachments
      const serializedAttachments = await serializeAttachmentsAsBase64();

      console.log('Creating ticket with attachments:', {
        company_name: formData.company_name,
        attachmentCount: serializedAttachments.length
      });

      // Call the atomic API
      const response = await fetch(
        `https://fjybmlugiqmiggsdrkiq.supabase.co/functions/v1/create-tech-support-ticket`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            company_name: formData.company_name.trim(),
            problem_description: formData.problem_description.trim(),
            action_needed: formData.action_needed.trim(),
            attachments: serializedAttachments
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error occurred' }));
        
        // Show more specific error messages
        let errorMessage = errorData.error || 'Failed to create ticket';
        
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please refresh the page and try again.';
        } else if (response.status === 413 || errorMessage.includes('payload')) {
          errorMessage = 'Upload too large. Please reduce image sizes or number of files.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again in a moment.';
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Ticket created successfully:', result);

      // Handle both old and new response formats
      const ticketId = result.ticketId || result.id;
      const attachmentCount = result.attachmentCount || 0;
      const emailSent = result.emailSent !== false; // Default to true for backward compatibility

      let successMessage = 'Tech support ticket created successfully!';
      if (attachmentCount > 0) {
        successMessage += ` ${attachmentCount} attachment(s) uploaded.`;
        
        // Warn if not all attachments were uploaded
        if (!result.attachmentUploadedSuccessfully && result.attachmentUploadedSuccessfully !== undefined) {
          successMessage += ' (Some attachments failed to upload)';
        }
      }
      if (!emailSent) {
        successMessage += ' (Email notification may be delayed)';
      }

      toast({
        title: "Success",
        description: successMessage,
      });

      // Reset form
      setFormData({
        company_name: '',
        problem_description: '',
        action_needed: ''
      });
      setAttachments([]);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating tech support ticket:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create tech support ticket",
        variant: "destructive",
      });
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
          <div className="grid gap-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                type="text"
                placeholder="Enter company name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="problem_description">Problem Description *</Label>
              <Textarea
                id="problem_description"
                placeholder="Describe the problem in detail..."
                value={formData.problem_description}
                onChange={(e) => setFormData(prev => ({ ...prev, problem_description: e.target.value }))}
                disabled={loading}
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="action_needed">Action Needed *</Label>
              <Textarea
                id="action_needed"
                placeholder="What action should be taken to resolve this?"
                value={formData.action_needed}
                onChange={(e) => setFormData(prev => ({ ...prev, action_needed: e.target.value }))}
                disabled={loading}
                rows={4}
                required
              />
            </div>

            <div>
              <Label>Attachments</Label>
              <AttachmentUploader
                files={attachments}
                onFilesChange={setAttachments}
                disabled={loading}
                enableGlobalPaste={true}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTechSupportWithImageModal;
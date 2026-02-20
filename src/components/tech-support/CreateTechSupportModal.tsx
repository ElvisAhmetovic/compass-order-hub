import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

interface CreateTechSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

import { NOTIFICATION_EMAIL_LIST } from '@/constants/notificationEmails';

const CreateTechSupportModal = ({ isOpen, onClose, onSuccess }: CreateTechSupportModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    problem_description: '',
    action_needed: ''
  });
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const { user } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const serializeAttachmentsAsBase64 = async (): Promise<any[]> => {
    const validAttachments = attachments.filter(attachment => !attachment.error);
    
    const serializedAttachments = await Promise.all(
      validAttachments.map(async (attachment) => {
        return new Promise<any>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1]; // Remove data:... prefix
            
            resolve({
              name: attachment.file.name,
              type: attachment.file.type,
              size: attachment.file.size,
              base64: base64Data
            });
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(attachment.file);
        });
      })
    );
    
    return serializedAttachments;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a ticket",
        variant: "destructive",
      });
      return;
    }

    if (!formData.company_name.trim() || !formData.problem_description.trim() || !formData.action_needed.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
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

      // Call edge function using Supabase SDK for proper CORS handling
      const { data: result, error: invokeError } = await supabase.functions.invoke('create-tech-support-ticket', {
        body: {
          company_name: formData.company_name.trim(),
          problem_description: formData.problem_description.trim(),
          action_needed: formData.action_needed.trim(),
          attachments: serializedAttachments
        },
      });

      if (invokeError) {
        let errorMessage = invokeError.message || 'Failed to create ticket';
        throw new Error(errorMessage);
      }

      console.log('Ticket created successfully:', result);

      // Handle both old and new response formats
      const ticketId = result.ticketId || result.id;
      const attachmentCount = result.attachmentCount || 0;
      const emailSent = result.emailSent !== false; // Default to true for backward compatibility

      let successMessage = 'Tech support ticket created successfully!';
      if (attachmentCount > 0) {
        successMessage += ` ${attachmentCount} attachment(s) uploaded.`;
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
    } catch (error) {
      console.error('Error creating tech support ticket:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create tech support ticket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Tech Support Ticket</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Enter company name"
                required
              />
            </div>

            <div>
              <Label htmlFor="problem_description">Problem Description *</Label>
              <Textarea
                id="problem_description"
                value={formData.problem_description}
                onChange={(e) => handleInputChange('problem_description', e.target.value)}
                placeholder="Describe the technical problem or issue"
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="action_needed">Action Needed *</Label>
              <Textarea
                id="action_needed"
                value={formData.action_needed}
                onChange={(e) => handleInputChange('action_needed', e.target.value)}
                placeholder="Describe what needs to be done to resolve the issue"
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

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Email Notifications</h4>
            <p className="text-sm text-blue-700 mb-2">
              This tech support ticket will automatically send notifications to:
            </p>
            <div className="text-sm text-blue-600 space-y-1">
              {NOTIFICATION_EMAIL_LIST.map((email, index) => (
                <div key={index}>• {email}</div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTechSupportModal;
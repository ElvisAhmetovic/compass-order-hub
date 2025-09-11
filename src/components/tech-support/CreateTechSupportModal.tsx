import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { AttachmentUploader } from '@/components/attachments/AttachmentUploader';
import { TicketAttachment, AttachmentUpload } from '@/types/ticket-attachments';

interface CreateTechSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Default emails that will always receive notifications
const DEFAULT_EMAILS = [
  'angelina@abmedia-team.com',
  'service@team-abmedia.com',
  'thomas.thomasklein@gmail.com',
  'kleinabmedia@gmail.com',
  'jungabmedia@gmail.com',
  'wolfabmedia@gmail.com',
  'marcusabmedia@gmail.com',
  'paulkatz.abmedia@gmail.com'
];

const CreateTechSupportModal = ({ isOpen, onClose, onSuccess }: CreateTechSupportModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    problem_description: '',
    action_needed: ''
  });
  const [attachments, setAttachments] = useState<AttachmentUpload[]>([]);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const { user } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create draft ticket first to get ID for attachments
  const createDraftTicket = async () => {
    if (!user) return null;

    const ticketData = {
      company_name: formData.company_name.trim() || 'Draft',
      problem_description: formData.problem_description.trim() || 'Draft',
      action_needed: formData.action_needed.trim() || 'Draft',
      status: 'draft' as const,
      created_by: user.id,
      created_by_name: user.full_name || user.email || 'Unknown User'
    };

    const { data, error } = await supabase
      .from('tech_support_tickets')
      .insert([ticketData])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  };

  const handleAttachmentsChange = (newAttachments: AttachmentUpload[]) => {
    setAttachments(newAttachments);
  };

  const sendNotificationEmail = async (ticketData: any) => {
    try {
      console.log('Sending notification email with ticket data:', ticketData);
      
      // Wait a moment to ensure all database operations are complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get actual attachment count from database
      const { data: attachmentData, error: attachmentError } = await supabase
        .from('ticket_attachments')
        .select('id')
        .eq('ticket_id', ticketData.id);
      
      if (attachmentError) {
        console.error('Error fetching attachment count:', attachmentError);
      }
      
      const actualAttachmentCount = attachmentData?.length || 0;
      console.log(`Actual attachment count from database: ${actualAttachmentCount}`);
      
      // Prepare the payload for the dedicated tech support edge function
      const emailPayload = {
        ticketData: {
          id: ticketData.id,
          company_name: ticketData.company_name,
          problem_description: ticketData.problem_description,
          action_needed: ticketData.action_needed,
          status: ticketData.status || 'in_progress',
          attachments_count: actualAttachmentCount,
          created_by_name: ticketData.created_by_name,
          created_at: ticketData.created_at
        },
        emails: DEFAULT_EMAILS
      };

      console.log('Tech support email payload being sent:', JSON.stringify(emailPayload, null, 2));

      // Call the dedicated tech support edge function
      console.log('Calling send-tech-support-notification edge function...');
      
      const response = await fetch(
        `https://fjybmlugiqmiggsdrkiq.supabase.co/functions/v1/send-tech-support-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeWJtbHVnaXFtaWdnc2Rya2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDYxNjAsImV4cCI6MjA2MDgyMjE2MH0.zdCS-vPtsg15ucfw0HAoNzNLbevhJA3njyLzf_XrzvQ`,
          },
          body: JSON.stringify(emailPayload),
        }
      );

      console.log('Tech support edge function response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Tech support edge function error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const emailResult = await response.json();
      console.log('Tech support emails sent successfully:', emailResult);

    } catch (error) {
      console.error('Error sending tech support notification email:', error);
      toast({
        title: "Warning",
        description: "Tech support ticket created but email notification failed",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Wait for all attachment uploads to complete
      const pendingUploads = attachments.filter(att => att.status === 'uploading' || att.status === 'pending');
      if (pendingUploads.length > 0) {
        toast({
          title: "Please wait",
          description: "Please wait for all attachments to finish uploading.",
          variant: "default",
        });
        setLoading(false);
        return;
      }

      // Check for any failed uploads
      const failedUploads = attachments.filter(att => att.status === 'error');
      if (failedUploads.length > 0) {
        toast({
          title: "Upload Error",
          description: "Some attachments failed to upload. Please retry or remove them.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create or update the ticket with final details
      const ticketData = {
        company_name: formData.company_name,
        problem_description: formData.problem_description,
        action_needed: formData.action_needed,
        status: 'in_progress' as const,
        created_by_name: user?.full_name || user?.email || 'Unknown',
        created_by: user?.id || null
      };

      let finalTicketId = ticketId;

      if (ticketId) {
        // Update the existing draft ticket
        const { error: updateError } = await supabase
          .from('tech_support_tickets')
          .update(ticketData)
          .eq('id', ticketId);

        if (updateError) {
          console.error('Error updating ticket:', updateError);
          toast({
            title: "Error",
            description: "Failed to update ticket. Please try again.",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Create a new ticket if none exists
        const { data: newTicket, error: insertError } = await supabase
          .from('tech_support_tickets')
          .insert(ticketData)
          .select()
          .single();

        if (insertError || !newTicket) {
          console.error('Error creating ticket:', insertError);
          toast({
            title: "Error",
            description: "Failed to create ticket. Please try again.",
            variant: "destructive",
          });
          return;
        }

        finalTicketId = newTicket.id;
      }

      // Wait for all attachment uploads to be fully processed in the database
      console.log('Waiting for all attachments to be processed...');
      let maxWaitTime = 10000; // 10 seconds max wait
      let waitTime = 0;
      const checkInterval = 500; // Check every 500ms
      
      while (waitTime < maxWaitTime) {
        const { data: dbAttachments } = await supabase
          .from('ticket_attachments')
          .select('id')
          .eq('ticket_id', finalTicketId);
        
        const completedAttachments = attachments.filter(att => att.status === 'completed');
        const dbCount = dbAttachments?.length || 0;
        
        console.log(`Database attachments: ${dbCount}, Completed uploads: ${completedAttachments.length}`);
        
        if (dbCount >= completedAttachments.length) {
          console.log('All attachments processed in database');
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waitTime += checkInterval;
      }

      // Send notification email with attachment information
      try {
        await sendNotificationEmail({ id: finalTicketId, ...ticketData });
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
        // Don't fail the ticket creation if email fails
        toast({
          title: "Warning",
          description: "Ticket created but notification email failed to send.",
          variant: "default",
        });
      }

      toast({
        title: "Success",
        description: "Tech support ticket created successfully!",
        variant: "default",
      });

      // Reset form and close modal
      setFormData({ company_name: '', problem_description: '', action_needed: '' });
      setAttachments([]);
      setTicketId(null);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize draft ticket when modal opens and user starts adding attachments
  const handleModalInteraction = async () => {
    if (!ticketId && user && isOpen) {
      try {
        const newTicketId = await createDraftTicket();
        setTicketId(newTicketId);
      } catch (error) {
        console.error('Failed to create draft ticket:', error);
      }
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
              <div className="mt-2">
                <AttachmentUploader
                  ticketId={ticketId || undefined}
                  onAttachmentsChange={handleAttachmentsChange}
                  disabled={loading}
                />
              </div>
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleModalInteraction}
                  className="text-xs"
                >
                  Enable drag & drop and paste for screenshots
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Email Notifications</h4>
            <p className="text-sm text-blue-700 mb-2">
              This tech support ticket will automatically send notifications to:
            </p>
            <div className="text-sm text-blue-600 space-y-1">
              {DEFAULT_EMAILS.map((email, index) => (
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
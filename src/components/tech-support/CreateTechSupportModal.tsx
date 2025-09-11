import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Please select a JPG or PNG image file",
          variant: "destructive",
        });
        return;
      }

      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string; name: string } | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `tech-support/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('team-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('team-files')
        .getPublicUrl(filePath);

      return { url: publicUrl, name: file.name };
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload attachment",
        variant: "destructive",
      });
      return null;
    }
  };

  const sendNotificationEmail = async (ticketData: any) => {
    try {
      // Prepare the payload for the dedicated tech support edge function
      const emailPayload = {
        ticketData: {
          id: ticketData.id,
          company_name: ticketData.company_name,
          problem_description: ticketData.problem_description,
          action_needed: ticketData.action_needed,
          status: ticketData.status || 'in_progress',
          attachment_url: ticketData.attachment_url,
          attachment_name: ticketData.attachment_name,
          created_by_name: ticketData.created_by_name,
          created_at: ticketData.created_at
        },
        emails: DEFAULT_EMAILS
      };

      console.log('Tech support email payload being sent:', JSON.stringify(emailPayload, null, 2));

      // Call the dedicated tech support edge function with fetch
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
      let attachmentUrl = null;
      let attachmentName = null;

      // Upload file if selected
      if (selectedFile) {
        const uploadResult = await uploadFile(selectedFile);
        if (uploadResult) {
          attachmentUrl = uploadResult.url;
          attachmentName = uploadResult.name;
        }
      }

      // Create tech support ticket
      const ticketData = {
        company_name: formData.company_name.trim(),
        problem_description: formData.problem_description.trim(),
        action_needed: formData.action_needed.trim(),
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        created_by: user.id,
        created_by_name: user.full_name || user.email || 'Unknown User'
      };

      const { data, error } = await supabase
        .from('tech_support_tickets')
        .insert([ticketData])
        .select()
        .single();

      if (error) throw error;

      // Send notification emails
      await sendNotificationEmail({ ...data, ...ticketData });

      toast({
        title: "Success",
        description: "Tech support ticket created successfully!",
      });

      // Reset form
      setFormData({
        company_name: '',
        problem_description: '',
        action_needed: ''
      });
      setSelectedFile(null);

      onSuccess();
    } catch (error) {
      console.error('Error creating tech support ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create tech support ticket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
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
              <Label>Screenshot/Attachment (JPG/PNG)</Label>
              <div className="mt-2">
                {selectedFile ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                    <span className="text-sm text-gray-700">{selectedFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">JPG or PNG (MAX 5MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </div>
                )}
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
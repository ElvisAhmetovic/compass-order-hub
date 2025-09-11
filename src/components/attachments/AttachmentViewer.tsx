import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TicketAttachment } from '@/types/ticket-attachments';

interface AttachmentViewerProps {
  ticketId: string;
  canDelete?: boolean;
  onAttachmentDeleted?: () => void;
}

interface AttachmentWithSignedUrl extends TicketAttachment {
  signedUrl?: string;
}

export const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  ticketId,
  canDelete = false,
  onAttachmentDeleted
}) => {
  const [attachments, setAttachments] = useState<AttachmentWithSignedUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching attachments:', error);
        toast({
          title: "Error",
          description: "Failed to load attachments.",
          variant: "destructive",
        });
        return;
      }

      // Generate signed URLs for each attachment
      const attachmentsWithUrls = await Promise.all(
        (data || []).map(async (attachment) => {
          try {
            const { data: signedUrlData } = await supabase.storage
              .from('ticket-attachments')
              .createSignedUrl(attachment.path, 60 * 60); // 1 hour expiry

            return {
              ...attachment,
              signedUrl: signedUrlData?.signedUrl
            };
          } catch (error) {
            console.error(`Error generating signed URL for ${attachment.path}:`, error);
            return attachment;
          }
        })
      );

      setAttachments(attachmentsWithUrls);
    } catch (error) {
      console.error('Error in fetchAttachments:', error);
      toast({
        title: "Error",
        description: "Failed to load attachments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchAttachments();
    }
  }, [ticketId]);

  // Add polling to refresh attachments periodically
  useEffect(() => {
    if (!ticketId) return;
    
    const pollInterval = setInterval(() => {
      fetchAttachments();
    }, 5000); // Poll every 5 seconds

    // Clean up interval
    return () => clearInterval(pollInterval);
  }, [ticketId]);

  const handleDelete = async (attachmentId: string, path: string) => {
    if (!canDelete) return;

    setDeletingIds(prev => new Set(prev).add(attachmentId));

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('ticket-attachments')
        .remove([path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('ticket_attachments')
        .delete()
        .eq('id', attachmentId);

      if (dbError) {
        console.error('Error deleting from database:', dbError);
        toast({
          title: "Error",
          description: "Failed to delete attachment.",
          variant: "destructive",
        });
      } else {
        setAttachments(prev => prev.filter(att => att.id !== attachmentId));
        onAttachmentDeleted?.();
        toast({
          title: "Success",
          description: "Attachment deleted successfully.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast({
        title: "Error",
        description: "Failed to delete attachment.",
        variant: "destructive",
      });
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(attachmentId);
        return newSet;
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  if (loading) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Attachments</h4>
        <div className="text-sm text-muted-foreground">Loading attachments...</div>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Attachments</h4>
        <div className="text-sm text-muted-foreground">No attachments</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Attachments ({attachments.length})</h4>
      <div className="grid gap-3">
        {attachments.map((attachment) => (
          <Card key={attachment.id} className="p-3">
            <div className="flex items-start gap-3">
              {/* Thumbnail/Preview */}
              <div className="flex-shrink-0">
                {isImage(attachment.mime_type) && attachment.signedUrl ? (
                  <img
                    src={attachment.signedUrl}
                    alt={attachment.original_name}
                    className="w-16 h-16 object-cover rounded border"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      📄
                    </span>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {attachment.original_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size_bytes)}
                  {attachment.width && attachment.height && (
                    <span> • {attachment.width}×{attachment.height}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {attachment.mime_type}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {attachment.signedUrl && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(attachment.signedUrl, '_blank')}
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = attachment.signedUrl!;
                        link.download = attachment.original_name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </>
                )}
                
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(attachment.id, attachment.path)}
                    disabled={deletingIds.has(attachment.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
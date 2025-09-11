import React, { useState, useEffect } from 'react';
import { FileImage, FileText, Download, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TicketAttachment {
  id: string;
  ticket_id: string;
  path: string;
  mime_type: string;
  size_bytes: number;
  original_name: string;
  width?: number;
  height?: number;
  created_at: string;
}

interface AttachmentViewerProps {
  ticketId: string;
  className?: string;
}

const AttachmentViewer: React.FC<AttachmentViewerProps> = ({ 
  ticketId, 
  className = "" 
}) => {
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, { url: string; expiresAt: number }>>({});

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setAttachments(data || []);
      
      // Generate signed URLs for viewing (60 minutes)
      const urlPromises = (data || []).map(async (attachment) => {
        const { data: signedUrl } = await supabase.storage
          .from('ticket-attachments')
          .createSignedUrl(attachment.path, 60 * 60); // 60 minutes
        
        return {
          id: attachment.id,
          url: signedUrl?.signedUrl || '',
          expiresAt: Date.now() + (60 * 60 * 1000) // 60 minutes from now
        };
      });

      const urlResults = await Promise.all(urlPromises);
      const urlMap: Record<string, { url: string; expiresAt: number }> = {};
      
      urlResults.forEach(result => {
        if (result.url) {
          urlMap[result.id] = {
            url: result.url,
            expiresAt: result.expiresAt
          };
        }
      });
      
      setSignedUrls(urlMap);
      
    } catch (error) {
      console.error('Error fetching attachments:', error);
      toast({
        title: "Error",
        description: "Failed to load attachments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSignedUrl = async (attachment: TicketAttachment): Promise<string> => {
    const cached = signedUrls[attachment.id];
    
    // Check if we have a valid cached URL
    if (cached && cached.expiresAt > Date.now() + (5 * 60 * 1000)) { // 5 minute buffer
      return cached.url;
    }

    // Generate new signed URL
    const { data: signedUrl } = await supabase.storage
      .from('ticket-attachments')
      .createSignedUrl(attachment.path, 60 * 60); // 60 minutes

    if (signedUrl?.signedUrl) {
      setSignedUrls(prev => ({
        ...prev,
        [attachment.id]: {
          url: signedUrl.signedUrl,
          expiresAt: Date.now() + (60 * 60 * 1000)
        }
      }));
      return signedUrl.signedUrl;
    }

    throw new Error('Failed to generate signed URL');
  };

  const handleDownload = async (attachment: TicketAttachment) => {
    try {
      const url = await getSignedUrl(attachment);
      
      // Create a temporary link and click it to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.original_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast({
        title: "Error",
        description: "Failed to download attachment",
        variant: "destructive",
      });
    }
  };

  const handleViewImage = async (attachment: TicketAttachment) => {
    try {
      const url = await getSignedUrl(attachment);
      setSelectedImage({ url, name: attachment.original_name });
    } catch (error) {
      console.error('Error viewing image:', error);
      toast({
        title: "Error",
        description: "Failed to load image",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <FileImage className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  useEffect(() => {
    fetchAttachments();
  }, [ticketId]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading attachments...</span>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        No attachments
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <h4 className="font-medium text-foreground">Attachments</h4>
        <Badge variant="secondary">{attachments.length}</Badge>
      </div>
      
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            {/* File Icon/Thumbnail */}
            <div className="flex-shrink-0">
              {isImage(attachment.mime_type) && signedUrls[attachment.id] ? (
                <img
                  src={signedUrls[attachment.id].url}
                  alt={attachment.original_name}
                  className="w-12 h-12 object-cover rounded border"
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center border">
                  {getFileIcon(attachment.mime_type)}
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {attachment.original_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.size_bytes)}
                {attachment.width && attachment.height && (
                  <span> • {attachment.width}×{attachment.height}</span>
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex items-center gap-1">
              {isImage(attachment.mime_type) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewImage(attachment)}
                  title="View image"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(attachment)}
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedImage?.name}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center">
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttachmentViewer;
export interface TicketAttachment {
  id: string;
  ticket_id: string;
  user_id: string;
  path: string;
  mime_type: string;
  size_bytes: number;
  width?: number;
  height?: number;
  original_name: string;
  created_at: string;
  signed_url?: string;
}

export interface AttachmentUpload {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  attachment?: TicketAttachment;
  error?: string;
}

export const ATTACHMENT_LIMITS = {
  MAX_FILES: 10,
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_TYPES: [
    'image/png',
    'image/jpeg', 
    'image/jpg',
    'image/webp',
    'application/pdf'
  ] as const,
  IMAGE_COMPRESSION: {
    MAX_WIDTH: 3000,
    MAX_SIZE_MB: 5,
    QUALITY: 0.85
  }
};
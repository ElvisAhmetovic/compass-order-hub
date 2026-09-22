import { useEffect, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { getTeamFileSignedUrl } from '@/utils/teamFiles';

interface TeamFileAttachmentProps {
  fileRef: string;
  fileName?: string | null;
  fileType?: string | null;
}

/**
 * Renders a file stored in the private team-files bucket using a short-lived
 * signed URL, so attachments are never publicly downloadable.
 */
const TeamFileAttachment = ({ fileRef, fileName, fileType }: TeamFileAttachmentProps) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getTeamFileSignedUrl(fileRef).then((signed) => {
      if (active) setUrl(signed);
    });
    return () => {
      active = false;
    };
  }, [fileRef]);

  if (!url) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-2">
        <Paperclip className="h-4 w-4" />
        {fileName || 'Attachment'}
      </span>
    );
  }

  if (fileType?.startsWith('image/')) {
    return (
      <img
        src={url}
        alt={fileName || 'Attachment'}
        className="max-w-full h-auto rounded cursor-pointer"
        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
      />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline flex items-center gap-2"
    >
      <Paperclip className="h-4 w-4" />
      {fileName || 'Attachment'}
    </a>
  );
};

export default TeamFileAttachment;

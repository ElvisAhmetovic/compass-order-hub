import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Uses DOMPurify to clean any potentially malicious content.
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
      'blockquote', 'pre', 'code',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'width', 'height',
      'style', 'class',
      'colspan', 'rowspan',
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORCE_BODY: true,
  });
};

/**
 * Sanitizes text content by escaping HTML entities.
 * Use this for plain text that should not contain any HTML.
 */
export const escapeHtml = (text: string): string => {
  if (!text) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Sanitizes a URL to prevent javascript: and data: protocol attacks.
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Block dangerous protocols
  if (
    trimmedUrl.startsWith('javascript:') ||
    trimmedUrl.startsWith('data:') ||
    trimmedUrl.startsWith('vbscript:')
  ) {
    return '';
  }
  
  return url;
};

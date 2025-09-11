import { ATTACHMENT_LIMITS } from '@/types/ticket-attachments';

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Get image dimensions from a file
 */
export const getImageDimensions = (file: File): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compress an image file if it exceeds size or dimension limits
 */
export const compressImage = async (file: File): Promise<File> => {
  const { MAX_WIDTH, MAX_SIZE_MB, QUALITY } = ATTACHMENT_LIMITS.IMAGE_COMPRESSION;
  
  // Check if compression is needed
  if (file.size <= MAX_SIZE_MB * 1024 * 1024) {
    try {
      const dimensions = await getImageDimensions(file);
      if (dimensions.width <= MAX_WIDTH) {
        return file;
      }
    } catch {
      return file;
    }
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width;
        width = MAX_WIDTH;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/webp',
        QUALITY
      );
      
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Check if a file is an image
 */
export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

/**
 * Generate a preview URL for a file
 */
export const getFilePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Clean up a preview URL
 */
export const revokeFilePreview = (url: string): void => {
  URL.revokeObjectURL(url);
};
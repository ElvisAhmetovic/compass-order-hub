
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Save, Eye, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from 'pdfjs-dist';

interface TemplateManagerProps {
  onTemplateChange?: (templateData: any) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ onTemplateChange }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [templateImage, setTemplateImage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileType, setUploadedFileType] = useState<string>('');

  // File size limit (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Initialize PDF.js worker with fallback approach
  const initializePDFWorker = () => {
    try {
      // First, try to use the worker from node_modules (works in most environments)
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.min.js';
      }
      console.log('PDF.js worker configured:', pdfjsLib.GlobalWorkerOptions.workerSrc);
    } catch (error) {
      console.warn('Failed to configure PDF.js worker:', error);
    }
  };

  // Initialize worker on component mount
  React.useEffect(() => {
    initializePDFWorker();
  }, []);

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    console.log('Validating file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      maxSize: MAX_FILE_SIZE
    });

    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File too large. Maximum size is ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB, but your file is ${Math.round(file.size / (1024 * 1024))}MB.`
      };
    }

    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';

    if (!isImage && !isPDF) {
      return {
        isValid: false,
        error: `Invalid file type. Please select an image file (PNG, JPG, etc.) or a PDF file. Your file type: ${file.type}`
      };
    }

    return { isValid: true };
  };

  const convertPDFToImage = async (file: File): Promise<string> => {
    console.log('Starting PDF conversion for file:', file.name);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log('PDF file loaded into array buffer, size:', arrayBuffer.byteLength);
      
      console.log('Attempting to load PDF document...');
      
      // Use a simpler configuration that's more likely to work in browser environments
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0, // Reduce console noise
        disableAutoFetch: true, // Prevent automatic fetching that might cause issues
        disableStream: true, // Use array buffer directly
        disableRange: true // Disable range requests
      }).promise;
      
      console.log('PDF document loaded successfully, pages:', pdf.numPages);
      
      const page = await pdf.getPage(1); // Get first page
      console.log('First page loaded successfully');
      
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context - browser may not support canvas rendering');
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      console.log('Canvas created with dimensions:', canvas.width, 'x', canvas.height);
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      console.log('PDF page rendered to canvas successfully');
      
      const dataUrl = canvas.toDataURL('image/png', 0.9);
      console.log('Canvas converted to data URL, size:', dataUrl.length);
      
      // Cleanup
      await pdf.destroy();
      
      return dataUrl;
    } catch (error) {
      console.error('PDF conversion error details:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof Error) {
        if (error.message.includes('worker') || error.message.includes('Worker')) {
          throw new Error('PDF processing is not available in this browser environment. Please convert your PDF to an image (PNG or JPG) and upload that instead.');
        } else if (error.message.includes('Invalid PDF') || error.message.includes('corrupted')) {
          throw new Error('Invalid or corrupted PDF file. Please ensure your PDF is valid and try again.');
        } else if (error.message.includes('canvas')) {
          throw new Error('PDF rendering failed: Canvas rendering not supported in your browser.');
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          throw new Error('PDF processing failed due to network issues. Please convert your PDF to an image and try again.');
        } else {
          throw new Error(`PDF processing failed: ${error.message}. Please try converting your PDF to an image file instead.`);
        }
      } else {
        throw new Error('PDF processing failed due to an unknown error. Please convert your PDF to an image file (PNG or JPG) and upload that instead.');
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File upload started:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      console.error('File validation failed:', validation.error);
      toast({
        title: "Upload failed",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    const isPDF = file.type === 'application/pdf';
    setIsUploading(true);
    setUploadedFileType(file.type);
    
    try {
      let imageDataUrl: string;
      
      if (isPDF) {
        console.log('Processing PDF file...');
        toast({
          title: "Converting PDF...",
          description: "Converting your PDF template to an image, please wait..."
        });
        imageDataUrl = await convertPDFToImage(file);
      } else {
        console.log('Processing image file...');
        // Handle image files
        const reader = new FileReader();
        imageDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            console.log('Image file loaded, data URL length:', result.length);
            resolve(result);
          };
          reader.onerror = () => {
            console.error('FileReader error');
            reject(new Error('Failed to read image file'));
          };
          reader.readAsDataURL(file);
        });
      }
      
      console.log('File processing completed successfully');
      setTemplateImage(imageDataUrl);
      
      // Save to localStorage
      localStorage.setItem('proposalTemplateImage', imageDataUrl);
      localStorage.setItem('proposalTemplateFileType', file.type);
      
      setIsUploading(false);
      toast({
        title: "Template uploaded successfully",
        description: `Your ${isPDF ? 'PDF' : 'image'} template has been uploaded and is ready to use.`
      });

      if (onTemplateChange) {
        onTemplateChange({ templateImage: imageDataUrl });
      }
    } catch (error) {
      console.error('Upload processing error:', error);
      setIsUploading(false);
      
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during upload';
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const loadSavedTemplate = () => {
    const saved = localStorage.getItem('proposalTemplateImage');
    const savedFileType = localStorage.getItem('proposalTemplateFileType');
    if (saved) {
      setTemplateImage(saved);
      setUploadedFileType(savedFileType || 'image/*');
    }
  };

  React.useEffect(() => {
    loadSavedTemplate();
  }, []);

  const clearTemplate = () => {
    setTemplateImage('');
    setUploadedFileType('');
    localStorage.removeItem('proposalTemplateImage');
    localStorage.removeItem('proposalTemplateFileType');
    toast({
      title: "Template cleared",
      description: "Template has been removed."
    });
  };

  const getFileTypeIcon = () => {
    if (uploadedFileType === 'application/pdf') {
      return <FileText size={16} className="text-red-600" />;
    }
    return <Upload size={16} />;
  };

  const getFileTypeText = () => {
    if (uploadedFileType === 'application/pdf') {
      return 'PDF Template';
    }
    return 'Image Template';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload size={20} />
          Proposal Template Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Upload Your Proposal Template</Label>
          <div className="flex gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              onClick={handleUploadClick} 
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              <Upload size={16} />
              {isUploading ? 'Processing...' : 'Upload Template'}
            </Button>
            {templateImage && (
              <Button 
                variant="outline" 
                onClick={clearTemplate}
              >
                Clear Template
              </Button>
            )}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Upload your existing proposal template as an image (PNG, JPG, etc.) or as a PDF file.</p>
            <p className="flex items-center gap-1">
              <AlertCircle size={14} className="text-blue-500" />
              Maximum file size: {Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB. PDF files will be automatically converted to images.
            </p>
            <p className="text-xs text-amber-600">
              Note: If PDF processing fails, please convert your PDF to an image file (PNG or JPG) using any PDF converter tool.
            </p>
          </div>
        </div>

        {templateImage && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {getFileTypeIcon()}
              Template Preview - {getFileTypeText()}
            </Label>
            <div className="border rounded-lg p-4 bg-gray-50">
              <img 
                src={templateImage} 
                alt="Proposal Template" 
                className="max-w-full h-auto max-h-96 mx-auto border shadow-sm"
              />
            </div>
            <p className="text-sm text-green-600">
              ✓ Template uploaded successfully. This will be used as the background for your proposals.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemplateManager;


import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Save, Eye, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface TemplateManagerProps {
  onTemplateChange?: (templateData: any) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ onTemplateChange }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [templateImage, setTemplateImage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileType, setUploadedFileType] = useState<string>('');

  const convertPDFToImage = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1); // Get first page
    
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not get canvas context');
    }
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    return canvas.toDataURL('image/png');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';

    if (!isImage && !isPDF) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, etc.) or a PDF file",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadedFileType(file.type);
    
    try {
      let imageDataUrl: string;
      
      if (isPDF) {
        toast({
          title: "Converting PDF...",
          description: "Converting your PDF template to an image, please wait..."
        });
        imageDataUrl = await convertPDFToImage(file);
      } else {
        // Handle image files as before
        const reader = new FileReader();
        imageDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            resolve(result);
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      }
      
      setTemplateImage(imageDataUrl);
      
      // Save to localStorage
      localStorage.setItem('proposalTemplateImage', imageDataUrl);
      localStorage.setItem('proposalTemplateFileType', file.type);
      
      setIsUploading(false);
      toast({
        title: "Template uploaded",
        description: `Your ${isPDF ? 'PDF' : 'image'} template has been uploaded and converted successfully.`
      });

      if (onTemplateChange) {
        onTemplateChange({ templateImage: imageDataUrl });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: `Failed to upload the ${isPDF ? 'PDF' : 'image'}. Please try again.`,
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
          <p className="text-sm text-gray-600">
            Upload your existing proposal template as an image (PNG, JPG, etc.) or as a PDF file. PDF files will be automatically converted to images.
          </p>
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

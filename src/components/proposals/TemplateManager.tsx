
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Save, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TemplateManagerProps {
  onTemplateChange?: (templateData: any) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ onTemplateChange }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [templateImage, setTemplateImage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, etc.)",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setTemplateImage(result);
      
      // Save to localStorage
      localStorage.setItem('proposalTemplateImage', result);
      
      setIsUploading(false);
      toast({
        title: "Template uploaded",
        description: "Your proposal template has been uploaded successfully."
      });

      if (onTemplateChange) {
        onTemplateChange({ templateImage: result });
      }
    };
    
    reader.onerror = () => {
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: "Failed to upload the image. Please try again.",
        variant: "destructive"
      });
    };
    
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const loadSavedTemplate = () => {
    const saved = localStorage.getItem('proposalTemplateImage');
    if (saved) {
      setTemplateImage(saved);
    }
  };

  React.useEffect(() => {
    loadSavedTemplate();
  }, []);

  const clearTemplate = () => {
    setTemplateImage('');
    localStorage.removeItem('proposalTemplateImage');
    toast({
      title: "Template cleared",
      description: "Template image has been removed."
    });
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
          <Label>Upload Your Proposal Template Image</Label>
          <div className="flex gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button 
              onClick={handleUploadClick} 
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              <Upload size={16} />
              {isUploading ? 'Uploading...' : 'Upload Screenshot'}
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
            Upload your existing PDF proposal as an image (PNG, JPG, etc.) to use as a template background.
          </p>
        </div>

        {templateImage && (
          <div className="space-y-2">
            <Label>Template Preview</Label>
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

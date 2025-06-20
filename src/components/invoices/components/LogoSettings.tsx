
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { DEFAULT_COMPANY_LOGO } from "../constants";

interface LogoSettingsProps {
  logo: string;
  logoSize: string;
  onLogoChange: (logo: string) => void;
  onLogoSizeChange: (size: string) => void;
}

export const LogoSettings: React.FC<LogoSettingsProps> = ({
  logo,
  logoSize,
  onLogoChange,
  onLogoSizeChange
}) => {
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoUrl = e.target?.result as string;
        onLogoChange(logoUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetToDefaultLogo = () => {
    onLogoChange(DEFAULT_COMPANY_LOGO);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Logo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {logo && (
            <div className="relative">
              <img 
                src={logo} 
                alt="Company Logo" 
                className={`${
                  logoSize === "small" ? "h-12" :
                  logoSize === "medium" ? "h-16" :
                  "h-24"
                } w-auto object-contain`}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={() => onLogoChange("")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="logo-upload">Upload Custom Logo</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaultLogo}
              >
                Reset to Default
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              AB Media Team logo is set as default. Upload a custom logo or use the default.
            </p>
          </div>
        </div>
        
        <div>
          <Label>Logo Size</Label>
          <Select value={logoSize} onValueChange={onLogoSizeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};


import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Mail, Phone, ExternalLink } from "lucide-react";
import { OrderFormData, ValidationErrors } from "./validation";

interface CompanyInfoSectionProps {
  data: OrderFormData;
  errors: ValidationErrors;
  isEditing: boolean;
  onChange: (field: keyof OrderFormData, value: string) => void;
}

const CompanyInfoSection = ({ data, errors, isEditing, onChange }: CompanyInfoSectionProps) => {
  if (!isEditing) {
    return (
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Company Name</Label>
          <p className="text-sm">{data.company_name}</p>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Address
          </Label>
          <p className="text-sm">{data.company_address || "Not provided"}</p>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Mail className="h-3 w-3" />
            Email
          </Label>
          <p className="text-sm">{data.contact_email || "Not provided"}</p>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />
            Phone
          </Label>
          <p className="text-sm">{data.contact_phone || "Not provided"}</p>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            Website
          </Label>
          {data.company_link ? (
            <a 
              href={data.company_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {data.company_link}
            </a>
          ) : (
            <p className="text-sm">Not provided</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium text-muted-foreground">Company Name *</Label>
        <Input
          value={data.company_name}
          onChange={(e) => onChange('company_name', e.target.value)}
          placeholder="Company name"
          className={`mt-1 ${errors.company_name ? 'border-destructive' : ''}`}
        />
        {errors.company_name && (
          <p className="text-sm text-destructive mt-1">{errors.company_name}</p>
        )}
      </div>
      
      <div>
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Address
        </Label>
        <Textarea
          value={data.company_address}
          onChange={(e) => onChange('company_address', e.target.value)}
          placeholder="Company address"
          className="mt-1"
          rows={2}
        />
      </div>
      
      <div>
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <Mail className="h-3 w-3" />
          Email
        </Label>
        <Input
          type="email"
          value={data.contact_email}
          onChange={(e) => onChange('contact_email', e.target.value)}
          placeholder="Contact email"
          className={`mt-1 ${errors.contact_email ? 'border-destructive' : ''}`}
        />
        {errors.contact_email && (
          <p className="text-sm text-destructive mt-1">{errors.contact_email}</p>
        )}
      </div>
      
      <div>
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <Phone className="h-3 w-3" />
          Phone
        </Label>
        <Input
          value={data.contact_phone}
          onChange={(e) => onChange('contact_phone', e.target.value)}
          placeholder="Contact phone"
          className={`mt-1 ${errors.contact_phone ? 'border-destructive' : ''}`}
        />
        {errors.contact_phone && (
          <p className="text-sm text-destructive mt-1">{errors.contact_phone}</p>
        )}
      </div>
      
      <div>
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          Website
        </Label>
        <Input
          value={data.company_link}
          onChange={(e) => onChange('company_link', e.target.value)}
          placeholder="https://company-website.com"
          className={`mt-1 ${errors.company_link ? 'border-destructive' : ''}`}
        />
        {errors.company_link && (
          <p className="text-sm text-destructive mt-1">{errors.company_link}</p>
        )}
      </div>
    </div>
  );
};

export default CompanyInfoSection;

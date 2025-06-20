
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CompanyInformationProps {
  companyInfo: any;
  onUpdateCompanyInfo: (field: string, value: string) => void;
}

export const CompanyInformation: React.FC<CompanyInformationProps> = ({
  companyInfo,
  onUpdateCompanyInfo
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Company Name</Label>
            <Input
              value={companyInfo?.name || ''}
              onChange={(e) => onUpdateCompanyInfo('name', e.target.value)}
            />
          </div>
          <div>
            <Label>Contact Person</Label>
            <Input
              value={companyInfo?.contactPerson || ''}
              onChange={(e) => onUpdateCompanyInfo('contactPerson', e.target.value)}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              value={companyInfo?.email || ''}
              onChange={(e) => onUpdateCompanyInfo('email', e.target.value)}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={companyInfo?.phone || ''}
              onChange={(e) => onUpdateCompanyInfo('phone', e.target.value)}
            />
          </div>
          <div>
            <Label>Registration Number</Label>
            <Input
              value={companyInfo?.registrationNumber || ''}
              onChange={(e) => onUpdateCompanyInfo('registrationNumber', e.target.value)}
            />
          </div>
          <div>
            <Label>VAT ID</Label>
            <Input
              value={companyInfo?.vatId || ''}
              onChange={(e) => onUpdateCompanyInfo('vatId', e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <Label>Address</Label>
          <Textarea
            value={`${companyInfo?.street || ''}\n${companyInfo?.postal || ''} ${companyInfo?.city || ''}\n${companyInfo?.country || ''}`}
            onChange={(e) => {
              const lines = e.target.value.split('\n');
              onUpdateCompanyInfo('street', lines[0] || '');
              const cityLine = lines[1] || '';
              const [postal, ...cityParts] = cityLine.split(' ');
              onUpdateCompanyInfo('postal', postal || '');
              onUpdateCompanyInfo('city', cityParts.join(' ') || '');
              onUpdateCompanyInfo('country', lines[2] || '');
            }}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};

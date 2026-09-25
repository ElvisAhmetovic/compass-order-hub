
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CompanyInformationProps {
  companyInfo: any;
  onUpdateCompanyInfo: (field: string, value: string) => void;
  saveStatus?: "idle" | "saving" | "saved" | "error";
}

const FIELDS: { key: string; label: string }[] = [
  { key: "name", label: "Company Name" },
  { key: "contactPerson", label: "Contact Person" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "website", label: "Website" },
  { key: "director", label: "Director" },
  { key: "registrationNumber", label: "Registration Number" },
  { key: "vatId", label: "VAT ID" },
  { key: "taxNumber", label: "Tax Number" },
  { key: "street", label: "Street" },
  { key: "postal", label: "Postal Code" },
  { key: "city", label: "City" },
  { key: "country", label: "Country" },
];

const STATUS_TEXT = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Could not save — please try again",
};

export const CompanyInformation: React.FC<CompanyInformationProps> = ({
  companyInfo,
  onUpdateCompanyInfo,
  saveStatus = "idle",
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Company Information</CardTitle>
        <span className={`text-xs ${saveStatus === "error" ? "text-destructive" : "text-muted-foreground"}`}>
          {STATUS_TEXT[saveStatus]}
        </span>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIELDS.map(({ key, label }) => (
            <div key={key}>
              <Label htmlFor={`company-${key}`}>{label}</Label>
              <Input
                id={`company-${key}`}
                value={companyInfo?.[key] ?? ''}
                onChange={(e) => onUpdateCompanyInfo(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};


import React from 'react';
import { Card } from "@/components/ui/card";
import { Building2, Mail, MapPin, Phone, Link, Pencil, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Company } from "@/types";

interface CompanyCardProps {
  company: Company;
  companyKey: string;
  isAdmin: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
  getGoogleMapsLink: (address: string, customLink?: string) => string;
}

const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  companyKey,
  isAdmin,
  onEditClick,
  onDeleteClick,
  getGoogleMapsLink,
}) => {
  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{company.name}</h3>
          </div>
          
          {isAdmin && (
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onEditClick}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onDeleteClick}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-3 text-sm">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{company.email}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{company.phone}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{company.address}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link className="h-4 w-4 text-muted-foreground" />
            <a 
              href={getGoogleMapsLink(company.address || "", company.map_link)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View on Google Maps
            </a>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="text-sm text-muted-foreground">
          Total orders: {company.orders?.length || 0}
        </div>
      </div>
    </Card>
  );
};

export default CompanyCard;


import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/types/invoice";
import { InvoiceService } from "@/services/invoiceService";
import { useAuth } from "@/context/AuthContext";

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (client: Client) => void;
}

export const CreateClientDialog: React.FC<CreateClientDialogProps> = ({
  open,
  onOpenChange,
  onClientCreated,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip_code: "",
    country: "",
    vat_id: "",
    tax_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🎬 CREATE CLIENT DIALOG: Form submission started');
    console.log('Current user from AuthContext:', user);
    
    // Check authentication first
    if (!user) {
      console.error('❌ No user in AuthContext');
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create clients. Please log in and try again.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ User found in AuthContext:', {
      id: user.id,
      role: user.role,
      email: user.email,
      full_name: user.full_name
    });

    // Validate required fields
    if (!formData.name || !formData.email) {
      console.error('❌ Validation failed: Missing required fields');
      toast({
        title: "Validation Error",
        description: "Name and email are required.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Form validation passed');
    console.log('Form data to submit:', {
      name: formData.name,
      email: formData.email,
      contact_person: formData.contact_person
    });

    try {
      setLoading(true);
      console.log('📡 Calling InvoiceService.createClient...');
      
      const newClient = await InvoiceService.createClient(formData);
      
      console.log('✅ Client created successfully:', newClient);
      onClientCreated(newClient);
      
      toast({
        title: "Client created",
        description: "Client has been created successfully.",
      });

      // Reset form
      setFormData({
        name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        zip_code: "",
        country: "",
        vat_id: "",
        tax_id: "",
      });
      
      onOpenChange(false);
      
    } catch (error) {
      console.error("💥 Error creating client:", error);
      
      let errorMessage = "Failed to create client.";
      let errorTitle = "Error";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more specific error handling
        if (error.message.includes('Authentication required')) {
          errorTitle = "Authentication Error";
          errorMessage = "Please log out and log back in, then try again.";
        } else if (error.message.includes('permission')) {
          errorTitle = "Permission Denied";
          errorMessage = `Your role (${user.role}) does not have permission to create clients. Please contact your administrator.`;
        } else if (error.message.includes('already exists')) {
          errorTitle = "Duplicate Client";
        }
      }
      
      console.error('Error details for user:', {
        title: errorTitle,
        message: errorMessage,
        userRole: user.role,
        userId: user.id
      });
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          {user && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Creating client as: {user.full_name} ({user.role})</p>
              <p className="text-xs">User ID: {user.id}</p>
            </div>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="vat_id">VAT ID</Label>
              <Input
                id="vat_id"
                value={formData.vat_id}
                onChange={(e) => setFormData({ ...formData, vat_id: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="tax_id">Tax ID</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !user}>
              {loading ? "Creating..." : "Create Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

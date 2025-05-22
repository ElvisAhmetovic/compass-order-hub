
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Company } from "@/types";

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newCompany: Omit<Company, 'orders'>;
  setNewCompany: React.Dispatch<React.SetStateAction<Omit<Company, 'orders'>>>;
  onCreateCompany: () => void;
}

const CreateCompanyDialog: React.FC<CreateCompanyDialogProps> = ({
  open,
  onOpenChange,
  newCompany,
  setNewCompany,
  onCreateCompany
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Company</DialogTitle>
          <DialogDescription>
            Enter the information for the new company.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-company-name" className="text-right">
              Name*
            </Label>
            <Input
              id="new-company-name"
              value={newCompany.name}
              onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-email" className="text-right">
              Email*
            </Label>
            <Input
              id="new-email"
              type="email"
              value={newCompany.email}
              onChange={(e) => setNewCompany({...newCompany, email: e.target.value})}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-phone" className="text-right">
              Phone
            </Label>
            <Input
              id="new-phone"
              value={newCompany.phone || ""}
              onChange={(e) => setNewCompany({...newCompany, phone: e.target.value})}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-address" className="text-right">
              Address
            </Label>
            <Textarea
              id="new-address"
              value={newCompany.address || ""}
              onChange={(e) => setNewCompany({...newCompany, address: e.target.value})}
              className="col-span-3"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-map-link" className="text-right">
              Google Maps URL
            </Label>
            <Input
              id="new-map-link"
              type="url"
              placeholder="https://www.google.com/maps/..."
              value={newCompany.mapLink || ""}
              onChange={(e) => setNewCompany({...newCompany, mapLink: e.target.value})}
              className="col-span-3"
            />
            <div className="col-start-2 col-span-3 text-xs text-muted-foreground">
              Optional: Add a custom Google Maps link. If empty, a link will be generated from the address.
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onCreateCompany}>Create Company</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCompanyDialog;

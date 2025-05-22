
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

interface EditCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCompany: Company | null;
  setCurrentCompany: React.Dispatch<React.SetStateAction<Company | null>>;
  onSaveEdit: () => void;
}

const EditCompanyDialog: React.FC<EditCompanyDialogProps> = ({
  open,
  onOpenChange,
  currentCompany,
  setCurrentCompany,
  onSaveEdit
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>
            Make changes to the company information below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company-name" className="text-right">
              Name
            </Label>
            <Input
              id="company-name"
              value={currentCompany?.name || ""}
              onChange={(e) => currentCompany && setCurrentCompany({...currentCompany, name: e.target.value})}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={currentCompany?.email || ""}
              onChange={(e) => currentCompany && setCurrentCompany({...currentCompany, email: e.target.value})}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              value={(currentCompany?.phone === "Not provided" ? "" : currentCompany?.phone) || ""}
              onChange={(e) => currentCompany && setCurrentCompany({...currentCompany, phone: e.target.value || "Not provided"})}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Address
            </Label>
            <Textarea
              id="address"
              value={(currentCompany?.address === "Not provided" ? "" : currentCompany?.address) || ""}
              onChange={(e) => currentCompany && setCurrentCompany({...currentCompany, address: e.target.value || "Not provided"})}
              className="col-span-3"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="map-link" className="text-right">
              Google Maps URL
            </Label>
            <Input
              id="map-link"
              type="url"
              placeholder="https://www.google.com/maps/..."
              value={currentCompany?.mapLink || ""}
              onChange={(e) => currentCompany && setCurrentCompany({...currentCompany, mapLink: e.target.value})}
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
          <Button onClick={onSaveEdit}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCompanyDialog;


import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryItem } from "@/types";

interface EditItemDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentItem: InventoryItem | null;
  formData: Partial<InventoryItem>;
  handleInputChange: (field: keyof InventoryItem, value: string) => void;
  handleSaveChanges: () => void;
}

const EditItemDialog = ({
  isOpen,
  setIsOpen,
  currentItem,
  formData,
  handleInputChange,
  handleSaveChanges,
}: EditItemDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
        </DialogHeader>
        {currentItem && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="item-name">Name</Label>
              <Input 
                id="item-name" 
                value={formData.name || ''} 
                onChange={(e) => handleInputChange('name', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value as "Article" | "Service")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Article">Article</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-stock">Stock</Label>
              <Input 
                id="item-stock" 
                value={formData.stock || ''} 
                onChange={(e) => handleInputChange('stock', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-price">Price</Label>
              <Input 
                id="item-price" 
                value={formData.price || ''} 
                onChange={(e) => handleInputChange('price', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-buyingPrice">Buying Price</Label>
              <Input 
                id="item-buyingPrice" 
                value={formData.buyingPrice || ''} 
                onChange={(e) => handleInputChange('buyingPrice', e.target.value)} 
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemDialog;

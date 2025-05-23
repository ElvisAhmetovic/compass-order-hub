
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTabs,
  DialogTabsList,
  DialogTabsTrigger,
  DialogTabsContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InventoryItem } from "@/types";
import { Settings } from "lucide-react";

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
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Edit product</DialogTitle>
        </DialogHeader>
        {currentItem && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">
                  Product name <span className="text-blue-500">*</span>
                </Label>
                <Input 
                  id="item-name" 
                  value={formData.name || ''} 
                  onChange={(e) => handleInputChange('name', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="standard-unit">Standard unit</Label>
                <Select 
                  value={formData.unit || 'unit'} 
                  onValueChange={(value) => handleInputChange('unit', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">unit</SelectItem>
                    <SelectItem value="hour">hour</SelectItem>
                    <SelectItem value="day">day</SelectItem>
                    <SelectItem value="piece">piece</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-number">Product No.</Label>
                <div className="flex">
                  <Input 
                    id="item-number" 
                    value={formData.id || ''} 
                    onChange={(e) => handleInputChange('id', e.target.value)} 
                    className="rounded-r-none"
                  />
                  <Button 
                    variant="outline" 
                    className="rounded-l-none border-l-0 px-2"
                    type="button"
                  >
                    <Settings size={18} />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-stock">Stock (unit)</Label>
                <Input 
                  id="item-stock" 
                  value={formData.stock?.toString() || '0.0'}
                  onChange={(e) => handleInputChange('stock', e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-category">Category</Label>
                <Select 
                  value={formData.category || 'Article'} 
                  onValueChange={(value) => handleInputChange('category', value)}
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
                <Label htmlFor="vat-rate">VAT rate</Label>
                <Select 
                  value="19%" 
                  onValueChange={() => {}}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="19%" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="19%">19%</SelectItem>
                    <SelectItem value="7%">7%</SelectItem>
                    <SelectItem value="0%">0%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-buyingPrice">Purchase price (Net)</Label>
                <Input 
                  id="item-buyingPrice" 
                  value={formData.buyingPrice || ''}
                  onChange={(e) => handleInputChange('buyingPrice', e.target.value)} 
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-price">Retail price (Net)</Label>
                <Input 
                  id="item-price" 
                  value={formData.price || ''} 
                  onChange={(e) => handleInputChange('price', e.target.value)} 
                  className="text-right"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-buyingPrice-gross">Purchase price (Gross)</Label>
                <Input 
                  id="item-buyingPrice-gross" 
                  value={formData.buyingPriceGross || formData.buyingPrice} 
                  onChange={(e) => handleInputChange('buyingPriceGross', e.target.value)}
                  className="text-right" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-price-gross">Retail price (Gross)</Label>
                <Input 
                  id="item-price-gross" 
                  value={formData.priceGross || formData.price} 
                  onChange={(e) => handleInputChange('priceGross', e.target.value)} 
                  className="text-right"
                />
              </div>
            </div>
            
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid grid-cols-3 mb-2">
                <TabsTrigger value="description" className="text-sm">Description</TabsTrigger>
                <TabsTrigger value="more-units" className="text-sm">More units</TabsTrigger>
                <TabsTrigger value="more-settings" className="text-sm">More settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item-description">Product description</Label>
                    <Textarea 
                      id="item-description" 
                      value={formData.description || ''} 
                      onChange={(e) => handleInputChange('description', e.target.value)} 
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="internal-note">
                      Internal note
                      <span className="ml-1 inline-flex items-center justify-center rounded-full border border-gray-200 w-5 h-5 text-xs">?</span>
                    </Label>
                    <Textarea 
                      id="internal-note" 
                      value={formData.internalNote || ''} 
                      onChange={(e) => handleInputChange('internalNote', e.target.value)} 
                      rows={4}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="more-units" className="mt-2">
                <div className="text-sm text-muted-foreground">
                  Additional units configuration would go here
                </div>
              </TabsContent>
              
              <TabsContent value="more-settings" className="mt-2">
                <div className="text-sm text-muted-foreground">
                  Additional product settings would go here
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSaveChanges}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemDialog;

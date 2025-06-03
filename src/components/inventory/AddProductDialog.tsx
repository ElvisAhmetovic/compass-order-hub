
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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

interface AddProductFormValues {
  name: string;
  category: "Article" | "Service";
  description: string;
  stock: number;
  unit: string;
  price: string;
  buyingPrice: string;
  internalNote: string;
}

interface AddProductDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSubmit: (data: AddProductFormValues) => void;
}

const AddProductDialog = ({ isOpen, setIsOpen, onSubmit }: AddProductDialogProps) => {
  const form = useForm<AddProductFormValues>({
    defaultValues: {
      name: '',
      category: 'Article',
      description: '',
      stock: 0,
      unit: 'Stk',
      price: 'EUR0.00',
      buyingPrice: 'EUR0.00',
      internalNote: ''
    }
  });

  const handleSubmit = (data: AddProductFormValues) => {
    // Ensure price format
    const formattedData = {
      ...data,
      price: data.price.startsWith('EUR') ? data.price : `EUR${data.price}`,
      buyingPrice: data.buyingPrice.startsWith('EUR') ? data.buyingPrice : `EUR${data.buyingPrice}`,
      stock: Number(data.stock) || 0
    };
    
    onSubmit(formattedData);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your inventory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-product-name">Product Name *</Label>
                <Input 
                  id="new-product-name" 
                  {...form.register('name', { required: true })}
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-product-category">Category</Label>
                <Select 
                  value={form.watch('category')}
                  onValueChange={(value) => form.setValue('category', value as "Article" | "Service")}
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-product-description">Description</Label>
              <Textarea 
                id="new-product-description" 
                {...form.register('description')}
                placeholder="Product description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-product-stock">Stock Quantity</Label>
                <Input 
                  id="new-product-stock" 
                  type="number"
                  min="0"
                  step="1"
                  {...form.register('stock', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-product-unit">Unit</Label>
                <Select 
                  value={form.watch('unit')}
                  onValueChange={(value) => form.setValue('unit', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stk">Stk (Pieces)</SelectItem>
                    <SelectItem value="hour">Hour</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="m">Meter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-product-price">Selling Price</Label>
                <Input 
                  id="new-product-price" 
                  {...form.register('price')}
                  placeholder="EUR0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-product-buyingPrice">Buying Price</Label>
                <Input 
                  id="new-product-buyingPrice" 
                  {...form.register('buyingPrice')}
                  placeholder="EUR0.00"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-product-note">Internal Note</Label>
              <Textarea 
                id="new-product-note" 
                {...form.register('internalNote')}
                placeholder="Internal notes (optional)"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Add Product</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;

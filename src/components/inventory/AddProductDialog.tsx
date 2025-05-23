
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Form } from "@/components/ui/form";

interface AddProductFormValues {
  name: string;
  category: "Article" | "Service";
  stock: string;
  price: string;
  buyingPrice: string;
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
      stock: '0.00 Stk',
      price: 'EUR0.00',
      buyingPrice: 'EUR0.00'
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your inventory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-product-name">Product Name</Label>
              <Input 
                id="new-product-name" 
                {...form.register('name', { required: true })}
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
            <div className="space-y-2">
              <Label htmlFor="new-product-stock">Stock</Label>
              <Input 
                id="new-product-stock" 
                {...form.register('stock')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-product-price">Price</Label>
              <Input 
                id="new-product-price" 
                {...form.register('price')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-product-buyingPrice">Buying Price</Label>
              <Input 
                id="new-product-buyingPrice" 
                {...form.register('buyingPrice')}
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

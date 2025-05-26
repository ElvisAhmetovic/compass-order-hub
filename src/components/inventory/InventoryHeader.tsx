
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Import, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface InventoryHeaderProps {
  onAddProduct: () => void;
  onImport: () => void;
  onDeleteAll: () => void;
}

const InventoryHeader = ({ onAddProduct, onImport, onDeleteAll }: InventoryHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Inventory</h1>
      <div className="flex gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Inventory Items</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete ALL inventory items? This action cannot be undone and will permanently remove all products from your inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDeleteAll} className="bg-red-600 hover:bg-red-700">
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button variant="outline" onClick={onImport}>
          <Import className="mr-2 h-4 w-4" />
          Import products
        </Button>
        <Button onClick={onAddProduct}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add product
        </Button>
      </div>
    </div>
  );
};

export default InventoryHeader;

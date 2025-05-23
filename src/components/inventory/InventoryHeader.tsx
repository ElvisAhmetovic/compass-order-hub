
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Import } from "lucide-react";

interface InventoryHeaderProps {
  onAddProduct: () => void;
  onImport: () => void;
}

const InventoryHeader = ({ onAddProduct, onImport }: InventoryHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Inventory</h1>
      <div className="flex gap-2">
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

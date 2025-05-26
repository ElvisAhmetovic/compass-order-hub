
import React, { useState } from "react";
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

interface ImportDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  handleImport: () => void;
  setImportFile: (file: File | null) => void;
  importFile: File | null;
}

const ImportDialog = ({
  isOpen,
  setIsOpen,
  handleImport,
  setImportFile,
  importFile,
}: ImportDialogProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple products at once. 
            Expected CSV format: Name, Category, Description, Stock, Unit, Price, Buying Price
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="import-file">Select CSV File</Label>
            <Input 
              id="import-file" 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
            />
            <div className="text-sm text-gray-500 mt-2 space-y-1">
              <p>CSV format example:</p>
              <pre className="bg-gray-100 p-2 rounded text-xs">
                Name,Category,Description,Stock,Unit,Price,Buying Price{'\n'}
                Product A,Article,Description here,10,Stk,EUR25.00,EUR15.00
              </pre>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleImport} disabled={!importFile}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;

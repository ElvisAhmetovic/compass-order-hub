
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
            Upload a CSV or Excel file to import multiple products at once.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="import-file">Select File</Label>
            <Input 
              id="import-file" 
              type="file" 
              accept=".csv,.xlsx,.xls" 
              onChange={handleFileChange}
            />
            <p className="text-sm text-gray-500 mt-2">
              Accepted formats: CSV, Excel (.xlsx, .xls)
            </p>
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

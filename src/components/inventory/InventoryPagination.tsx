
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InventoryPaginationProps {
  filteredDataLength: number;
}

const InventoryPagination = ({ filteredDataLength }: InventoryPaginationProps) => {
  return (
    <div className="flex justify-between items-center mt-4 text-sm">
      <div className="flex items-center gap-2">
        <Select defaultValue="50">
          <SelectTrigger className="h-8 w-16">
            <SelectValue placeholder="50" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-8">First</Button>
        <Button variant="outline" size="sm" className="h-8">Previous</Button>
        <Button variant="default" size="sm" className="h-8">1</Button>
        <Button variant="outline" size="sm" className="h-8">Next</Button>
        <Button variant="outline" size="sm" className="h-8">Last</Button>
      </div>
      <div className="text-gray-600">
        Shows 1 - {Math.min(filteredDataLength, 10)} of {filteredDataLength} entries
      </div>
    </div>
  );
};

export default InventoryPagination;

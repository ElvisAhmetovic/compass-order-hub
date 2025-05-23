
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { InventoryItem } from "@/types";

interface InventoryTableProps {
  filteredData: InventoryItem[];
  handleEditClick: (item: InventoryItem) => void;
}

const InventoryTable = ({ filteredData, handleEditClick }: InventoryTableProps) => {
  return (
    <div className="p-4">
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[80px]">No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Last booking</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Price (Gross)</TableHead>
              <TableHead>Buying Price</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50">
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.lastBooking || "-"}</TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell className="text-right">{item.price}</TableCell>
                <TableCell>{item.buyingPrice || "-"}</TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEditClick(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No items found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InventoryTable;

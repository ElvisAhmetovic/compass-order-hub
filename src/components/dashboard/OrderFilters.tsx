
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderFiltersProps {
  onStatusChange: (status: string | null) => void;
  selectedStatus: string | null;
}

const OrderFilters = ({ onStatusChange, selectedStatus }: OrderFiltersProps) => {
  const handleStatusChange = (value: string) => {
    onStatusChange(value === "all" ? null : value);
  };

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Priority:</span>
        <Select 
          value={selectedStatus || "all"} 
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default OrderFilters;

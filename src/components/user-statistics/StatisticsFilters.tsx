import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatisticsFiltersProps {
  onSearchChange: (search: string) => void;
  onRoleFilterChange: (role: string) => void;
  searchValue: string;
  roleFilter: string;
}

export const StatisticsFilters = ({
  onSearchChange,
  onRoleFilterChange,
  searchValue,
  roleFilter,
}: StatisticsFiltersProps) => {
  const [localSearch, setLocalSearch] = useState(searchValue);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      onSearchChange(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    onSearchChange('');
    onRoleFilterChange('all');
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by name or email..."
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={roleFilter} onValueChange={onRoleFilterChange}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Filter by role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="agent">Agent</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>

      {(searchValue || roleFilter !== 'all') && (
        <Button variant="outline" onClick={handleClearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );
};

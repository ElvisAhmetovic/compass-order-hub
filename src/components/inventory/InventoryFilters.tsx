
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "lucide-react";

interface InventoryFiltersProps {
  currentTab: string;
  setCurrentTab: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  resetFilters: () => void;
}

const InventoryFilters = ({
  currentTab,
  setCurrentTab,
  searchQuery,
  setSearchQuery,
  category,
  setCategory,
  resetFilters,
}: InventoryFiltersProps) => {
  return (
    <>
      <div className="p-4 border-b">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-[300px] grid-cols-3">
            <TabsTrigger value="All">All</TabsTrigger>
            <TabsTrigger value="Article">Article</TabsTrigger>
            <TabsTrigger value="Service">Service</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="p-4 border-b grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm font-medium mb-2">Search</p>
          <div className="relative">
            <Input
              placeholder="Search by name or ID"
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute left-2 top-2 text-gray-400">
              🔍
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Date</p>
          <div className="relative">
            <Input placeholder="mm/dd/yyyy" />
            <span className="absolute right-2 top-2 text-gray-400">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Category</p>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Article">Article</SelectItem>
              <SelectItem value="Service">Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-3 flex justify-end">
          <Button 
            variant="link" 
            className="text-blue-600"
            onClick={resetFilters}
          >
            Reset filters
          </Button>
        </div>
      </div>
    </>
  );
};

export default InventoryFilters;

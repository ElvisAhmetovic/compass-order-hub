
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CompanySearchProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

const CompanySearch: React.FC<CompanySearchProps> = ({
  searchTerm,
  setSearchTerm
}) => {
  return (
    <div className="flex w-full max-w-sm items-center space-x-2 mb-6">
      <Input
        placeholder="Search companies..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Button type="button" onClick={() => setSearchTerm("")}>
        Clear
      </Button>
    </div>
  );
};

export default CompanySearch;

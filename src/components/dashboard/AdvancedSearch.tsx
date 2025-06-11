
import { useState, useEffect } from 'react';
import { Search, Filter, Save, X, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchService, SearchFilters, SavedFilter } from '@/services/searchService';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

interface AdvancedSearchProps {
  onFiltersChange: (filters: SearchFilters) => void;
  currentFilters: SearchFilters;
}

const AdvancedSearch = ({ onFiltersChange, currentFilters }: AdvancedSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(currentFilters);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [filterOptions, setFilterOptions] = useState({
    assignedUsers: [] as Array<{ id: string; name: string }>,
    currencies: [] as string[],
    priorities: [] as string[],
    statuses: [] as string[]
  });
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  
  const { user } = useAuth();

  // Sync internal state with props
  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  useEffect(() => {
    if (user) {
      loadSavedFilters();
      loadFilterOptions();
    }
  }, [user]);

  const loadSavedFilters = () => {
    if (user) {
      const saved = SearchService.getSavedFilters(user.id);
      setSavedFilters(saved);
    }
  };

  const loadFilterOptions = async () => {
    const options = await SearchService.getFilterOptions();
    setFilterOptions(options);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    console.log('Applying filters:', filters);
    onFiltersChange(filters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters: SearchFilters = {};
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const saveCurrentFilter = async () => {
    if (!user || !filterName.trim()) return;
    
    try {
      await SearchService.saveFilterPreset(filterName.trim(), filters, user.id);
      loadSavedFilters();
      setSaveDialogOpen(false);
      setFilterName('');
    } catch (error) {
      console.error('Error saving filter:', error);
    }
  };

  const loadSavedFilter = (savedFilter: SavedFilter) => {
    setFilters(savedFilter.filters);
    onFiltersChange(savedFilter.filters);
    setIsOpen(false);
  };

  const deleteSavedFilter = (filterId: string) => {
    if (user) {
      SearchService.deleteSavedFilter(filterId, user.id);
      loadSavedFilters();
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.globalSearch?.trim()) count++;
    if (filters.companyName?.trim()) count++;
    if (filters.contactEmail?.trim()) count++;
    if (filters.status?.length) count++;
    if (filters.priority?.length) count++;
    if (filters.assignedTo?.length) count++;
    if (filters.dateRange?.from && filters.dateRange?.to) count++;
    if (filters.priceRange && (filters.priceRange.min > 0 || filters.priceRange.max > 0)) count++;
    if (filters.currency?.length) count++;
    return count;
  };

  // Apply global search immediately when typing
  const handleGlobalSearchChange = (value: string) => {
    const newFilters = { ...filters, globalSearch: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search orders, companies, clients..."
          value={filters.globalSearch || ''}
          onChange={(e) => handleGlobalSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Advanced
            {getActiveFilterCount() > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Advanced Search & Filters</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Saved Filters */}
            {savedFilters.length > 0 && (
              <div className="space-y-2">
                <Label>Saved Filters</Label>
                <div className="flex flex-wrap gap-2">
                  {savedFilters.map((savedFilter) => (
                    <div key={savedFilter.id} className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadSavedFilter(savedFilter)}
                      >
                        {savedFilter.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSavedFilter(savedFilter.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Company Name */}
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                placeholder="Search by company name..."
                value={filters.companyName || ''}
                onChange={(e) => handleFilterChange('companyName', e.target.value)}
              />
            </div>

            {/* Contact Email */}
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input
                placeholder="Search by contact email..."
                value={filters.contactEmail || ''}
                onChange={(e) => handleFilterChange('contactEmail', e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="grid grid-cols-3 gap-2">
                {filterOptions.statuses.map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.status?.includes(status) || false}
                      onCheckedChange={(checked) => {
                        const currentStatuses = filters.status || [];
                        const newStatuses = checked
                          ? [...currentStatuses, status]
                          : currentStatuses.filter(s => s !== status);
                        handleFilterChange('status', newStatuses);
                      }}
                    />
                    <Label htmlFor={`status-${status}`} className="text-sm">
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="grid grid-cols-2 gap-2">
                {filterOptions.priorities.map((priority) => (
                  <div key={priority} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${priority}`}
                      checked={filters.priority?.includes(priority) || false}
                      onCheckedChange={(checked) => {
                        const currentPriorities = filters.priority || [];
                        const newPriorities = checked
                          ? [...currentPriorities, priority]
                          : currentPriorities.filter(p => p !== priority);
                        handleFilterChange('priority', newPriorities);
                      }}
                    />
                    <Label htmlFor={`priority-${priority}`} className="text-sm">
                      {priority}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned To Filter */}
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <div className="grid grid-cols-2 gap-2">
                {filterOptions.assignedUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={filters.assignedTo?.includes(user.id) || false}
                      onCheckedChange={(checked) => {
                        const currentUsers = filters.assignedTo || [];
                        const newUsers = checked
                          ? [...currentUsers, user.id]
                          : currentUsers.filter(u => u !== user.id);
                        handleFilterChange('assignedTo', newUsers);
                      }}
                    />
                    <Label htmlFor={`user-${user.id}`} className="text-sm">
                      {user.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      {filters.dateRange?.from 
                        ? format(filters.dateRange.from, 'PPP')
                        : 'From date'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateRange?.from}
                      onSelect={(date) => 
                        handleFilterChange('dateRange', {
                          ...filters.dateRange,
                          from: date
                        })
                      }
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      {filters.dateRange?.to 
                        ? format(filters.dateRange.to, 'PPP')
                        : 'To date'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateRange?.to}
                      onSelect={(date) => 
                        handleFilterChange('dateRange', {
                          ...filters.dateRange,
                          to: date
                        })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label>Price Range</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Min price"
                    className="pl-10"
                    value={filters.priceRange?.min || ''}
                    onChange={(e) =>
                      handleFilterChange('priceRange', {
                        ...filters.priceRange,
                        min: parseFloat(e.target.value) || 0
                      })
                    }
                  />
                </div>
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Max price"
                    className="pl-10"
                    value={filters.priceRange?.max || ''}
                    onChange={(e) =>
                      handleFilterChange('priceRange', {
                        ...filters.priceRange,
                        max: parseFloat(e.target.value) || 0
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Currency Filter */}
            <div className="space-y-2">
              <Label>Currency</Label>
              <div className="flex flex-wrap gap-2">
                {filterOptions.currencies.map((currency) => (
                  <div key={currency} className="flex items-center space-x-2">
                    <Checkbox
                      id={`currency-${currency}`}
                      checked={filters.currency?.includes(currency) || false}
                      onCheckedChange={(checked) => {
                        const currentCurrencies = filters.currency || [];
                        const newCurrencies = checked
                          ? [...currentCurrencies, currency]
                          : currentCurrencies.filter(c => c !== currency);
                        handleFilterChange('currency', newCurrencies);
                      }}
                    />
                    <Label htmlFor={`currency-${currency}`} className="text-sm">
                      {currency}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button onClick={clearFilters} variant="outline">
                  Clear All
                </Button>
                <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Save className="h-4 w-4 mr-2" />
                      Save Filter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Filter Preset</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Filter Name</Label>
                        <Input
                          placeholder="Enter filter name..."
                          value={filterName}
                          onChange={(e) => setFilterName(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={saveCurrentFilter}>
                          Save
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Button onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedSearch;


import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryItem {
  id: string;
  name: string;
  price: string;
  buyingPrice?: string;
  category?: string;
  unit?: string;
  description?: string;
}

interface InventoryAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: InventoryItem) => void;
  inventoryItems: InventoryItem[];
  placeholder?: string;
}

const InventoryAutocomplete: React.FC<InventoryAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  inventoryItems,
  placeholder = "Type to search products/services..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length > 0) {
      const filtered = inventoryItems.filter(item =>
        item.name.toLowerCase().includes(value.toLowerCase()) ||
        item.id.toLowerCase().includes(value.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(value.toLowerCase()))
      ).slice(0, 10); // Limit to 10 results
      setFilteredItems(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setFilteredItems([]);
      setIsOpen(false);
    }
  }, [value, inventoryItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemSelect = (item: InventoryItem) => {
    onChange(item.name);
    onSelect(item);
    setIsOpen(false);
  };

  const parsePrice = (priceStr: string) => {
    if (!priceStr) return 0;
    const numStr = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
    return parseFloat(numStr) || 0;
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (filteredItems.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
      />
      
      {isOpen && filteredItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full justify-start p-3 h-auto text-left hover:bg-gray-50"
              onClick={() => handleItemSelect(item)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{item.name}</span>
                  <span className="text-sm text-gray-600 ml-2">{item.price}</span>
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <span className="truncate">ID: {item.id}</span>
                  {item.category && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{item.category}</span>
                    </>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryAutocomplete;


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Search } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import InventoryAutocomplete from '@/components/inventory/InventoryAutocomplete';

export interface SelectedInventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface InventoryItemsSelectorProps {
  selectedItems: SelectedInventoryItem[];
  onItemsChange: (items: SelectedInventoryItem[]) => void;
  className?: string;
}

const InventoryItemsSelector: React.FC<InventoryItemsSelectorProps> = ({
  selectedItems,
  onItemsChange,
  className = ""
}) => {
  const { inventoryData, loading } = useInventory();
  const [searchValue, setSearchValue] = useState('');

  const handleAddItem = (inventoryItem: any) => {
    // Parse price to get numeric value
    const priceStr = inventoryItem.price || 'EUR0.00';
    const numericPrice = parseFloat(priceStr.replace(/[^0-9.-]/g, '')) || 0;

    const newItem: SelectedInventoryItem = {
      id: inventoryItem.id,
      name: inventoryItem.name,
      quantity: 1,
      unit: inventoryItem.unit || 'Stk',
      unitPrice: numericPrice,
      total: numericPrice
    };

    // Check if item already exists
    const existingIndex = selectedItems.findIndex(item => item.id === inventoryItem.id);
    if (existingIndex >= 0) {
      // Update quantity if item already exists
      const updatedItems = [...selectedItems];
      updatedItems[existingIndex].quantity += 1;
      updatedItems[existingIndex].total = updatedItems[existingIndex].quantity * updatedItems[existingIndex].unitPrice;
      onItemsChange(updatedItems);
    } else {
      // Add new item
      onItemsChange([...selectedItems, newItem]);
    }

    setSearchValue('');
  };

  const handleRemoveItem = (itemId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Removing item with ID:', itemId);
    console.log('Current selected items:', selectedItems);
    
    const updatedItems = selectedItems.filter(item => item.id !== itemId);
    console.log('Updated items after removal:', updatedItems);
    
    onItemsChange(updatedItems);
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const updatedItems = selectedItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, quantity);
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * item.unitPrice
        };
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((sum, item) => sum + item.total, 0);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading inventory...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Search className="h-4 w-4" />
          Add Inventory Items
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Add Items */}
        <div>
          <Label className="text-xs text-muted-foreground">Search Products/Services</Label>
          <InventoryAutocomplete
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handleAddItem}
            inventoryItems={inventoryData}
            placeholder="Type to search and add items..."
          />
        </div>

        {/* Selected Items List */}
        {selectedItems.length > 0 && (
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Selected Items</Label>
            {selectedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    €{item.unitPrice.toFixed(2)} per {item.unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                    className="w-16 h-8 text-xs"
                  />
                  <Badge variant="secondary" className="text-xs">
                    €{item.total.toFixed(2)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleRemoveItem(item.id, e)}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Total:</span>
              <Badge className="text-sm">
                €{getTotalAmount().toFixed(2)}
              </Badge>
            </div>
          </div>
        )}

        {selectedItems.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No items selected. Search and select items from your inventory.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryItemsSelector;

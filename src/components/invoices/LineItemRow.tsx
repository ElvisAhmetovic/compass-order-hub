import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { InvoiceLineItem } from '@/types/invoice';
import { formatCurrency } from '@/utils/currencyUtils';
import InventoryAutocomplete from '@/components/inventory/InventoryAutocomplete';
import { useInventory } from '@/hooks/useInventory';

interface LineItemRowProps {
  item: InvoiceLineItem;
  index: number;
  currency: string;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
}

const LineItemRow: React.FC<LineItemRowProps> = ({
  item,
  index,
  currency,
  onUpdate,
  onRemove
}) => {
  const { inventoryData } = useInventory();

  const handleInventorySelect = (inventoryItem: any) => {
    console.log('Selected inventory item:', inventoryItem);
    console.log('Item index:', index);
    
    // Parse the price more robustly
    const parsePrice = (priceStr: string) => {
      if (!priceStr) return 0;
      console.log('Parsing price:', priceStr);
      
      // Remove currency symbols and letters, keep numbers, dots, and commas
      const cleanStr = priceStr.replace(/[^\d.,]/g, '');
      console.log('Cleaned price string:', cleanStr);
      
      // Handle European format (comma as decimal separator)
      const normalizedStr = cleanStr.includes(',') && !cleanStr.includes('.') 
        ? cleanStr.replace(',', '.') 
        : cleanStr.replace(',', '');
      
      const parsed = parseFloat(normalizedStr) || 0;
      console.log('Parsed price:', parsed);
      return parsed;
    };

    const parsedPrice = parsePrice(inventoryItem.price);
    
    console.log('Updating fields:');
    console.log('- Description:', inventoryItem.name);
    console.log('- Price:', parsedPrice);
    console.log('- Unit:', inventoryItem.unit || 'pcs');

    // Update each field individually with logging
    onUpdate(index, 'item_description', inventoryItem.name);
    console.log('Updated description');
    
    onUpdate(index, 'unit_price', parsedPrice);
    console.log('Updated price');
    
    onUpdate(index, 'unit', inventoryItem.unit || 'pcs');
    console.log('Updated unit');
  };

  const handleDescriptionChange = (value: string) => {
    console.log('Description changed to:', value);
    onUpdate(index, 'item_description', value);
  };

  return (
    <TableRow className="h-24 border-b">
      <TableCell className="w-1/2 min-w-[400px] py-3 align-top">
        <div className="min-h-[56px]">
          <InventoryAutocomplete
            value={item.item_description}
            onChange={handleDescriptionChange}
            onSelect={handleInventorySelect}
            inventoryItems={inventoryData}
            placeholder="Type to search products/services..."
          />
        </div>
      </TableCell>
      <TableCell className="py-3 align-top">
        <Input
          type="number"
          step="0.001"
          value={item.quantity}
          onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
          className="w-20 h-14"
        />
      </TableCell>
      <TableCell className="py-3 align-top">
        <Input
          value={item.unit}
          onChange={(e) => onUpdate(index, 'unit', e.target.value)}
          className="w-16 h-14"
        />
      </TableCell>
      <TableCell className="py-3 align-top">
        <Input
          type="number"
          step="0.01"
          value={item.unit_price}
          onChange={(e) => onUpdate(index, 'unit_price', parseFloat(e.target.value) || 0)}
          className="w-28 h-14"
        />
      </TableCell>
      <TableCell className="py-3 align-top">
        <Input
          type="number"
          step="0.01"
          value={(item.vat_rate * 100).toFixed(2)}
          onChange={(e) => onUpdate(index, 'vat_rate', (parseFloat(e.target.value) || 0) / 100)}
          className="w-20 h-14"
        />
      </TableCell>
      <TableCell className="py-3 align-top">
        <Input
          type="number"
          step="0.01"
          value={(item.discount_rate * 100).toFixed(2)}
          onChange={(e) => onUpdate(index, 'discount_rate', (parseFloat(e.target.value) || 0) / 100)}
          className="w-20 h-14"
        />
      </TableCell>
      <TableCell className="py-3 align-top">
        <div className="font-medium text-right">
          {formatCurrency(item.line_total, currency)}
        </div>
      </TableCell>
      <TableCell className="py-3 align-top">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="h-14 w-14"
        >
          <Trash2 size={16} />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default LineItemRow;

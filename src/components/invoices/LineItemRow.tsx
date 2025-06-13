
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
    // Parse the price to get numeric value
    const parsePrice = (priceStr: string) => {
      if (!priceStr) return 0;
      const numStr = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
      return parseFloat(numStr) || 0;
    };

    onUpdate(index, 'item_description', inventoryItem.name);
    onUpdate(index, 'unit_price', parsePrice(inventoryItem.price));
    onUpdate(index, 'unit', inventoryItem.unit || 'pcs');
  };

  return (
    <TableRow className="h-16">
      <TableCell className="w-1/2 min-w-[300px] py-3">
        <InventoryAutocomplete
          value={item.item_description}
          onChange={(value) => onUpdate(index, 'item_description', value)}
          onSelect={handleInventorySelect}
          inventoryItems={inventoryData}
          placeholder="Item description"
          className="min-h-[40px]"
        />
      </TableCell>
      <TableCell className="py-3">
        <Input
          type="number"
          step="0.001"
          value={item.quantity}
          onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
          className="w-20 h-10"
        />
      </TableCell>
      <TableCell className="py-3">
        <Input
          value={item.unit}
          onChange={(e) => onUpdate(index, 'unit', e.target.value)}
          className="w-16 h-10"
        />
      </TableCell>
      <TableCell className="py-3">
        <Input
          type="number"
          step="0.01"
          value={item.unit_price}
          onChange={(e) => onUpdate(index, 'unit_price', parseFloat(e.target.value) || 0)}
          className="w-28 h-10"
        />
      </TableCell>
      <TableCell className="py-3">
        <Input
          type="number"
          step="0.01"
          value={(item.vat_rate * 100).toFixed(2)}
          onChange={(e) => onUpdate(index, 'vat_rate', (parseFloat(e.target.value) || 0) / 100)}
          className="w-20 h-10"
        />
      </TableCell>
      <TableCell className="py-3">
        <Input
          type="number"
          step="0.01"
          value={(item.discount_rate * 100).toFixed(2)}
          onChange={(e) => onUpdate(index, 'discount_rate', (parseFloat(e.target.value) || 0) / 100)}
          className="w-20 h-10"
        />
      </TableCell>
      <TableCell className="py-3">
        <span className="font-medium">
          {formatCurrency(item.line_total, currency)}
        </span>
      </TableCell>
      <TableCell className="py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="h-10 w-10"
        >
          <Trash2 size={16} />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default LineItemRow;

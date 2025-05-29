
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
    <TableRow>
      <TableCell>
        <InventoryAutocomplete
          value={item.item_description}
          onChange={(value) => onUpdate(index, 'item_description', value)}
          onSelect={handleInventorySelect}
          inventoryItems={inventoryData}
          placeholder="Item description"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.001"
          value={item.quantity}
          onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
          className="w-20"
        />
      </TableCell>
      <TableCell>
        <Input
          value={item.unit}
          onChange={(e) => onUpdate(index, 'unit', e.target.value)}
          className="w-16"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          value={item.unit_price}
          onChange={(e) => onUpdate(index, 'unit_price', parseFloat(e.target.value) || 0)}
          className="w-24"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          value={(item.vat_rate * 100).toFixed(2)}
          onChange={(e) => onUpdate(index, 'vat_rate', (parseFloat(e.target.value) || 0) / 100)}
          className="w-20"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          value={(item.discount_rate * 100).toFixed(2)}
          onChange={(e) => onUpdate(index, 'discount_rate', (parseFloat(e.target.value) || 0) / 100)}
          className="w-20"
        />
      </TableCell>
      <TableCell>
        <span className="font-medium">
          {formatCurrency(item.line_total, currency)}
        </span>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
        >
          <Trash2 size={16} />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default LineItemRow;


import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import InventoryItemsSelector, { SelectedInventoryItem } from "../InventoryItemsSelector";
import { OrderFormData, ValidationErrors } from "./validation";

interface User {
  id: string;
  full_name: string;
}

interface OrderDetailsSectionProps {
  order: Order | null;
  data: OrderFormData & { assigned_to?: string };
  errors: ValidationErrors;
  isEditing: boolean;
  onChange: (field: keyof (OrderFormData & { assigned_to?: string }), value: string | number) => void;
  selectedInventoryItems: SelectedInventoryItem[];
  onInventoryItemsChange: (items: SelectedInventoryItem[]) => void;
  internalNotes: string;
  onInternalNotesChange: (notes: string) => void;
}

const OrderDetailsSection = ({
  order,
  data,
  errors,
  isEditing,
  onChange,
  selectedInventoryItems,
  onInventoryItemsChange,
  internalNotes,
  onInternalNotesChange
}: OrderDetailsSectionProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Early return if order is null
  if (!order) {
    return (
      <div className="space-y-6">
        <div className="p-4 text-center text-muted-foreground">
          No order data available
        </div>
      </div>
    );
  }

  // Load users for assignment dropdown
  useEffect(() => {
    const loadUsers = async () => {
      if (!isEditing) return;
      
      setLoadingUsers(true);
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .order('first_name');
        
        if (error) {
          console.error('Error loading users:', error);
          return;
        }
        
        const formattedUsers = profiles.map(profile => ({
          id: profile.id,
          full_name: `${profile.first_name} ${profile.last_name}`.trim() || 'Unknown User'
        }));
        
        setUsers(formattedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    loadUsers();
  }, [isEditing]);

  // Parse and set inventory items when order changes
  useEffect(() => {
    if (order?.inventory_items && typeof order.inventory_items === 'string') {
      try {
        const items = JSON.parse(order.inventory_items);
        onInventoryItemsChange(items);
      } catch (error) {
        console.error('Error parsing inventory items:', error);
        onInventoryItemsChange([]);
      }
    } else {
      onInventoryItemsChange([]);
    }
  }, [order?.inventory_items, onInventoryItemsChange]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Order Metadata - Read Only */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
            <div className="text-sm">{order.created_at ? formatDate(order.created_at) : 'Unknown'}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
            <div className="text-sm">{order.updated_at ? formatDate(order.updated_at) : 'Never'}</div>
          </div>
        </div>

        {order.created_by && (
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Created By</Label>
            <div className="text-sm">{order.created_by}</div>
          </div>
        )}

        <div>
          <Label className="text-sm font-medium text-muted-foreground">Order Amount</Label>
          <div className="text-lg font-semibold">
            {formatCurrency(order.price || 0, order.currency)}
          </div>
        </div>
      </div>

      {/* Assignment Section */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Assigned To</Label>
        {isEditing ? (
          <Select 
            value={data.assigned_to || "unassigned"} 
            onValueChange={(value) => onChange('assigned_to', value === "unassigned" ? "" : value)}
            disabled={loadingUsers}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select user to assign"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2">
            {order.assigned_to_name ? (
              <Badge variant="secondary">{order.assigned_to_name}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">Unassigned</span>
            )}
          </div>
        )}
      </div>

      {/* Inventory Items Section */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Inventory Items</Label>
        {isEditing ? (
          <InventoryItemsSelector
            selectedItems={selectedInventoryItems}
            onItemsChange={onInventoryItemsChange}
            className="w-full"
          />
        ) : (
          <div className="space-y-2">
            {selectedInventoryItems.length > 0 ? (
              selectedInventoryItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    {item.description && (
                      <span className="text-sm text-muted-foreground ml-2">- {item.description}</span>
                    )}
                  </div>
                  <div className="text-sm">
                    Qty: {item.quantity} | Price: €{item.unitPrice}
                  </div>
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No inventory items selected</span>
            )}
          </div>
        )}
      </div>

      {/* Description Section */}
      {order.description && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Description</Label>
          <div className="p-3 bg-muted/50 rounded-md text-sm">
            {order.description}
          </div>
        </div>
      )}

      {/* Internal Notes Section */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Internal Notes</Label>
        {isEditing ? (
          <Textarea
            placeholder="Internal notes and comments (not visible to clients)..."
            value={internalNotes}
            onChange={(e) => onInternalNotesChange(e.target.value)}
            className="min-h-[80px]"
          />
        ) : (
          <div className="p-3 bg-muted/50 rounded-md text-sm min-h-[80px]">
            {internalNotes || (
              <span className="text-muted-foreground italic">No internal notes</span>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          These notes are for internal use only and won't appear in proposals or invoices
        </p>
      </div>
    </div>
  );
};

export default OrderDetailsSection;


import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DollarSign, User, Calendar, Clock, Package } from "lucide-react";
import { OrderFormData, ValidationErrors } from "./validation";
import { Order, OrderPriority } from "@/types";
import { formatDate } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyUtils";
import { useState, useEffect } from "react";
import { SearchService } from "@/services/searchService";
import InventoryItemsSelector, { SelectedInventoryItem } from "../InventoryItemsSelector";

interface OrderDetailsSectionProps {
  order: Order;
  data: OrderFormData & { assigned_to?: string };
  errors: ValidationErrors;
  isEditing: boolean;
  onChange: (field: keyof (OrderFormData & { assigned_to?: string }), value: string | number) => void;
  selectedInventoryItems?: SelectedInventoryItem[];
  onInventoryItemsChange?: (items: SelectedInventoryItem[]) => void;
}

const OrderDetailsSection = ({ 
  order, 
  data, 
  errors, 
  isEditing, 
  onChange,
  selectedInventoryItems = [],
  onInventoryItemsChange = () => {}
}: OrderDetailsSectionProps) => {
  const [assignedUsers, setAssignedUsers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const loadAssignedUsers = async () => {
      const options = await SearchService.getFilterOptions();
      setAssignedUsers(options.assignedUsers);
    };
    if (isEditing) {
      loadAssignedUsers();
    }
  }, [isEditing]);

  const getPriorityColor = (priority: string) => {
    const priorityClasses = {
      "low": "bg-priority-low text-white border-priority-low",
      "medium": "bg-priority-medium text-white border-priority-medium", 
      "high": "bg-priority-high text-white border-priority-high",
      "urgent": "bg-priority-urgent text-white border-priority-urgent",
    };
    return priorityClasses[priority.toLowerCase()] || "bg-priority-medium text-white border-priority-medium";
  };

  const formatPriorityDisplay = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  // Parse existing inventory items from order
  useEffect(() => {
    if (order.inventory_items && selectedInventoryItems.length === 0) {
      try {
        const parsedItems = JSON.parse(order.inventory_items as string);
        onInventoryItemsChange(parsedItems);
      } catch (error) {
        console.error('Error parsing inventory items:', error);
      }
    }
  }, [order.inventory_items, selectedInventoryItems.length, onInventoryItemsChange]);

  const handleAssignedToChange = (value: string) => {
    // Convert "unassigned" back to empty string for the form data
    const actualValue = value === "unassigned" ? "" : value;
    onChange('assigned_to', actualValue);
  };

  return (
    <div className="space-y-4">
      {/* Inventory Items Section */}
      {isEditing && (
        <div>
          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Package className="h-3 w-3" />
            Inventory Items
          </Label>
          <div className="mt-2">
            <InventoryItemsSelector
              selectedItems={selectedInventoryItems}
              onItemsChange={onInventoryItemsChange}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Display existing inventory items when not editing */}
      {!isEditing && order.inventory_items && (
        <div>
          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Package className="h-3 w-3" />
            Inventory Items
          </Label>
          <div className="mt-2 space-y-2">
            {(() => {
              try {
                const items = JSON.parse(order.inventory_items as string);
                return items.map((item: SelectedInventoryItem, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {item.quantity} {item.unit} × €{item.unitPrice.toFixed(2)}
                      </span>
                    </div>
                    <Badge variant="secondary">€{item.total.toFixed(2)}</Badge>
                  </div>
                ));
              } catch (error) {
                return <p className="text-sm text-muted-foreground">No inventory items</p>;
              }
            })()}
          </div>
        </div>
      )}

      <div>
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          Price
        </Label>
        {isEditing ? (
          <div>
            <Input
              type="number"
              step="0.01"
              value={data.price || 0}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                onChange('price', Math.max(0, value));
              }}
              placeholder="0.00"
              className={`mt-1 ${errors.price ? 'border-destructive' : ''}`}
            />
            {errors.price && (
              <p className="text-sm text-destructive mt-1">{errors.price}</p>
            )}
          </div>
        ) : (
          <p className="text-sm font-semibold">{formatCurrency(order.price || 0, order.currency || "EUR")}</p>
        )}
      </div>

      <div>
        <Label className="text-sm font-medium text-muted-foreground">Currency</Label>
        {isEditing ? (
          <Select 
            value={data.currency || "EUR"} 
            onValueChange={(value) => onChange('currency', value || "EUR")}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="CHF">CHF</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm">{order.currency || 'EUR'}</p>
        )}
      </div>

      <div>
        <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
        {isEditing ? (
          <Select 
            value={data.priority || "medium"} 
            onValueChange={(value) => onChange('priority', value || "medium")}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-priority-low"></div>
                  Low
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-priority-medium"></div>
                  Medium
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-priority-high"></div>
                  High
                </div>
              </SelectItem>
              <SelectItem value="urgent">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-priority-urgent"></div>
                  Urgent
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge className={`${getPriorityColor(order.priority || "medium")} font-medium`}>
            {formatPriorityDisplay(order.priority || "medium")}
          </Badge>
        )}
      </div>
      
      <div>
        <Label className="text-sm font-medium text-muted-foreground">Description</Label>
        {isEditing ? (
          <Textarea
            value={data.description || ""}
            onChange={(e) => onChange('description', e.target.value || "")}
            placeholder="Order description"
            className="mt-1"
            rows={3}
          />
        ) : (
          <p className="text-sm">{order.description || "No description provided"}</p>
        )}
      </div>
      
      <div>
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <User className="h-3 w-3" />
          Assigned To
        </Label>
        {isEditing ? (
          <Select 
            value={data.assigned_to === "" ? "unassigned" : (data.assigned_to || "unassigned")} 
            onValueChange={handleAssignedToChange}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select user..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {assignedUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm">{order.assigned_to_name || "Unassigned"}</p>
        )}
      </div>
      
      <div>
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Created
        </Label>
        <p className="text-sm">{formatDate(order.created_at)}</p>
      </div>
      
      <div>
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Last Updated
        </Label>
        <p className="text-sm">{formatDate(order.updated_at || order.created_at)}</p>
      </div>
    </div>
  );
};

export default OrderDetailsSection;

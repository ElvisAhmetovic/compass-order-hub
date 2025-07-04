import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, User, Calendar, Clock, Package, FileText } from "lucide-react";
import { OrderFormData, ValidationErrors } from "./validation";
import { Order, OrderPriority } from "@/types";
import { formatDate } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyUtils";
import { useState, useEffect, useRef } from "react";
import { SearchService } from "@/services/searchService";
import InventoryItemsSelector, { SelectedInventoryItem } from "../InventoryItemsSelector";

interface OrderDetailsSectionProps {
  order: Order;
  data: OrderFormData & { assigned_to?: string; internal_notes?: string; description?: string };
  errors: ValidationErrors;
  isEditing: boolean;
  onChange: (field: keyof (OrderFormData & { assigned_to?: string; internal_notes?: string; description?: string }), value: string | number) => void;
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
  const inventoryInitialized = useRef(false);

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

  // Parse existing inventory items from order - but only once
  useEffect(() => {
    if (order.inventory_items && !inventoryInitialized.current && selectedInventoryItems.length === 0) {
      try {
        const parsedItems = JSON.parse(order.inventory_items as string);
        onInventoryItemsChange(parsedItems);
        inventoryInitialized.current = true;
        console.log('Initialized inventory items from order:', parsedItems);
      } catch (error) {
        console.error('Error parsing inventory items:', error);
        inventoryInitialized.current = true;
      }
    }
  }, [order.inventory_items, selectedInventoryItems.length, onInventoryItemsChange]);

  // Reset initialization flag when switching between orders
  useEffect(() => {
    inventoryInitialized.current = false;
  }, [order.id]);

  // Ensure we have valid data and prevent null/undefined values
  const safeData = {
    ...data,
    company_name: data.company_name || order.company_name || "",
    company_address: data.company_address || order.company_address || "",
    contact_email: data.contact_email || order.contact_email || "",
    contact_phone: data.contact_phone || order.contact_phone || "",
    company_link: data.company_link || order.company_link || "",
    price: data.price !== undefined ? data.price : (order.price || 0),
    currency: data.currency || order.currency || "EUR",
    priority: data.priority || order.priority || "medium",
    assigned_to: data.assigned_to || order.assigned_to || "unassigned",
    internal_notes: data.internal_notes !== undefined ? data.internal_notes : (order.internal_notes || ""),
    description: data.description !== undefined ? data.description : (order.description || "")
  };

  const handleAssignedToChange = (value: string) => {
    const actualValue = value === "unassigned" ? "" : value;
    onChange('assigned_to', actualValue);
  };

  // Helper function to format text for display with proper line breaks and structure
  const formatTextDisplay = (text: string) => {
    if (!text) return null;
    
    // Split by double line breaks first to create paragraphs
    const paragraphs = text.split('\n\n');
    
    return paragraphs.map((paragraph, paragraphIndex) => {
      // Split each paragraph by single line breaks
      const lines = paragraph.split('\n');
      
      return (
        <div key={paragraphIndex} className={paragraphIndex > 0 ? 'mt-3' : ''}>
          {lines.map((line, lineIndex) => (
            <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
              {line}
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Description Section */}
      <div>
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Description
        </Label>
        {isEditing ? (
          <div>
            <Textarea
              value={safeData.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder={`Description that will be visible to clients in proposals/invoices...

Example formatting:
1. First item or step
2. Second item or step
3. Third item or step

Key features:
• Feature one
• Feature two
• Feature three

Additional details in new paragraphs...`}
              className="mt-1 min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This description will be included in proposals and invoices. Use line breaks for better formatting. Press Enter twice for new paragraphs.
            </p>
          </div>
        ) : (
          <div className="mt-2">
            {order.description ? (
              <div className="p-3 bg-muted/50 rounded-md text-sm" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                {formatTextDisplay(order.description)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description</p>
            )}
          </div>
        )}
      </div>

      {/* Internal Notes Section */}
      <div>
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Internal Notes
        </Label>
        {isEditing ? (
          <div>
            <Textarea
              value={safeData.internal_notes}
              onChange={(e) => onChange('internal_notes', e.target.value)}
              placeholder={`Internal notes and comments (not visible to clients)...

Example formatting:
1. First priority task
2. Second priority task
3. Follow-up needed

Notes:
• Client prefers email contact
• Payment terms: Net 30
• Special requirements noted

Additional internal comments...`}
              className="mt-1 min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              These notes are for internal use only and won't appear in proposals or invoices. Use line breaks for better formatting. Press Enter twice for new paragraphs.
            </p>
          </div>
        ) : (
          <div className="mt-2">
            {order.internal_notes ? (
              <div className="p-3 bg-muted/50 rounded-md text-sm" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                {formatTextDisplay(order.internal_notes)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No internal notes</p>
            )}
          </div>
        )}
      </div>

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
              value={safeData.price || 0}
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
            value={safeData.currency} 
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
            value={safeData.priority} 
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
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <User className="h-3 w-3" />
          Assigned To
        </Label>
        {isEditing ? (
          <Select 
            value={safeData.assigned_to === "" ? "unassigned" : safeData.assigned_to} 
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


import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DollarSign, User, Calendar, Clock } from "lucide-react";
import { OrderFormData, ValidationErrors } from "./validation";
import { Order, OrderPriority } from "@/types";
import { formatDate } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyUtils";

interface OrderDetailsSectionProps {
  order: Order;
  data: OrderFormData;
  errors: ValidationErrors;
  isEditing: boolean;
  onChange: (field: keyof OrderFormData, value: string | number) => void;
}

const OrderDetailsSection = ({ order, data, errors, isEditing, onChange }: OrderDetailsSectionProps) => {
  const getPriorityColor = (priority: string) => {
    const priorityClasses = {
      "low": "bg-priority-low text-white",
      "medium": "bg-priority-medium text-white", 
      "high": "bg-priority-high text-white",
      "urgent": "bg-priority-urgent text-white",
    };
    return priorityClasses[priority.toLowerCase()] || "bg-gray-500 text-white";
  };

  const formatPriorityDisplay = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  return (
    <div className="space-y-3">
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
              onChange={(e) => onChange('price', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className={`mt-1 ${errors.price ? 'border-destructive' : ''}`}
            />
            {errors.price && (
              <p className="text-sm text-destructive mt-1">{errors.price}</p>
            )}
          </div>
        ) : (
          <p className="text-sm font-semibold">{formatCurrency(order.price || 0)}</p>
        )}
      </div>

      <div>
        <Label className="text-sm font-medium text-muted-foreground">Currency</Label>
        {isEditing ? (
          <Select value={data.currency} onValueChange={(value) => onChange('currency', value)}>
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
            value={data.priority} 
            onValueChange={(value) => onChange('priority', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge className={getPriorityColor(order.priority || "medium")}>
            {formatPriorityDisplay(order.priority || "medium")}
          </Badge>
        )}
      </div>
      
      <div>
        <Label className="text-sm font-medium text-muted-foreground">Description</Label>
        {isEditing ? (
          <Textarea
            value={data.description}
            onChange={(e) => onChange('description', e.target.value)}
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
        <p className="text-sm">{order.assigned_to_name || "Unassigned"}</p>
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

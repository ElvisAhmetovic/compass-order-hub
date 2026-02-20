
import { useState, useEffect } from "react";
import { Search, ChevronDown, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Order } from "@/types";
import { OrderService } from "@/services/orderService";
import { formatCurrency } from "@/utils/currencyUtils";

interface OrderSearchDropdownProps {
  onOrderSelect: (order: Order) => void;
  className?: string;
}

const OrderSearchDropdown = ({ onOrderSelect, className }: OrderSearchDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Load orders when dropdown opens - always refresh
  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen]);

  // Filter orders based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = orders.filter(order => 
        order.company_name.toLowerCase().includes(query) ||
        order.contact_email?.toLowerCase().includes(query) ||
        order.status.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query)
      );
      setFilteredOrders(filtered);
    }
  }, [searchQuery, orders]);

  const loadOrders = async (isRetry = false) => {
    setLoading(true);
    setError(false);
    try {
      const [regularOrders, yearlyPackages] = await Promise.all([
        OrderService.getOrders(),
        OrderService.getYearlyPackages()
      ]);
      const allOrders = [...regularOrders, ...yearlyPackages];
      setOrders(allOrders);
      setFilteredOrders(allOrders);
    } catch (err) {
      console.error("Error loading orders:", err);
      if (!isRetry) {
        await new Promise(r => setTimeout(r, 500));
        return loadOrders(true);
      }
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (order: Order) => {
    onOrderSelect(order);
    setIsOpen(false);
    setSearchQuery("");
  };

  const getPriorityColor = (priority: string) => {
    const priorityClasses = {
      "low": "bg-priority-low text-white",
      "medium": "bg-priority-medium text-white", 
      "high": "bg-priority-high text-white",
      "urgent": "bg-priority-urgent text-white",
    };
    return priorityClasses[priority?.toLowerCase()] || "bg-priority-medium text-white";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`w-full justify-between ${className}`}
          type="button"
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search existing orders to autofill
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <div className="p-3 border-b">
          <Input
            placeholder="Search by company name, email, status, or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading orders...
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-destructive mb-2">Failed to load orders</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadOrders()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? "No orders found matching your search" : "No orders available"}
            </div>
          ) : (
            <div className="p-2">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3 hover:bg-muted rounded-md cursor-pointer border-b last:border-b-0"
                  onClick={() => handleOrderSelect(order)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {order.company_name}
                        </h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getPriorityColor(order.priority || "medium")}`}
                        >
                          {order.priority || "medium"}
                        </Badge>
                        {order.is_yearly_package && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Yearly Package
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.contact_email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {order.status}
                        </Badge>
                        {order.price && (
                          <span className="text-xs font-medium">
                            {formatCurrency(order.price, order.currency || "EUR")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 truncate">
                    ID: {order.id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default OrderSearchDropdown;


import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/types";
import { OrderService } from "@/services/orderService";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/currencyUtils";

interface SearchableOrder extends Order {
  _source?: "order" | "offer";
}

interface OrderSearchDropdownProps {
  onOrderSelect: (order: Order) => void;
  className?: string;
}

const OrderSearchDropdown = ({ onOrderSelect, className }: OrderSearchDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<SearchableOrder[]>([]);
  const [filteredItems, setFilteredItems] = useState<SearchableOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Load orders + offers when dropdown opens
  useEffect(() => {
    if (isOpen && items.length === 0) {
      loadItems();
    }
  }, [isOpen]);

  // Filter based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = items.filter(item =>
        item.company_name.toLowerCase().includes(query) ||
        item.contact_email?.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, items]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const [regularOrders, yearlyPackages, offersResult] = await Promise.all([
        OrderService.getOrders(),
        OrderService.getYearlyPackages(),
        supabase.from("offers").select("*").order("created_at", { ascending: false })
      ]);

      const allOrders: SearchableOrder[] = [...regularOrders, ...yearlyPackages].map(o => ({
        ...o,
        _source: "order" as const
      }));

      // Build a set of existing order keys for dedup
      const orderKeys = new Set(
        allOrders.map(o => `${o.company_name.toLowerCase()}|${(o.contact_email || "").toLowerCase()}`)
      );

      // Map offers to pseudo-order shape, skipping duplicates
      const offers = (offersResult.data || []);
      const offerItems: SearchableOrder[] = [];
      for (const offer of offers) {
        const key = `${offer.company_name.toLowerCase()}|${offer.client_email.toLowerCase()}`;
        if (orderKeys.has(key)) continue;
        orderKeys.add(key); // avoid duplicate offers too

        const orderData = (offer.order_data as any) || {};
        offerItems.push({
          id: offer.id,
          company_name: offer.company_name,
          contact_email: offer.client_email,
          contact_name: offer.client_name,
          contact_phone: offer.client_phone || undefined,
          company_address: offer.client_address || undefined,
          company_link: orderData.companyLink || undefined,
          price: offer.price,
          currency: offer.currency,
          description: offer.description || undefined,
          status: "Offer",
          priority: "medium",
          created_at: offer.created_at,
          _source: "offer"
        });
      }

      const merged = [...allOrders, ...offerItems];
      setItems(merged);
      setFilteredItems(merged);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (order: SearchableOrder) => {
    const { _source, ...cleanOrder } = order;
    onOrderSelect(cleanOrder as Order);
    setIsOpen(false);
    setSearchQuery("");
  };

  const getPriorityColor = (priority: string) => {
    const priorityClasses: Record<string, string> = {
      "low": "bg-priority-low text-white",
      "medium": "bg-priority-medium text-white",
      "high": "bg-priority-high text-white",
      "urgent": "bg-priority-urgent text-white",
    };
    return priorityClasses[priority?.toLowerCase()] || "bg-priority-medium text-white";
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        className={`w-full justify-between ${className}`}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search existing orders to autofill
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-[100] w-full min-w-[500px] rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-3 border-b">
            <Input
              placeholder="Search by company name, email, status, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? "No results found" : "No orders or offers available"}
              </div>
            ) : (
              <div className="p-2">
                {filteredItems.map((item) => (
                  <div
                    key={`${item._source}-${item.id}`}
                    className="p-3 hover:bg-muted rounded-md cursor-pointer border-b last:border-b-0"
                    onClick={() => handleOrderSelect(item)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {item.company_name}
                          </h4>
                          {item._source === "offer" ? (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                              From Offer
                            </Badge>
                          ) : (
                            <>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${getPriorityColor(item.priority || "medium")}`}
                              >
                                {item.priority || "medium"}
                              </Badge>
                              {item.is_yearly_package && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  Yearly Package
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.contact_email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {item.status}
                          </Badge>
                          {item.price && (
                            <span className="text-xs font-medium">
                              {formatCurrency(item.price, item.currency || "EUR")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 truncate">
                      ID: {item.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSearchDropdown;

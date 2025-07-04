
import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import OrderRow from "./OrderRow";
import OrderPagination from "./OrderPagination";
import AdvancedSearch from "./AdvancedSearch";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Order, OrderStatus, User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { OrderService } from "@/services/orderService";
import { SearchService, SearchFilters } from "@/services/searchService";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface OrderTableProps {
  onOrderClick: (order: Order) => void;
  statusFilter?: string | null;
  refreshTrigger?: number;
  isYearlyPackages?: boolean;
}

const OrderTable = ({ 
  onOrderClick, 
  statusFilter, 
  refreshTrigger = 0,
  isYearlyPackages = false 
}: OrderTableProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sorting state
  const [sortField, setSortField] = useState<'created_at' | 'updated_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  
  // Search and filter state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Fetch orders with better error handling
  const fetchOrders = useCallback(async () => {
    if (!user) {
      console.log('OrderTable: No user found, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      console.log(`OrderTable: Starting to fetch ${isYearlyPackages ? 'yearly packages' : 'regular orders'}...`);
      setLoading(true);
      setError(null);
      
      let orders: Order[];

      if (isYearlyPackages) {
        console.log('OrderTable: Fetching yearly packages only');
        if (statusFilter && statusFilter !== "All") {
          orders = await OrderService.getOrdersByStatus(statusFilter, true);
        } else {
          orders = await OrderService.getYearlyPackages();
        }
      } else {
        console.log('OrderTable: Fetching regular orders (excluding yearly packages)');
        if (statusFilter && statusFilter !== "All") {
          orders = await OrderService.getOrdersByStatus(statusFilter, false);
        } else {
          orders = await OrderService.getOrders(false); // false means exclude yearly packages
        }
      }

      console.log(`OrderTable: Successfully fetched ${orders.length} ${isYearlyPackages ? 'yearly package' : 'regular'} orders`);
      
      // Filter orders for non-admin users to only show their assigned orders
      if (!isAdmin && user) {
        orders = orders.filter(order => order.assigned_to === user.id);
        console.log(`OrderTable: Filtered to ${orders.length} orders for user ${user.id}`);
      }
      
      setOrders(orders);
    } catch (error) {
      console.error("OrderTable: Error fetching orders:", error);
      setError("Failed to load orders. Please try again.");
      toast({
        variant: "destructive",
        title: "Error loading orders",
        description: "Failed to load orders. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, isYearlyPackages, toast, user, isAdmin]);

  // Initial fetch and refresh trigger
  useEffect(() => {
    console.log('OrderTable useEffect triggered - refreshTrigger:', refreshTrigger);
    fetchOrders();
  }, [fetchOrders, refreshTrigger]);

  // Apply filters and sorting whenever orders or filter criteria change
  useEffect(() => {
    console.log('OrderTable: Applying filters and sorting to orders...');
    let result = [...orders];
    
    // Apply status filter using the same logic as dashboard
    if (statusFilter && statusFilter !== "All") {
      // Use the new status system
      result = result.filter(order => {
        const activeStatuses = OrderService.getActiveStatuses(order);
        return activeStatuses.includes(statusFilter as OrderStatus);
      });
    } else if (statusFilter === "All") {
      // For "All", show orders that don't have resolved, cancelled, or deleted status
      result = result.filter(order => 
        !order.status_resolved && !order.status_cancelled && !order.status_deleted
      );
    }
    
    // Apply advanced search filters using the same method as dashboard
    if (Object.keys(searchFilters).length > 0) {
      result = SearchService.applyFiltersToOrders(result, searchFilters);
    }
    
    // Apply sorting - same as dashboard
    result.sort((a, b) => {
      const dateA = new Date(a[sortField] || '').getTime();
      const dateB = new Date(b[sortField] || '').getTime();
      
      if (sortDirection === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
    
    console.log(`OrderTable: Filtered orders: ${result.length} out of ${orders.length}`);
    setFilteredOrders(result);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [orders, statusFilter, searchFilters, sortField, sortDirection]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const toggleSort = (field: 'created_at' | 'updated_at') => {
    if (sortField === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleRefresh = () => {
    console.log('OrderTable: Manual refresh triggered');
    // Trigger parent component refresh
    window.dispatchEvent(new CustomEvent('orderStatusChanged'));
  };

  const handleFiltersChange = (filters: SearchFilters) => {
    console.log('OrderTable: Applying new filters:', filters);
    setSearchFilters(filters);
  };

  // Show authentication message if user is not logged in
  if (!user) {
    return (
      <div>
        <div className="space-y-4 mb-4">
          <AdvancedSearch 
            onFiltersChange={handleFiltersChange}
            currentFilters={searchFilters}
          />
        </div>
        <div className="p-8 text-center border rounded-md">
          <p className="text-muted-foreground text-lg">Please log in to view orders.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <div className="space-y-4 mb-4">
          <AdvancedSearch 
            onFiltersChange={handleFiltersChange}
            currentFilters={searchFilters}
          />
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-2">Loading {isYearlyPackages ? 'yearly packages' : 'orders'}...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="space-y-4 mb-4">
          <AdvancedSearch 
            onFiltersChange={handleFiltersChange}
            currentFilters={searchFilters}
          />
        </div>
        <div className="p-4 text-center">
          <p className="text-destructive">{error}</p>
          <button 
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded"
            onClick={handleRefresh}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (filteredOrders.length === 0) {
    return (
      <div>
        <div className="space-y-4 mb-4">
          <AdvancedSearch 
            onFiltersChange={handleFiltersChange}
            currentFilters={searchFilters}
          />
        </div>
        <div className="p-8 text-center border rounded-md">
          <p className="text-muted-foreground text-lg">No {isYearlyPackages ? 'yearly packages' : 'orders'} found.</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin 
              ? (statusFilter || Object.keys(searchFilters).length > 0 ? "Try changing your filters or create a new order." : "Start by creating your first order.")
              : "You have no orders assigned to you."}
          </p>
        </div>
      </div>
    );
  }

  // Get current page of orders
  const indexOfLastOrder = currentPage * rowsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - rowsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg font-semibold">
              {isYearlyPackages ? 'Yearly Packages' : 'Orders'}
            </CardTitle>
            <CardDescription>
              {isYearlyPackages 
                ? 'Manage your yearly package orders'
                : 'Manage and track your orders'
              }
            </CardDescription>
          </div>
          <div>
            <AdvancedSearch 
              onFiltersChange={handleFiltersChange}
              currentFilters={searchFilters}
            />
          </div>
        </div>
      </CardHeader>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <colgroup>
            <col className="w-[25%]" />
            <col className="w-[15%]" />
            <col className="w-[12%]" />
            {isAdmin && <col className="w-[10%]" />}
            <col className="w-[10%]" />
            <col className="w-[15%]" />
            <col className="w-[12%]" />
            <col className="w-[13%]" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => toggleSort('created_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Created</span>
                  {sortField === 'created_at' && (
                    sortDirection === 'asc' ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              {isAdmin && <TableHead>Priority</TableHead>}
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => toggleSort('updated_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Updated</span>
                  {sortField === 'updated_at' && (
                    sortDirection === 'asc' ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentOrders.map((order) => (
              <OrderRow 
                key={order.id} 
                order={order}
                onOrderClick={onOrderClick}
                onRefresh={handleRefresh}
                assigneeName={order.assigned_to_name || "Unassigned"}
                hideActions={!isAdmin}
                hidePriority={!isAdmin}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center mt-4">
        <OrderPagination 
          currentPage={currentPage} 
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </Card>
  );
};

export default OrderTable;

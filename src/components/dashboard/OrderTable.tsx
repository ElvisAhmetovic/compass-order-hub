import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import OrderRow from "./OrderRow";
import { Order, OrderStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { OrderService } from "@/services/orderService";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import OrderFilters from "./OrderFilters";
import OrderPagination from "./OrderPagination";
import AdvancedSearch from "./AdvancedSearch";

interface OrderTableProps {
  onOrderClick: (order: Order) => void;
  statusFilter?: OrderStatus | string | null;
  refreshTrigger?: number;
  isYearlyPackages?: boolean;
}

const OrderTable = ({ 
  onOrderClick, 
  statusFilter = null, 
  refreshTrigger = 0,
  isYearlyPackages = false
}: OrderTableProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidePriority, setHidePriority] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advancedSearchCriteria, setAdvancedSearchCriteria] = useState({});
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { toast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data: fetchedOrders, error, count } = await OrderService.getOrders(
          statusFilter,
          searchQuery,
          selectedStatuses,
          selectedPriorities,
          advancedSearchCriteria,
          isYearlyPackages
        );

        if (error) {
          console.error("Error fetching orders:", error);
          toast({
            title: "Error",
            description: "Failed to fetch orders. Please check your connection and try again.",
            variant: "destructive"
          });
          return;
        }

        setOrders(fetchedOrders || []);
        setTotalOrders(count || 0);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [statusFilter, refreshTrigger, searchQuery, selectedStatuses, selectedPriorities, advancedSearchCriteria, isYearlyPackages]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to the first page when searching
  };

  const handleStatusChange = (statuses: string[]) => {
    setSelectedStatuses(statuses);
    setCurrentPage(1); // Reset to the first page when filtering
  };

  const handlePriorityChange = (priorities: string[]) => {
    setSelectedPriorities(priorities);
    setCurrentPage(1); // Reset to the first page when filtering
  };

  const handleAdvancedSearch = (criteria: any) => {
    setAdvancedSearchCriteria(criteria);
    setIsAdvancedSearchOpen(false); // Close the modal
    setCurrentPage(1); // Reset to the first page when advanced searching
  };

  const toggleAdvancedSearch = () => {
    setIsAdvancedSearchOpen(!isAdvancedSearchOpen);
  };

  // Get current orders
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const displayedOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleRefresh = () => {
    // Trigger a refresh to update our data
    window.dispatchEvent(new CustomEvent('orderStatusChanged'));
  };

  const getAssigneeName = (assigneeId: string | null) => {
    if (!assigneeId) return "Unassigned";
    
    const user = JSON.parse(localStorage.getItem('users') || '[]').find((u: any) => u.id === assigneeId);
    return user ? user.name : "Unknown User";
  };

  return (
    <div className="space-y-4">
      <OrderFilters
        onSearch={handleSearch}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        toggleAdvancedSearch={toggleAdvancedSearch}
        isAdmin={isAdmin}
      />

      <AdvancedSearch
        isOpen={isAdvancedSearchOpen}
        onClose={toggleAdvancedSearch}
        onSearch={handleAdvancedSearch}
      />

      {loading ? (
        <div className="flex justify-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading orders...
        </div>
      ) : (
        orders.length === 0 && !searchQuery && !statusFilter && !selectedStatuses.length ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <p>No orders found.</p>
            {isAdmin && (
              <Button variant="link" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            )}
          </div>
        ) : (
          orders.length === 0 && (searchQuery || statusFilter || selectedStatuses.length) ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p>No orders match your current search or filters.</p>
              <Button variant="link" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          ) : null
        )
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
              {!hidePriority && <TableHead>Priority</TableHead>}
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onOrderClick={onOrderClick}
                onRefresh={handleRefresh}
                assigneeName={getAssigneeName(order.assigned_to)}
                hideActions={false}
                hidePriority={hidePriority}
                isYearlyPackages={isYearlyPackages}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {orders.length > 0 && (
        <OrderPagination
          ordersPerPage={ordersPerPage}
          totalOrders={totalOrders}
          paginate={paginate}
          currentPage={currentPage}
        />
      )}
    </div>
  );
};

export default OrderTable;

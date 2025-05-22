
import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import OrderRow from "./OrderRow";
import OrderFilters from "./OrderFilters";
import OrderPagination from "./OrderPagination";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Order, OrderStatus, User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";

interface OrderTableProps {
  onOrderClick: (order: Order) => void;
  statusFilter: string | null;
  refreshTrigger: number;
}

const OrderTable = ({ onOrderClick, statusFilter, refreshTrigger }: OrderTableProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  
  // Sorting state
  const [sortField, setSortField] = useState<'created_at' | 'updated_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  
  // Additional filters
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user: localUser } = useAuth();
  const { user: supabaseUser } = useSupabaseAuth();
  
  // Get the authenticated user, prioritizing Supabase
  const user = supabaseUser || localUser;
  const isAdmin = user?.role === "admin" || user?.role === "owner";

  // Load users
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem("app_users");
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }, []);

  // Fetch orders (mock from localStorage in this case)
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        const storedOrders = localStorage.getItem("orders");
        let parsedOrders = storedOrders ? JSON.parse(storedOrders) : [];
        
        // Filter orders for non-admin users to only show their assigned orders
        if (!isAdmin && user) {
          parsedOrders = parsedOrders.filter((order: Order) => order.assigned_to === user.id);
        }
        // For admin users, show all orders (no filtering by assigned_to)
        
        setOrders(parsedOrders);
        setError(null);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load orders. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [refreshTrigger, toast, isAdmin, user]);

  // Apply filters and sorting whenever orders or filter criteria change
  useEffect(() => {
    let result = [...orders];
    
    // Apply status filter
    if (statusFilter) {
      if (statusFilter === "All") {
        // For regular users, only show orders assigned to them regardless of status
        if (!isAdmin) {
          // Already filtered in the fetchOrders function
        } else {
          // For admins, filter out specific statuses if needed when "All" is selected
          result = result.filter(order => 
            !["Resolved", "Cancelled", "Deleted"].includes(order.status)
          );
        }
      } else {
        // Both admin and regular users can filter by status
        // But regular users can only see orders assigned to them
        result = result.filter(order => order.status === statusFilter);
      }
    }
    
    // Apply priority filter - only for admins
    if (isAdmin && priorityFilter) {
      result = result.filter(order => order.priority === priorityFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a[sortField]).getTime();
      const dateB = new Date(b[sortField]).getTime();
      
      if (sortDirection === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
    
    setFilteredOrders(result);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [orders, statusFilter, priorityFilter, sortField, sortDirection, isAdmin]);

  // Get current page of orders
  const indexOfLastOrder = currentPage * rowsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - rowsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

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
    // This will be passed down to child components
  };

  const getAssigneeName = (userId: string): string => {
    if (!userId) return "Unassigned";
    const assigneeUser = users.find(u => u.id === userId);
    return assigneeUser?.full_name || assigneeUser?.email || userId;
  };

  // Always render the filters regardless of data state, but only for admins
  const renderFilters = () => {
    if (!isAdmin) return null;
    
    return (
      <div className="space-y-4 mb-4">
        <OrderFilters 
          onStatusChange={(status) => setPriorityFilter(status)} 
          selectedStatus={priorityFilter}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        {renderFilters()}
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {renderFilters()}
        <div className="p-4 text-center">
          <p className="text-destructive">{error}</p>
          <button 
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded"
            onClick={() => window.location.reload()}
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
        {renderFilters()}
        <div className="p-8 text-center border rounded-md">
          <p className="text-muted-foreground text-lg">No orders found.</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin 
              ? (statusFilter || priorityFilter ? "Try changing your filters or create a new order." : "Start by creating your first order.")
              : "You have no orders assigned to you."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderFilters()}
      
      <div className="rounded-md border overflow-hidden">
        <Table>
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
                assigneeName={order.assigned_to_name || getAssigneeName(order.assigned_to || "")}
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
    </div>
  );
};

export default OrderTable;

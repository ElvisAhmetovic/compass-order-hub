import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Order } from "@/types";
import { OrderService } from "@/services/orderService";
import OrderRow from "./OrderRow";

interface OrderTableProps {
  onOrderClick: (order: Order) => void;
  statusFilter?: string;
  refreshTrigger?: number;
  hideActions?: boolean;
  hidePriority?: boolean;
  showRemoveFromReview?: boolean;
}

const OrderTable = ({ 
  onOrderClick, 
  statusFilter, 
  refreshTrigger, 
  hideActions = false, 
  hidePriority = false,
  showRemoveFromReview = false
}: OrderTableProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        let fetchedOrders: Order[];
        if (statusFilter) {
          fetchedOrders = await OrderService.getOrdersByStatus(statusFilter);
        } else {
          fetchedOrders = await OrderService.getOrders();
        }
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    };

    fetchOrders();
  }, [statusFilter, refreshTrigger]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to the first page when searching
  };

  const handleSortChange = () => {
    setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value, 10));
    setCurrentPage(1); // Reset to the first page when items per page changes
  };

  const getAssigneeName = (order: Order): string => {
    if (order.assigned_to_name) {
      return order.assigned_to_name;
    } else if (order.assigned_to === user?.id) {
      return "You";
    } else {
      return "Unknown User";
    }
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order =>
      order.company_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort the orders based on the sortOrder
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });

    return filtered;
  }, [orders, searchQuery, sortOrder]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const handleRefresh = () => {
    window.dispatchEvent(new CustomEvent('refreshOrders'));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search orders..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <div className="flex items-center space-x-2">
          <Label htmlFor="items-per-page">Items per page:</Label>
          <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger id="items-per-page">
              <SelectValue placeholder={String(itemsPerPage)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Company</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="w-[100px]">
                <Button variant="ghost" size="sm" onClick={handleSortChange}>
                  Created At
                </Button>
              </TableHead>
              {!hidePriority && <TableHead>Priority</TableHead>}
              <TableHead>Price</TableHead>
              <TableHead>Statuses</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onOrderClick={onOrderClick}
                onRefresh={handleRefresh}
                assigneeName={getAssigneeName(order)}
                hideActions={hideActions}
                hidePriority={hidePriority}
                showRemoveFromReview={showRemoveFromReview}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationPrevious
              href="#"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem
                key={page}
                active={currentPage === page}
              >
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page)}
                  disabled={currentPage === page}
                >
                  {page}
                </Button>
              </PaginationItem>
            ))}
            <PaginationNext
              href="#"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default OrderTable;

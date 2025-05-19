
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Order, OrderStatus } from "@/types";

// Mock data for demonstration purposes
const mockOrders: Order[] = [
  {
    id: "1",
    company_name: "Acme Inc.",
    contact_name: "John Smith",
    contact_email: "john@acme.com",
    contact_phone: "555-1234",
    description: "Website redesign project",
    price: 5000,
    status: "Created",
    priority: "Medium",
    created_at: "2025-05-15T10:30:00Z",
    updated_at: "2025-05-15T10:30:00Z",
    created_by: "user1",
  },
  {
    id: "2",
    company_name: "Beta Corp",
    contact_name: "Jane Doe",
    contact_email: "jane@beta.com",
    contact_phone: "555-5678",
    description: "Mobile app development",
    price: 12000,
    status: "In Progress",
    priority: "High",
    created_at: "2025-05-10T09:15:00Z",
    updated_at: "2025-05-12T14:30:00Z",
    created_by: "user1",
    assigned_to: "user2",
  },
  {
    id: "3",
    company_name: "Gamma LLC",
    contact_name: "Bob Johnson",
    contact_email: "bob@gamma.com",
    description: "SEO consultation",
    price: 1500,
    status: "Invoice Sent",
    priority: "Low",
    created_at: "2025-05-08T16:45:00Z",
    updated_at: "2025-05-14T11:20:00Z",
    created_by: "user2",
  },
  {
    id: "4",
    company_name: "Delta Industries",
    contact_name: "Sarah Williams",
    contact_email: "sarah@delta.com",
    contact_phone: "555-9012",
    description: "Logo design and branding",
    price: 3000,
    status: "Complaint",
    priority: "Urgent",
    created_at: "2025-05-01T13:10:00Z",
    updated_at: "2025-05-11T09:45:00Z",
    created_by: "user1",
    assigned_to: "user3",
  },
  {
    id: "5",
    company_name: "Epsilon Co",
    contact_name: "Mike Brown",
    contact_email: "mike@epsilon.com",
    description: "E-commerce integration",
    price: 8000,
    status: "Invoice Paid",
    priority: "Medium",
    created_at: "2025-04-28T11:30:00Z",
    updated_at: "2025-05-13T16:20:00Z",
    created_by: "user3",
    assigned_to: "user1",
  },
];

interface OrdersTableProps {
  onOrderClick: (order: Order) => void;
}

const OrdersTable = ({ onOrderClick }: OrdersTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All");
  const [orders] = useState<Order[]>(mockOrders);

  const getStatusColor = (status: OrderStatus) => {
    const statusClasses = {
      "Created": "bg-status-created text-white",
      "In Progress": "bg-status-inprogress text-white",
      "Complaint": "bg-status-complaint text-white",
      "Invoice Sent": "bg-status-invoicesent text-white",
      "Invoice Paid": "bg-status-invoicepaid text-white",
      "Resolved": "bg-status-resolved text-white",
      "Cancelled": "bg-status-cancelled text-white",
      "Deleted": "bg-status-deleted text-white",
    };
    return statusClasses[status] || "bg-gray-500 text-white";
  };

  const getPriorityColor = (priority: string) => {
    const priorityClasses = {
      "Low": "bg-priority-low text-white",
      "Medium": "bg-priority-medium text-white",
      "High": "bg-priority-high text-white",
      "Urgent": "bg-priority-urgent text-white",
    };
    return priorityClasses[priority] || "bg-gray-500 text-white";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Status: {statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("All")}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Created")}>
                Created
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("In Progress")}>
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Complaint")}>
                Complaint
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Invoice Sent")}>
                Invoice Sent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Invoice Paid")}>
                Invoice Paid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Resolved")}>
                Resolved
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Cancelled")}>
                Cancelled
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Deleted")}>
                Deleted
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>New Order</Button>
        </div>
      </div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Company</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <TableRow 
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onOrderClick(order)}
                >
                  <TableCell className="font-medium">{order.company_name}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{order.description}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(order.price)}</TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrdersTable;

import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Order, OrderStatus } from "@/types";
import { Search, Filter } from "lucide-react";
import OrderRow from "./OrderRow";

// Mock data for demonstration purposes
const mockOrders: Order[] = [
  {
    id: "1",
    company_name: "sdd",
    contact_name: "John Smith",
    contact_email: "john@acme.com",
    contact_phone: "555-1234",
    description: "Googlejyjdjsgfdsg",
    price: 5000,
    status: "In Progress",
    priority: "Low",
    created_at: "2025-04-18T10:30:00Z",
    updated_at: "2025-04-18T10:30:00Z",
    created_by: "joka4927",
    assigned_to: "joka4927",
  },
  {
    id: "2",
    company_name: "Sasa GMBH",
    contact_name: "Jane Doe",
    contact_email: "jane@beta.com",
    contact_phone: "555-5678",
    description: "Optimizujte mu google s",
    price: 199,
    status: "In Progress",
    priority: "Medium",
    created_at: "2025-04-17T09:15:00Z",
    updated_at: "2025-04-17T14:30:00Z",
    created_by: "joka4927",
    assigned_to: "joka4927",
  },
  {
    id: "3",
    company_name: "Juwelier Roneli Gmbh",
    contact_name: "Bob Johnson",
    contact_email: "bob@gamma.com",
    description: "brisanje sa 5",
    price: 199,
    status: "Invoice Sent",
    priority: "Medium",
    created_at: "2025-04-10T16:45:00Z",
    updated_at: "2025-04-10T11:20:00Z",
    created_by: "joka4927",
  },
  {
    id: "4",
    company_name: "Smart Concepts AG",
    contact_name: "Sarah Williams",
    contact_email: "sarah@delta.com",
    contact_phone: "555-9012",
    description: "Brisanje postova",
    price: 800,
    status: "Invoice Sent",
    priority: "Medium",
    created_at: "2025-04-08T13:10:00Z",
    updated_at: "2025-04-08T09:45:00Z",
    created_by: "joka4927",
    assigned_to: "joka4927",
  },
  {
    id: "5",
    company_name: "Aios UG",
    contact_name: "Mike Brown",
    contact_email: "mike@epsilon.com",
    description: "Napraviti Novi CMB Profil",
    price: 199,
    status: "In Progress",
    priority: "Medium",
    created_at: "2025-04-08T11:30:00Z",
    updated_at: "2025-04-08T16:20:00Z",
    created_by: "joka4927",
    assigned_to: "joka4927",
  },
  {
    id: "6",
    company_name: "Porsche Sarajevo",
    contact_name: "Alex Johnson",
    contact_email: "alex@porsche.com",
    description: "Optimizacija Google Stra",
    price: 100,
    status: "Invoice Sent",
    priority: "Medium",
    created_at: "2025-04-05T09:30:00Z",
    updated_at: "2025-04-05T14:20:00Z",
    created_by: "joka4927",
  },
  {
    id: "7",
    company_name: "Autohaus B E R I",
    contact_name: "Lisa Meyer",
    contact_email: "lisa@autohaus.com",
    description: "adfsdfsfdsgdsf",
    price: 349,
    status: "In Progress",
    priority: "Medium",
    created_at: "2025-04-05T11:30:00Z",
    updated_at: "2025-04-05T16:20:00Z",
    created_by: "joka4927",
    assigned_to: "joka4927",
  },
  {
    id: "8",
    company_name: "Autohalle Buchholz i.d.N",
    contact_name: "Thomas Muller",
    contact_email: "thomas@autohalle.com",
    description: "sa",
    price: 25,
    status: "In Progress",
    priority: "Medium",
    created_at: "2025-03-28T11:30:00Z",
    updated_at: "2025-03-28T16:20:00Z",
    created_by: "Unknown Agent",
    assigned_to: "joka4927",
  },
];

interface OrdersTableProps {
  onOrderClick: (order: Order) => void;
  statusFilter?: string | OrderStatus | null;
  refreshTrigger?: number; // Added prop to trigger refresh
}

const OrdersTable = ({ onOrderClick, statusFilter = "All", refreshTrigger = 0 }: OrdersTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

  // Combine external and internal refresh triggers
  const combinedRefreshTrigger = refreshTrigger + localRefreshTrigger;
  
  // Force refresh from within the component
  const handleRefresh = () => {
    setLocalRefreshTrigger(prev => prev + 1);
  };

  // Load orders from localStorage or use mock data
  useEffect(() => {
    const storedOrders = localStorage.getItem("orders");
    if (storedOrders) {
      setOrders(JSON.parse(storedOrders));
    } else {
      // Initialize with mock data if nothing in localStorage
      setOrders(mockOrders);
      localStorage.setItem("orders", JSON.stringify(mockOrders));
    }
    
    // Make mockOrders globally accessible for demonstration purposes
    if (typeof window !== "undefined") {
      (window as any).mockOrders = mockOrders;
    }
  }, [combinedRefreshTrigger]); // Re-fetch when triggers change

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Special case for "In Progress" tab in Active Orders
    if (statusFilter === "In Progress") {
      return matchesSearch && order.status === "In Progress";
    }
    // For other status tabs in Active Orders page
    else if (statusFilter === "Complaint") {
      return matchesSearch && order.status === "Complaint";
    }
    else if (statusFilter === "Invoice Sent") {
      return matchesSearch && order.status === "Invoice Sent";
    }
    // For specific status pages (Completed, Cancelled, etc.)
    else if (statusFilter && statusFilter !== "All") {
      return matchesSearch && order.status === statusFilter;
    }
    // For "All" tab in Active Orders - show orders that are active
    else if (statusFilter === "All") {
      const activeStatuses = ["In Progress", "Complaint", "Invoice Sent"];
      return matchesSearch && activeStatuses.includes(order.status);
    }
    
    // Default: show all orders
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-sm relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search by company, description or agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            Export CSV
          </Button>
        </div>
      </div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Status Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <OrderRow 
                  key={order.id} 
                  order={order} 
                  onOrderClick={onOrderClick}
                  onRefresh={handleRefresh}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
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

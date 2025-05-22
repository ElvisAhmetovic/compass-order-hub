
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";

// Example inventory data structure
interface InventoryItem {
  id: string;
  name: string;
  category: "Article" | "Service";
  lastBooking: string | null;
  stock: string;
  price: string;
}

// Mock inventory data
const mockInventoryData: InventoryItem[] = [
  {
    id: "10354",
    name: "Google Maps Seite Erstellen - GOLD PAKET",
    category: "Article",
    lastBooking: null,
    stock: "0.00 unit",
    price: "EUR0.00",
  },
  {
    id: "2000",
    name: "Entfernung negativer Online-Inhalte",
    category: "Article",
    lastBooking: null,
    stock: "0.00 unit",
    price: "EUR200.00",
  },
  {
    id: "9999",
    name: "Professionelle SEO-Optimierung zur Verdrängung negativer Inhalte",
    category: "Article",
    lastBooking: null,
    stock: "0.00 unit",
    price: "EUR399.00",
  },
  {
    id: "9730",
    name: "Neue Google Maps Profil-Erstellung für Ihr Unternehmen",
    category: "Service",
    lastBooking: null,
    stock: "0.00 unit",
    price: "EUR199.00",
  },
  {
    id: "9720",
    name: "Neue Google Maps Profil-Erstellung für Ihr Unternehmen",
    category: "Service",
    lastBooking: null,
    stock: "0.00 unit",
    price: "EUR0.00",
  },
  {
    id: "10351",
    name: "Deletion Trustpilot Negative Reviews",
    category: "Article",
    lastBooking: null,
    stock: "0.00 unit",
    price: "EUR0.00",
  },
  {
    id: "103526",
    name: "TRIPADVISOR",
    category: "Article",
    lastBooking: null,
    stock: "0.00 unit",
    price: "EUR0.00",
  },
  {
    id: "1040",
    name: "SEO OPTIMISATION",
    category: "Service",
    lastBooking: null,
    stock: "0.00 unit",
    price: "EUR349.00",
  },
  {
    id: "103575",
    name: "GOOGLE NORVESKI",
    category: "Service",
    lastBooking: null,
    stock: "0.00 unit",
    price: "EUR0.00",
  },
  {
    id: "2587",
    name: "SUPPRIMER L'AVIS NÉGATIF - PAQUET GOOGLE ARGENT",
    category: "Article",
    lastBooking: null,
    stock: "0.00 unit",
    price: "EUR0.00",
  },
];

const Inventory = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // State for filters
  const [category, setCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("All");
  
  // Filter data based on search query and selected category/tab
  const filteredData = mockInventoryData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = category === "All" || item.category === category;
    const matchesTab = currentTab === "All" || item.category === currentTab;
    
    return matchesSearch && matchesCategory && matchesTab;
  });

  // If not admin, redirect or show access denied
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Layout userRole={"user"}>
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="mt-2">You don't have permission to access this page.</p>
              </div>
            </div>
          </Layout>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={"admin"}>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Inventory</h1>
              <div className="flex gap-2">
                <Button variant="outline">Import products</Button>
                <Button>Add product</Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                  <TabsList className="grid w-[300px] grid-cols-3">
                    <TabsTrigger value="All">All</TabsTrigger>
                    <TabsTrigger value="Article">Article</TabsTrigger>
                    <TabsTrigger value="Service">Service</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="p-4 border-b grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Search</p>
                  <div className="relative">
                    <Input
                      placeholder="Search by name or ID"
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="absolute left-2 top-2 text-gray-400">
                      🔍
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Date</p>
                  <div className="relative">
                    <Input placeholder="mm/dd/yyyy" />
                    <span className="absolute right-2 top-2 text-gray-400">
                      <Calendar className="h-4 w-4" />
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Category</p>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Article">Article</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3 flex justify-end">
                  <Button 
                    variant="link" 
                    className="text-blue-600"
                    onClick={() => {
                      setSearchQuery("");
                      setCategory("All");
                      setCurrentTab("All");
                    }}
                  >
                    Reset filters
                  </Button>
                </div>
              </div>

              <div className="p-4">
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-[80px]">No.</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Last booking</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Price (Gross)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell>{item.id}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.lastBooking || "-"}</TableCell>
                          <TableCell>{item.stock}</TableCell>
                          <TableCell className="text-right">{item.price}</TableCell>
                        </TableRow>
                      ))}
                      {filteredData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No items found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-between items-center mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Select defaultValue="50">
                      <SelectTrigger className="h-8 w-16">
                        <SelectValue placeholder="50" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="h-8">First</Button>
                    <Button variant="outline" size="sm" className="h-8">Previous</Button>
                    <Button variant="default" size="sm" className="h-8">1</Button>
                    <Button variant="outline" size="sm" className="h-8">Next</Button>
                    <Button variant="outline" size="sm" className="h-8">Last</Button>
                  </div>
                  <div className="text-gray-600">
                    Shows 1 - 10 of 57 entries
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default Inventory;

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
import { Calendar, Edit, PlusCircle, Import } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose,
  DialogDescription 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";

// Example inventory data structure
interface InventoryItem {
  id: string;
  name: string;
  category: "Article" | "Service";
  lastBooking: string | null;
  stock: string;
  price: string;
  buyingPrice?: string;
}

// Updated inventory data
const mockInventoryData: InventoryItem[] = [
  {
    id: "10354",
    name: "Google Maps Seite Erstellen - GOLD PAKET",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR0.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "2000",
    name: "Entfernung negativer Online-Inhalte",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR168.07",
    buyingPrice: "EUR0.00"
  },
  {
    id: "9999",
    name: "Professionelle SEO-Optimierung zur Verdrängung negativer Inhalte",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR335.29",
    buyingPrice: "EUR0.00"
  },
  {
    id: "10351",
    name: "Deletion Trustpilot Negative Reviews",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR0.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "103526",
    name: "TRIPADVISOR",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR0.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "2587",
    name: "SUPPRIMER L'AVIS NÉGATIF - PAQUET GOOGLE ARGENT",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR0.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "10254",
    name: "REMOVE NEGATIVE RATING - GOOGLE SILVER PACKAGE",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR0.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "10987",
    name: "NEGATIVE BEWERTUNG ENTFERNEN - GOOGLE SILBER PAKET",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR0.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "2058",
    name: "SILVER PACKAGE",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR300.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1966",
    name: "Google Maps-Element Erstellen",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR126.05",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1084",
    name: "Einzelne negative Google-Bewertungen löschen",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR100.84",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1041",
    name: "NEUE OPTIMIERTE GOOGLE-SEITE ERSTELLEN",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR209.24",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1089",
    name: "TRUSTPILOT OPTIMISATION",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR300.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1034",
    name: "Google Maps Seite Erstellen",
    category: "Article",
    lastBooking: null,
    stock: "1.00 Stk",
    price: "EUR83.19",
    buyingPrice: "EUR84.00"
  },
  {
    id: "1035",
    name: "SEO OPTIMIERUNG",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR251.26",
    buyingPrice: "EUR0.00"
  },
  {
    id: "2323",
    name: "CANCELLAZIONE DELLA RECENSIONE DI GOOGLE MY BUSINESS",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR299.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "103345",
    name: "Website Erstellung",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR420.17",
    buyingPrice: "EUR0.00"
  },
  {
    id: "11111",
    name: "FORFAIT D'OPTIMISATION ARGENT?????",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR209.24",
    buyingPrice: "EUR0.00"
  },
  {
    id: "10331",
    name: "Produkt Verlinkung",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR8.40",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1039",
    name: "Google My Business Eintrag Erstellen",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR167.23",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1038",
    name: "Google My Business Eintrag Erstellen",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR84.03",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1032",
    name: "Yearly Protection Package",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR1799.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1031",
    name: "FACEBOOK VERWALTUNG",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR100.84",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1030",
    name: "Webdesing Gold Paket",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR335.29",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1029",
    name: "FACEBOOK BEWERTUNGEN",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR8.40",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1028",
    name: "DREI MONATE VERWALTUNG",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR293.28",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1027",
    name: "FACEBOOK DELETION PACKAGE???",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR83.19",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1026",
    name: "GOOGLE MY BUSINESS ANNUAL PROTECTION PACKAGE",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR1008.40",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1025",
    name: "POSITIVE GOOGLE RATINGS?????",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR0.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1021",
    name: "Google AdWords (60 - 150 km)",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR249.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1020",
    name: "Google AdWords (10 - 60 km)",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR199.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1019",
    name: "3 MONATE PAKET-BEWERTUNGEN MOBILE UND AUTOSCOUT",
    category: "Article",
    lastBooking: null,
    stock: "90.00 Stk",
    price: "EUR378.15",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1018",
    name: "POSITIVE GOOGLE BEWERTUNGEN?????",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR12.61",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1017",
    name: "EINZELNE AUTOSCOUT UND MOBILE BEWERTUNGEN",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR12.61",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1016",
    name: "BRANCHENPAKET MIT BACKLINKS LOCALES SEO",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR167.23",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1015",
    name: "GOOGLE MY BUSINESS JAHRESSCHUTZ",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR1008.40",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1014",
    name: "GOOGLE MAPS EINTRAG ERSTELLEN",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR83.19",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1013",
    name: "GOOGLE MY BUSINESS WEBSITE",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR84.03",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1012",
    name: "6 MONATE BLOKADE DES GOOGLE MY BUSINESS EINTRAGS",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR209.24",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1011",
    name: "POSITIVE GOOGLE BEWERTUNGEN MIT KOMMENTAR?????",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR16.81",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1010",
    name: "PLATIN-OPTIMIERUNGSPAKET?????",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR419.33",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1009",
    name: "GOLD-OPTIMIERUNGSPAKET?????",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR293.28",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1008",
    name: "SILBER-OPTIMIERUNGSPAKET?????",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR251.26",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1033",
    name: "12 MONATE BLOKADE DES GOOGLE MY BUSINESS EINTRAGS",
    category: "Article",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR251.26",
    buyingPrice: "EUR0.00"
  },
  // Service items
  {
    id: "9730",
    name: "Neue Google Maps Profil-Erstellung für Ihr Unternehmen",
    category: "Service",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR167.23",
    buyingPrice: "EUR0.00"
  },
  {
    id: "9720",
    name: "Neue Google Maps Profil-Erstellung für Ihr Unternehmen",
    category: "Service",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR0.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1040",
    name: "SEO OPTIMISATION",
    category: "Service",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR293.28",
    buyingPrice: "EUR0.00"
  },
  {
    id: "103575",
    name: "GOOGLE NORVESKI",
    category: "Service",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR0.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1037",
    name: "WEBSITE-ERSTELLUNG GOLD PAKET",
    category: "Service",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR798.32",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1587",
    name: "Google Local Service Ads",
    category: "Service",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR167.23",
    buyingPrice: "EUR0.00"
  },
  {
    id: "11487",
    name: "GOOGLE SEO - GOLD PACKAGE",
    category: "Service",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR299.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "10024",
    name: "SILBER PAKET",
    category: "Service",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR0.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1036",
    name: "GoodFirm Reviews?????",
    category: "Service",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR0.00",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1024",
    name: "BLOCK THE GOOGLE MY BUSINESS ENTRY",
    category: "Service",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR293.28",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1023",
    name: "GOOGLE DELETION PACKAGE???",
    category: "Service",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR335.29",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1007",
    name: "BLOKADE DES GOOGLE MY BUSINESS EINTRAGS",
    category: "Service",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR293.28",
    buyingPrice: "EUR0.00"
  },
  {
    id: "1006",
    name: "1880 GOLOCAL AUTOPLENUM CYLEX FIRMEN EINTRAG",
    category: "Service",
    lastBooking: null,
    stock: "0.00 Stk",
    price: "EUR167.23",
    buyingPrice: "EUR0.00"
  }
];

// Now I'll modify the Inventory component to use this updated data
const Inventory = () => {
  // State for filters
  const [category, setCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("All");
  
  // State for editing
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<InventoryItem | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<InventoryItem>>({});
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>(mockInventoryData);

  // State for new dialogs
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Filter data based on search query and selected category/tab
  const filteredData = inventoryData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = category === "All" || item.category === category;
    const matchesTab = currentTab === "All" || item.category === currentTab;
    
    return matchesSearch && matchesCategory && matchesTab;
  });

  // Handle opening the edit dialog
  const handleEditClick = (item: InventoryItem) => {
    setCurrentEditItem(item);
    setEditFormData({ ...item });
    setIsEditDialogOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (field: keyof InventoryItem, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle save changes
  const handleSaveChanges = () => {
    if (!currentEditItem || !editFormData) return;
    
    // Update the inventory item
    const updatedInventory = inventoryData.map(item => 
      item.id === currentEditItem.id ? { ...item, ...editFormData } : item
    );
    
    setInventoryData(updatedInventory);
    setIsEditDialogOpen(false);
    
    // Show success toast
    toast({
      title: "Item Updated",
      description: `${editFormData.name} has been successfully updated.`,
      variant: "default",
    });

    // Save inventory data to localStorage for use in proposals
    localStorage.setItem("inventoryItems", JSON.stringify(updatedInventory));
  };

  // Handle add product form
  const addProductForm = useForm({
    defaultValues: {
      name: '',
      category: 'Article' as "Article" | "Service",
      stock: '0.00 Stk',
      price: 'EUR0.00',
      buyingPrice: 'EUR0.00'
    }
  });

  // Handle add product submission
  const handleAddProduct = (data: any) => {
    const newProduct: InventoryItem = {
      id: uuidv4().substring(0, 5),
      name: data.name,
      category: data.category,
      lastBooking: null,
      stock: data.stock,
      price: data.price,
      buyingPrice: data.buyingPrice || 'EUR0.00'
    };

    const updatedInventory = [newProduct, ...inventoryData];
    setInventoryData(updatedInventory);
    setIsAddProductDialogOpen(false);
    addProductForm.reset();
    
    // Save inventory data to localStorage for use in proposals
    localStorage.setItem("inventoryItems", JSON.stringify(updatedInventory));
    
    toast({
      title: "Product Added",
      description: `${data.name} has been successfully added to inventory.`,
      variant: "default",
    });
  };

  // Save inventory data on component mount
  React.useEffect(() => {
    localStorage.setItem("inventoryItems", JSON.stringify(inventoryData));
  }, []);

  // Handle file import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  // Handle import products
  const handleImport = () => {
    if (!importFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import.",
        variant: "destructive",
      });
      return;
    }

    // Simulate file processing
    setTimeout(() => {
      // In a real application, you would parse the file and add the products
      
      // For demo purposes, we'll add a sample imported product
      const newProduct: InventoryItem = {
        id: `IMP${Math.floor(1000 + Math.random() * 9000)}`,
        name: `Imported Product - ${importFile.name.substring(0, 20)}`,
        category: Math.random() > 0.5 ? "Article" : "Service",
        lastBooking: null,
        stock: "1.00 Stk",
        price: `EUR${(Math.random() * 100).toFixed(2)}`,
        buyingPrice: `EUR${(Math.random() * 50).toFixed(2)}`
      };

      const updatedInventory = [newProduct, ...inventoryData];
      setInventoryData(updatedInventory);
      setIsImportDialogOpen(false);
      setImportFile(null);
      
      // Save inventory data to localStorage for use in proposals
      localStorage.setItem("inventoryItems", JSON.stringify(updatedInventory));
      
      toast({
        title: "Products Imported",
        description: `Successfully imported products from ${importFile.name}.`,
        variant: "default",
      });
    }, 1000);
  };

  // If not admin, redirect or show access denied
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

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
                <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                  <Import className="mr-2 h-4 w-4" />
                  Import products
                </Button>
                <Button onClick={() => setIsAddProductDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add product
                </Button>
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
                        <TableHead>Buying Price</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
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
                          <TableCell>{item.buyingPrice || "-"}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditClick(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
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
                    Shows 1 - {Math.min(filteredData.length, 10)} of {filteredData.length} entries
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Inventory Item</DialogTitle>
              </DialogHeader>
              {currentEditItem && (
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="item-name">Name</Label>
                    <Input 
                      id="item-name" 
                      value={editFormData.name || ''} 
                      onChange={(e) => handleInputChange('name', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-category">Category</Label>
                    <Select 
                      value={editFormData.category} 
                      onValueChange={(value) => handleInputChange('category', value as "Article" | "Service")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Article">Article</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-stock">Stock</Label>
                    <Input 
                      id="item-stock" 
                      value={editFormData.stock || ''} 
                      onChange={(e) => handleInputChange('stock', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-price">Price</Label>
                    <Input 
                      id="item-price" 
                      value={editFormData.price || ''} 
                      onChange={(e) => handleInputChange('price', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-buyingPrice">Buying Price</Label>
                    <Input 
                      id="item-buyingPrice" 
                      value={editFormData.buyingPrice || ''} 
                      onChange={(e) => handleInputChange('buyingPrice', e.target.value)} 
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSaveChanges}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Product Dialog */}
          <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Add a new product to your inventory.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={addProductForm.handleSubmit(handleAddProduct)}>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-product-name">Product Name</Label>
                    <Input 
                      id="new-product-name" 
                      {...addProductForm.register('name', { required: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-product-category">Category</Label>
                    <Select 
                      value={addProductForm.watch('category')}
                      onValueChange={(value) => addProductForm.setValue('category', value as "Article" | "Service")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Article">Article</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-product-stock">Stock</Label>
                    <Input 
                      id="new-product-stock" 
                      {...addProductForm.register('stock')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-product-price">Price</Label>
                    <Input 
                      id="new-product-price" 
                      {...addProductForm.register('price')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-product-buyingPrice">Buying Price</Label>
                    <Input 
                      id="new-product-buyingPrice" 
                      {...addProductForm.register('buyingPrice')}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Add Product</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Import Dialog */}
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Products</DialogTitle>
                <DialogDescription>
                  Upload a CSV or Excel file to import multiple products at once.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="import-file">Select File</Label>
                  <Input 
                    id="import-file" 
                    type="file" 
                    accept=".csv,.xlsx,.xls" 
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Accepted formats: CSV, Excel (.xlsx, .xls)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleImport} disabled={!importFile}>
                  Import
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Layout>
      </div>
    </div>
  );
};

export default Inventory;

import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { InventoryItem } from "@/types";

// Import refactored components
import InventoryHeader from "@/components/inventory/InventoryHeader";
import InventoryFilters from "@/components/inventory/InventoryFilters";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryPagination from "@/components/inventory/InventoryPagination";
import EditItemDialog from "@/components/inventory/EditItemDialog";
import AddProductDialog from "@/components/inventory/AddProductDialog";
import ImportDialog from "@/components/inventory/ImportDialog";
import { mockInventoryData } from "@/components/inventory/mockInventoryData";

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

  // Handle add product submission
  const handleAddProduct = (data: any) => {
    const newProduct: InventoryItem = {
      id: uuidv4().substring(0, 5),
      name: data.name,
      category: data.category,
      description: data.description || "",
      lastBooking: null,
      stock: parseInt(data.stock) || 0,
      unit: data.unit || "Stk",
      price: data.price,
      buyingPrice: data.buyingPrice || 'EUR0.00',
      internalNote: data.internalNote || "",
    };

    const updatedInventory = [newProduct, ...inventoryData];
    setInventoryData(updatedInventory);
    setIsAddProductDialogOpen(false);
    
    // Save inventory data to localStorage for use in proposals
    localStorage.setItem("inventoryItems", JSON.stringify(updatedInventory));
    
    toast({
      title: "Product Added",
      description: `${data.name} has been successfully added to inventory.`,
      variant: "default",
    });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setCategory("All");
    setCurrentTab("All");
  };

  // Load inventory data on component mount
  useEffect(() => {
    const savedInventory = localStorage.getItem("inventoryItems");
    if (savedInventory) {
      try {
        const parsedInventory = JSON.parse(savedInventory);
        setInventoryData(parsedInventory);
      } catch (error) {
        console.error("Error loading inventory:", error);
        localStorage.setItem("inventoryItems", JSON.stringify(mockInventoryData));
      }
    } else {
      localStorage.setItem("inventoryItems", JSON.stringify(mockInventoryData));
    }
  }, []);

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
        description: "",
        lastBooking: null,
        stock: 1,
        unit: "Stk",
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
            {/* Header */}
            <InventoryHeader 
              onAddProduct={() => setIsAddProductDialogOpen(true)} 
              onImport={() => setIsImportDialogOpen(true)} 
            />

            <div className="bg-white rounded-lg shadow">
              {/* Filters */}
              <InventoryFilters
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                category={category}
                setCategory={setCategory}
                resetFilters={resetFilters}
              />

              {/* Table */}
              <InventoryTable
                filteredData={filteredData}
                handleEditClick={handleEditClick}
              />

              {/* Pagination */}
              <div className="px-4 pb-4">
                <InventoryPagination filteredDataLength={filteredData.length} />
              </div>
            </div>
          </div>

          {/* Dialogs */}
          <EditItemDialog 
            isOpen={isEditDialogOpen}
            setIsOpen={setIsEditDialogOpen}
            currentItem={currentEditItem}
            formData={editFormData}
            handleInputChange={handleInputChange}
            handleSaveChanges={handleSaveChanges}
          />

          <AddProductDialog 
            isOpen={isAddProductDialogOpen}
            setIsOpen={setIsAddProductDialogOpen}
            onSubmit={handleAddProduct}
          />

          <ImportDialog 
            isOpen={isImportDialogOpen}
            setIsOpen={setIsImportDialogOpen}
            handleImport={handleImport}
            setImportFile={setImportFile}
            importFile={importFile}
          />
        </Layout>
      </div>
    </div>
  );
};

export default Inventory;

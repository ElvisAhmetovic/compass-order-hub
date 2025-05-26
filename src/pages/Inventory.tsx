import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { InventoryItem } from "@/types";
import { useInventory } from "@/hooks/useInventory";
import { toast } from "@/hooks/use-toast";

// Import refactored components
import InventoryHeader from "@/components/inventory/InventoryHeader";
import InventoryFilters from "@/components/inventory/InventoryFilters";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryPagination from "@/components/inventory/InventoryPagination";
import EditItemDialog from "@/components/inventory/EditItemDialog";
import AddProductDialog from "@/components/inventory/AddProductDialog";
import ImportDialog from "@/components/inventory/ImportDialog";

const Inventory = () => {
  // Use the custom hook for inventory management
  const { inventoryData, loading, updateInventoryItem, addInventoryItem, deleteInventoryItem, deleteAllInventoryItems } = useInventory();
  
  // State for filters
  const [category, setCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("All");
  
  // State for editing
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<InventoryItem | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<InventoryItem>>({});

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
  const handleSaveChanges = async () => {
    if (!currentEditItem || !editFormData) return;
    
    const updatedItem: InventoryItem = {
      ...currentEditItem,
      ...editFormData
    };
    
    const success = await updateInventoryItem(updatedItem);
    if (success) {
      setIsEditDialogOpen(false);
    }
  };

  // Handle add product submission
  const handleAddProduct = async (data: any) => {
    const newProduct: Omit<InventoryItem, 'id'> = {
      name: data.name,
      category: data.category,
      description: data.description || "",
      lastBooking: null,
      stock: parseInt(data.stock) || 0,
      unit: data.unit || "Stk",
      price: data.price,
      buyingPrice: data.buyingPrice || 'EUR0.00',
      buyingPriceGross: data.buyingPriceGross,
      priceGross: data.priceGross,
      internalNote: data.internalNote || "",
    };

    const success = await addInventoryItem(newProduct);
    if (success) {
      setIsAddProductDialogOpen(false);
    }
  };

  // Handle delete item
  const handleDeleteClick = async (itemId: string) => {
    await deleteInventoryItem(itemId);
  };

  // Handle delete all items
  const handleDeleteAll = async () => {
    await deleteAllInventoryItems();
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setCategory("All");
    setCurrentTab("All");
  };

  // Handle import products with proper CSV parsing
  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import.",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row if it exists
      const dataLines = lines.slice(1);
      
      let successCount = 0;
      let errorCount = 0;

      for (const line of dataLines) {
        if (!line.trim()) continue;
        
        const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
        
        // Assuming CSV format: name, category, description, stock, unit, price, buyingPrice
        if (columns.length >= 3) {
          const newProduct: Omit<InventoryItem, 'id'> = {
            name: columns[0] || 'Unnamed Product',
            category: columns[1] || 'Article',
            description: columns[2] || '',
            lastBooking: null,
            stock: parseInt(columns[3]) || 0,
            unit: columns[4] || 'Stk',
            price: columns[5] || 'EUR0.00',
            buyingPrice: columns[6] || 'EUR0.00',
            buyingPriceGross: undefined,
            priceGross: undefined,
            internalNote: ''
          };

          const success = await addInventoryItem(newProduct);
          if (success) {
            successCount++;
          } else {
            errorCount++;
          }
        }
      }

      setIsImportDialogOpen(false);
      setImportFile(null);
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} products. ${errorCount > 0 ? `${errorCount} errors occurred.` : ''}`,
        variant: successCount > 0 ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error parsing CSV file:', error);
      toast({
        title: "Import Error",
        description: "Failed to parse the CSV file. Please check the format.",
        variant: "destructive",
      });
    }
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

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Layout userRole={"admin"}>
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="text-center">
                <h1 className="text-xl">Loading inventory...</h1>
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
              onDeleteAll={handleDeleteAll}
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
                handleDeleteClick={handleDeleteClick}
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

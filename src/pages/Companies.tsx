
import React, { useState, useEffect } from 'react';
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { Company } from "@/types";
import CompanyCard from "@/components/companies/CompanyCard";
import CompanySearch from "@/components/companies/CompanySearch";
import EditCompanyDialog from "@/components/companies/EditCompanyDialog";
import CreateCompanyDialog from "@/components/companies/CreateCompanyDialog";
import { getGoogleMapsLink, groupOrdersByCompany } from "@/utils/companyUtils";
import { CompanySyncService } from "@/services/companySyncService";
import { InvoiceService } from "@/services/invoiceService";

const Companies = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<{[key: string]: Company}>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [currentCompanyKey, setCurrentCompanyKey] = useState<string>("");
  const [newCompany, setNewCompany] = useState<Omit<Company, 'orders'>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    mapLink: ''
  });
  
  const isAdmin = user?.role === 'admin';
  
  // Load companies from orders and sync with clients
  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      // First sync companies and clients
      await CompanySyncService.performFullSync();
      
      // Then load companies from orders
      const storedOrders = localStorage.getItem("orders");
      if (!storedOrders) {
        setCompanies({});
        setIsLoading(false);
        return;
      }
      
      const orders = JSON.parse(storedOrders);
      const companyMap = groupOrdersByCompany(orders);
      
      setCompanies(companyMap);
      console.log("Companies loaded/refreshed:", companyMap);
    } catch (error) {
      console.error("Error loading companies:", error);
      setCompanies({});
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadCompanies();
    
    // Add event listener for storage changes to refresh data when orders are updated elsewhere
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'orders') {
        console.log("Storage change detected, reloading companies");
        loadCompanies();
      }
    };
    
    const handleOrdersUpdate = () => {
      console.log("Orders updated event received, reloading companies");
      loadCompanies();
    };
    
    const handleCompanyDataUpdate = (event: any) => {
      console.log("Company data update event received:", event.detail);
      loadCompanies();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ordersUpdated', handleOrdersUpdate);
    window.addEventListener('companyDataUpdated', handleCompanyDataUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ordersUpdated', handleOrdersUpdate);
      window.removeEventListener('companyDataUpdated', handleCompanyDataUpdate);
    };
  }, []);
  
  // Filter companies based on search term
  const filteredCompanies = Object.entries(companies).filter(([key, company]) => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (companyKey: string, company: Company) => {
    setCurrentCompanyKey(companyKey);
    setCurrentCompany({...company});
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!currentCompany || !currentCompanyKey) return;

    try {
      // Update related orders with new company information
      const storedOrders = localStorage.getItem("orders");
      if (storedOrders) {
        const orders = JSON.parse(storedOrders);
        const updatedOrders = orders.map(order => {
          if (order.company_name.trim().toLowerCase() === currentCompanyKey) {
            return {
              ...order,
              company_name: currentCompany.name,
              contact_email: currentCompany.email,
              contact_phone: currentCompany.phone,
              company_address: currentCompany.address,
              company_link: currentCompany.mapLink
            };
          }
          return order;
        });
        localStorage.setItem("orders", JSON.stringify(updatedOrders));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('ordersUpdated'));
      }

      // Also update the corresponding client in Supabase
      try {
        const clients = await InvoiceService.getClients();
        const existingClient = clients.find(c => 
          c.email.toLowerCase() === currentCompany.email.toLowerCase() ||
          c.name.toLowerCase() === currentCompanyKey
        );
        
        if (existingClient) {
          await InvoiceService.updateClient(existingClient.id, {
            name: currentCompany.name,
            email: currentCompany.email,
            phone: currentCompany.phone,
            address: currentCompany.address
          });
        }
      } catch (error) {
        console.error("Error updating client:", error);
      }

      // Reload companies immediately to reflect changes
      loadCompanies();

      toast({
        title: "Company updated",
        description: `${currentCompany.name} has been updated successfully.`
      });
      
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating company:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was an error updating the company."
      });
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompany.name || !newCompany.email) {
      toast({
        variant: "destructive",
        title: "Required fields missing",
        description: "Company name and email are required."
      });
      return;
    }

    try {
      const companyKey = newCompany.name.trim().toLowerCase();
      
      // Check if company already exists
      if (companies[companyKey]) {
        toast({
          variant: "destructive",
          title: "Company already exists",
          description: "A company with this name already exists."
        });
        return;
      }

      // Create client in Supabase first
      try {
        await InvoiceService.createClient({
          name: newCompany.name,
          email: newCompany.email,
          phone: newCompany.phone || "",
          address: newCompany.address || "",
          contact_person: "",
          city: "",
          zip_code: "",
          country: "",
          vat_id: "",
          tax_id: ""
        });
      } catch (error) {
        console.error("Error creating client:", error);
        // Continue with order creation even if client creation fails
      }

      // Create a placeholder order for this company to maintain data structure
      const storedOrders = localStorage.getItem("orders") || "[]";
      const orders = JSON.parse(storedOrders);
      
      const newOrder = {
        id: uuidv4(),
        company_name: newCompany.name,
        contact_name: "Added manually",
        contact_email: newCompany.email,
        contact_phone: newCompany.phone || "Not provided",
        company_address: newCompany.address || "Not provided",
        company_link: newCompany.mapLink || "",
        description: "Company added manually",
        price: 0,
        status: "Created",
        priority: "Low",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user?.id || "system"
      };
      
      orders.push(newOrder);
      localStorage.setItem("orders", JSON.stringify(orders));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('ordersUpdated'));

      toast({
        title: "Company created",
        description: `${newCompany.name} has been added successfully.`
      });
      
      // Reset form and close dialog
      setNewCompany({
        name: '',
        email: '',
        phone: '',
        address: '',
        mapLink: ''
      });
      setCreateDialogOpen(false);
      
      // Reload companies to show the new one
      loadCompanies();
    } catch (error) {
      console.error("Error creating company:", error);
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: "There was an error creating the company."
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
              
              {isAdmin && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => CompanySyncService.performFullSync()} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    🔄 Sync with Clients
                  </Button>
                  <Button 
                    onClick={() => setCreateDialogOpen(true)} 
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Company
                  </Button>
                </div>
              )}
            </div>
            
            <CompanySearch 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
            
            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredCompanies.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCompanies.map(([key, company], index) => (
                  <CompanyCard 
                    key={`${key}-${company.name}-${index}`}
                    company={company}
                    companyKey={key}
                    isAdmin={isAdmin}
                    onEditClick={handleEditClick}
                    getGoogleMapsLink={getGoogleMapsLink}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground">No companies found.</p>
                {searchTerm && (
                  <p className="text-sm mt-2">Try a different search term.</p>
                )}
              </div>
            )}
          </div>
        </Layout>
      </div>

      <EditCompanyDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currentCompany={currentCompany}
        setCurrentCompany={setCurrentCompany}
        onSaveEdit={handleSaveEdit}
      />

      <CreateCompanyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        newCompany={newCompany}
        setNewCompany={setNewCompany}
        onCreateCompany={handleCreateCompany}
      />
    </div>
  );
};

export default Companies;

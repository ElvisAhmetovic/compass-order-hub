
import React, { useState, useEffect } from 'react';
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Company } from "@/types";
import CompanyCard from "@/components/companies/CompanyCard";
import CompanySearch from "@/components/companies/CompanySearch";
import CompanyOrderStats from "@/components/companies/CompanyOrderStats";
import EditCompanyDialog from "@/components/companies/EditCompanyDialog";
import CreateCompanyDialog from "@/components/companies/CreateCompanyDialog";
import { getGoogleMapsLink } from "@/utils/companyUtils";
import { CompanyService } from "@/services/companyService";
import { SupabaseCompanySyncService } from "@/services/supabaseCompanySyncService";
import { MigrationService } from "@/services/migrationService";
import { OrderService } from "@/services/orderService";

const Companies = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [recentSyncs, setRecentSyncs] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRemovingDuplicates, setIsRemovingDuplicates] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [newCompany, setNewCompany] = useState<Omit<Company, 'orders'>>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    contact_person: '',
    map_link: '',
    created_at: '',
    updated_at: '',
    user_id: ''
  });
  
  const isAdmin = user?.role === 'admin';
  
  // Load companies and stats from Supabase
  const loadCompaniesAndStats = async () => {
    setIsLoading(true);
    try {
      // Load companies and orders in parallel
      const [companiesData, ordersData] = await Promise.all([
        CompanyService.getCompanies(),
        OrderService.getOrders()
      ]);
      
      setCompanies(companiesData);
      setTotalOrders(ordersData.length);
      
      // Calculate recent syncs (companies created in last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const recentCompanies = companiesData.filter(company => 
        new Date(company.created_at || '') > oneDayAgo
      );
      setRecentSyncs(recentCompanies.length);
      
      console.log("Companies and stats loaded:", {
        companies: companiesData.length,
        orders: ordersData.length,
        recentSyncs: recentCompanies.length
      });
    } catch (error) {
      console.error("Error loading companies and stats:", error);
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: "Failed to load companies and statistics."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced sync with orders, clients, and companies
  const handleEnhancedSync = async () => {
    setIsSyncing(true);
    try {
      console.log("Starting enhanced sync with orders and clients...");
      await SupabaseCompanySyncService.performFullSync();
      
      // Reload data after sync
      await loadCompaniesAndStats();
      
      toast({
        title: "Enhanced sync completed",
        description: "Successfully synced companies with orders and clients data."
      });
    } catch (error) {
      console.error("Enhanced sync failed:", error);
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "There was an error syncing companies with orders and clients."
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle migration from localStorage to Supabase
  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      console.log("Starting migration from localStorage to Supabase...");
      await MigrationService.performFullMigration();
      
      // Reload companies after migration
      await loadCompaniesAndStats();
      
      toast({
        title: "Migration completed",
        description: "Successfully migrated all data from localStorage to Supabase."
      });
    } catch (error) {
      console.error("Migration failed:", error);
      toast({
        variant: "destructive",
        title: "Migration failed",
        description: "There was an error migrating data to Supabase."
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Handle removing duplicate companies
  const handleRemoveDuplicates = async () => {
    setIsRemovingDuplicates(true);
    try {
      console.log("Starting duplicate removal...");
      await SupabaseCompanySyncService.removeDuplicateCompanies();
      
      // Reload companies after removal
      await loadCompaniesAndStats();
      
      toast({
        title: "Duplicates removed",
        description: "Successfully removed duplicate companies."
      });
    } catch (error) {
      console.error("Duplicate removal failed:", error);
      toast({
        variant: "destructive",
        title: "Removal failed",
        description: "There was an error removing duplicate companies."
      });
    } finally {
      setIsRemovingDuplicates(false);
    }
  };
  
  useEffect(() => {
    loadCompaniesAndStats();
  }, []);
  
  // Filter companies based on search term
  const filteredCompanies = companies.filter((company) => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (company: Company) => {
    setCurrentCompany({...company});
    setEditDialogOpen(true);
  };

  const handleDeleteClick = async (company: Company) => {
    if (!confirm(`Are you sure you want to delete ${company.name}?`)) {
      return;
    }

    try {
      await CompanyService.deleteCompany(company.id);
      
      toast({
        title: "Company deleted",
        description: `${company.name} has been deleted successfully.`
      });
      
      // Reload companies to reflect changes
      loadCompaniesAndStats();
    } catch (error) {
      console.error("Error deleting company:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "There was an error deleting the company."
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!currentCompany) return;

    try {
      await CompanyService.updateCompany(currentCompany.id, currentCompany);
      
      // Reload companies to reflect changes
      loadCompaniesAndStats();

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
      // Remove the fields that shouldn't be sent to the service
      const { id, created_at, updated_at, user_id, ...companyData } = newCompany;
      await CompanyService.createCompany(companyData);

      toast({
        title: "Company created",
        description: `${newCompany.name} has been added successfully.`
      });
      
      // Reset form and close dialog
      setNewCompany({
        id: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        contact_person: '',
        map_link: '',
        created_at: '',
        updated_at: '',
        user_id: ''
      });
      setCreateDialogOpen(false);
      
      // Reload companies to show the new one
      loadCompaniesAndStats();
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
                    onClick={handleMigration}
                    disabled={isMigrating}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isMigrating ? "🔄 Migrating..." : "📦 Migrate from localStorage"}
                  </Button>
                  <Button 
                    onClick={handleEnhancedSync}
                    disabled={isSyncing}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isSyncing ? "🔄 Syncing..." : "🔄 Enhanced Sync (Orders + Clients)"}
                  </Button>
                  <Button 
                    onClick={handleRemoveDuplicates}
                    disabled={isRemovingDuplicates}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isRemovingDuplicates ? "Removing..." : "Remove Duplicates"}
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

            <CompanyOrderStats 
              totalCompanies={companies.length}
              totalOrders={totalOrders}
              recentSyncs={recentSyncs}
            />
            
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
                {filteredCompanies.map((company) => (
                  <CompanyCard 
                    key={company.id}
                    company={company}
                    companyKey={company.id}
                    isAdmin={isAdmin}
                    onEditClick={() => handleEditClick(company)}
                    onDeleteClick={() => handleDeleteClick(company)}
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
                {isAdmin && !searchTerm && (
                  <p className="text-sm mt-2">Use the "Enhanced Sync" button to automatically create companies from your orders and clients.</p>
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

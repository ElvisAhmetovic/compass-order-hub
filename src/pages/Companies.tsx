import React, { useState, useEffect } from 'react';
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Company } from "@/types";
import CompanyCard from "@/components/companies/CompanyCard";
import CompanySearch from "@/components/companies/CompanySearch";
import EditCompanyDialog from "@/components/companies/EditCompanyDialog";
import CreateCompanyDialog from "@/components/companies/CreateCompanyDialog";
import { getGoogleMapsLink } from "@/utils/companyUtils";
import { CompanyService } from "@/services/companyService";
import { SupabaseCompanySyncService } from "@/services/supabaseCompanySyncService";

const Companies = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [newCompany, setNewCompany] = useState<Omit<Company, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'orders'>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    contact_person: '',
    map_link: ''
  });
  
  const isAdmin = user?.role === 'admin';
  
  // Load companies from Supabase
  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      // First sync companies and clients
      await SupabaseCompanySyncService.performFullSync();
      
      // Then load companies from Supabase
      const supabaseCompanies = await CompanyService.getCompanies();
      setCompanies(supabaseCompanies);
      console.log("Companies loaded from Supabase:", supabaseCompanies);
    } catch (error) {
      console.error("Error loading companies:", error);
      toast({
        variant: "destructive",
        title: "Error loading companies",
        description: "Failed to load companies from database."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadCompanies();
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

  const handleSaveEdit = async () => {
    if (!currentCompany) return;

    try {
      await CompanyService.updateCompany(currentCompany.id, currentCompany);
      
      // Reload companies to reflect changes
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
      await CompanyService.createCompany(newCompany);

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
        contact_person: '',
        map_link: ''
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
                    onClick={() => SupabaseCompanySyncService.performFullSync()} 
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
                {filteredCompanies.map((company) => (
                  <CompanyCard 
                    key={company.id}
                    company={company}
                    companyKey={company.id}
                    isAdmin={isAdmin}
                    onEditClick={() => handleEditClick(company)}
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

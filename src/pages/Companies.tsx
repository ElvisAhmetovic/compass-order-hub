
import React, { useState, useEffect } from 'react';
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import { Order } from "@/types";
import { Card } from "@/components/ui/card";
import { Building2, Mail, MapPin, Phone, Link, Edit2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Company {
  name: string;
  email: string;
  phone: string;
  address: string;
  orders: Order[];
}

const Companies = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<{[key: string]: Company}>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<string>("");
  const [editFormData, setEditFormData] = useState<Company | null>(null);
  
  // Check if user is admin
  const isAdmin = user?.role === "admin";
  
  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/dashboard");
      toast({
        title: "Access Denied",
        description: "You don't have permission to view this page.",
        variant: "destructive"
      });
    }
  }, [user, navigate, toast]);
  
  useEffect(() => {
    // Load companies from orders
    const loadCompanies = () => {
      setIsLoading(true);
      try {
        const storedOrders = localStorage.getItem("orders");
        if (!storedOrders) {
          setIsLoading(false);
          return;
        }
        
        const orders: Order[] = JSON.parse(storedOrders);
        const companyMap: {[key: string]: Company} = {};
        
        // Group orders by company
        orders.forEach(order => {
          // Use company_name as the unique identifier
          const companyKey = order.company_name.trim().toLowerCase();
          
          if (!companyMap[companyKey]) {
            companyMap[companyKey] = {
              name: order.company_name,
              email: order.contact_email,
              phone: order.contact_phone || "Not provided",
              address: order.contact_address || "Not provided",
              orders: []
            };
          }
          
          companyMap[companyKey].orders.push(order);
        });
        
        setCompanies(companyMap);
      } catch (error) {
        console.error("Error loading companies:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCompanies();
  }, []);
  
  // Filter companies based on search term
  const filteredCompanies = Object.entries(companies).filter(([key, company]) => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getGoogleMapsLink = (address: string) => {
    if (address === "Not provided") return "#";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const openEditDialog = (companyKey: string) => {
    setCurrentCompany(companyKey);
    setEditFormData({...companies[companyKey]});
    setEditDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [name]: value
      });
    }
  };

  const handleSaveCompany = () => {
    if (!editFormData || !currentCompany) return;
    
    try {
      // Update the company in our state
      const updatedCompanies = {...companies};
      updatedCompanies[currentCompany] = editFormData;
      setCompanies(updatedCompanies);
      
      // Update all orders associated with this company
      const storedOrders = localStorage.getItem("orders");
      if (storedOrders) {
        const orders: Order[] = JSON.parse(storedOrders);
        
        const updatedOrders = orders.map(order => {
          if (order.company_name.trim().toLowerCase() === currentCompany) {
            return {
              ...order,
              company_name: editFormData.name,
              contact_email: editFormData.email,
              contact_phone: editFormData.phone !== "Not provided" ? editFormData.phone : order.contact_phone,
              contact_address: editFormData.address !== "Not provided" ? editFormData.address : order.contact_address
            };
          }
          return order;
        });
        
        // Save updated orders back to localStorage
        localStorage.setItem("orders", JSON.stringify(updatedOrders));
      }
      
      toast({
        title: "Company updated",
        description: "Company information has been successfully updated."
      });
      
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating company:", error);
      toast({
        title: "Update failed",
        description: "There was a problem updating the company information.",
        variant: "destructive"
      });
    }
  };

  if (!isAdmin) {
    return null; // Return null while redirecting
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "admin"}>
          <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
            
            <div className="flex w-full max-w-sm items-center space-x-2 mb-6">
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button type="button" onClick={() => setSearchTerm("")}>
                Clear
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredCompanies.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCompanies.map(([key, company], index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-lg">{company.name}</h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(key)}
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit company</span>
                        </Button>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{company.email}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{company.phone}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{company.address}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Link className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={getGoogleMapsLink(company.address)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View on Google Maps
                          </a>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="text-sm text-muted-foreground">
                        Total orders: {company.orders.length}
                      </div>
                    </div>
                  </Card>
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
          
          {/* Edit Company Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Company</DialogTitle>
              </DialogHeader>
              
              {editFormData && (
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Company Name</label>
                    <Input
                      id="name"
                      name="name"
                      value={editFormData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={editFormData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">Phone</label>
                    <Input
                      id="phone"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="address" className="text-sm font-medium">Address</label>
                    <Input
                      id="address"
                      name="address"
                      value={editFormData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveCompany}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Layout>
      </div>
    </div>
  );
};

export default Companies;

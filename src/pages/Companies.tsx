
import React, { useState, useEffect } from 'react';
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import { Order } from "@/types";
import { Card } from "@/components/ui/card";
import { Building2, Mail, MapPin, Phone, Link, Pencil, Plus, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { Textarea } from "@/components/ui/textarea";

interface Company {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  mapsUrl?: string;
  orders: Order[];
}

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
    mapsUrl: ''
  });
  
  const isAdmin = user?.role === 'admin';
  
  useEffect(() => {
    // Load companies from orders
    const loadCompanies = () => {
      setIsLoading(true);
      try {
        const storedOrders = localStorage.getItem("orders");
        if (!storedOrders) {
          I'll add the ability to include a Google Maps link in the company information, which will be editable in the dialog forms. Let's make this change.

<lov-code>
Let's modify the Companies.tsx file to add Google Maps link functionality in the edit and create dialogs:

<lov-write file_path="src/pages/Companies.tsx">
import React, { useState, useEffect } from 'react';
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import { Order } from "@/types";
import { Card } from "@/components/ui/card";
import { Building2, Mail, MapPin, Phone, Link, Pencil, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { Textarea } from "@/components/ui/textarea";

interface Company {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  mapLink?: string;
  orders: Order[];
}

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
              mapLink: '',
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
  
  const getGoogleMapsLink = (address: string, customLink?: string) => {
    if (customLink && customLink.trim() !== '') return customLink;
    if (address === "Not provided") return "#";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const handleEditClick = (companyKey: string, company: Company) => {
    setCurrentCompanyKey(companyKey);
    setCurrentCompany({...company});
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!currentCompany || !currentCompanyKey) return;

    try {
      // Create a new companies object with the updated company
      const updatedCompanies = {
        ...companies,
        [currentCompanyKey]: { ...currentCompany }
      };

      setCompanies(updatedCompanies);
      
      // Also update related orders
      const storedOrders = localStorage.getItem("orders");
      if (storedOrders) {
        const orders: Order[] = JSON.parse(storedOrders);
        const updatedOrders = orders.map(order => {
          if (order.company_name.trim().toLowerCase() === currentCompanyKey) {
            return {
              ...order,
              company_name: currentCompany.name,
              contact_email: currentCompany.email,
              contact_phone: currentCompany.phone,
              contact_address: currentCompany.address
            };
          }
          return order;
        });
        localStorage.setItem("orders", JSON.stringify(updatedOrders));
      }

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

  const handleCreateCompany = () => {
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

      // Add new company to state
      const updatedCompanies = {
        ...companies,
        [companyKey]: {
          ...newCompany,
          orders: []
        }
      };

      setCompanies(updatedCompanies);
      
      // Create a placeholder order for this company to maintain data structure
      const storedOrders = localStorage.getItem("orders") || "[]";
      const orders: Order[] = JSON.parse(storedOrders);
      
      const newOrder: Order = {
        id: uuidv4(),
        company_name: newCompany.name,
        contact_name: "Added manually",
        contact_email: newCompany.email,
        contact_phone: newCompany.phone || "Not provided",
        contact_address: newCompany.address || "Not provided",
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
                <Button 
                  onClick={() => setCreateDialogOpen(true)} 
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Company
                </Button>
              )}
            </div>
            
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
                        
                        {isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditClick(key, company)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
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
                            href={getGoogleMapsLink(company.address || "", company.mapLink)} 
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
        </Layout>
      </div>

      {/* Edit Company Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Make changes to the company information below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company-name" className="text-right">
                Name
              </Label>
              <Input
                id="company-name"
                value={currentCompany?.name || ""}
                onChange={(e) => currentCompany && setCurrentCompany({...currentCompany, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={currentCompany?.email || ""}
                onChange={(e) => currentCompany && setCurrentCompany({...currentCompany, email: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={(currentCompany?.phone === "Not provided" ? "" : currentCompany?.phone) || ""}
                onChange={(e) => currentCompany && setCurrentCompany({...currentCompany, phone: e.target.value || "Not provided"})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Textarea
                id="address"
                value={(currentCompany?.address === "Not provided" ? "" : currentCompany?.address) || ""}
                onChange={(e) => currentCompany && setCurrentCompany({...currentCompany, address: e.target.value || "Not provided"})}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="map-link" className="text-right">
                Google Maps URL
              </Label>
              <Input
                id="map-link"
                type="url"
                placeholder="https://www.google.com/maps/..."
                value={currentCompany?.mapLink || ""}
                onChange={(e) => currentCompany && setCurrentCompany({...currentCompany, mapLink: e.target.value})}
                className="col-span-3"
              />
              <div className="col-start-2 col-span-3 text-xs text-muted-foreground">
                Optional: Add a custom Google Maps link. If empty, a link will be generated from the address.
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Company Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
            <DialogDescription>
              Enter the information for the new company.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-company-name" className="text-right">
                Name*
              </Label>
              <Input
                id="new-company-name"
                value={newCompany.name}
                onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-email" className="text-right">
                Email*
              </Label>
              <Input
                id="new-email"
                type="email"
                value={newCompany.email}
                onChange={(e) => setNewCompany({...newCompany, email: e.target.value})}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-phone" className="text-right">
                Phone
              </Label>
              <Input
                id="new-phone"
                value={newCompany.phone || ""}
                onChange={(e) => setNewCompany({...newCompany, phone: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-address" className="text-right">
                Address
              </Label>
              <Textarea
                id="new-address"
                value={newCompany.address || ""}
                onChange={(e) => setNewCompany({...newCompany, address: e.target.value})}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-map-link" className="text-right">
                Google Maps URL
              </Label>
              <Input
                id="new-map-link"
                type="url"
                placeholder="https://www.google.com/maps/..."
                value={newCompany.mapLink || ""}
                onChange={(e) => setNewCompany({...newCompany, mapLink: e.target.value})}
                className="col-span-3"
              />
              <div className="col-start-2 col-span-3 text-xs text-muted-foreground">
                Optional: Add a custom Google Maps link. If empty, a link will be generated from the address.
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCompany}>Create Company</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Companies;

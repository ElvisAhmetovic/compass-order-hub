
import React, { useState, useEffect } from 'react';
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import { Order } from "@/types";
import { Card } from "@/components/ui/card";
import { Building2, Mail, MapPin, Phone, Link } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Companies = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<{[key: string]: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    orders: Order[];
  }}>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
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
        const companyMap: {[key: string]: {
          name: string;
          email: string;
          phone?: string;
          address?: string;
          orders: Order[];
        }} = {};
        
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
  const filteredCompanies = Object.values(companies).filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getGoogleMapsLink = (address: string) => {
    if (address === "Not provided") return "#";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
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
                {filteredCompanies.map((company, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">{company.name}</h3>
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
                            href={getGoogleMapsLink(company.address || "")} 
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
    </div>
  );
};

export default Companies;

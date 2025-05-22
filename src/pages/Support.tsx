
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { InquiriesList } from "@/components/support/InquiriesList";
import { NewInquiryForm } from "@/components/support/NewInquiryForm";
import { UserRole } from "@/types";

const Support = () => {
  const [activeTab, setActiveTab] = useState<string>("inquiries");
  const [showNewInquiryForm, setShowNewInquiryForm] = useState(false);
  
  // Try both auth contexts to ensure we have a user
  const { user: authUser } = useAuth();
  const { user: supabaseUser } = useSupabaseAuth();
  
  // Use either authUser or supabaseUser, whichever is available
  const user = supabaseUser || authUser;
  
  // Log user state for debugging
  useEffect(() => {
    console.log("Support Page - Auth User:", authUser);
    console.log("Support Page - Supabase User:", supabaseUser);
    console.log("Support Page - Combined User:", user);
  }, [authUser, supabaseUser, user]);
  
  // Safely determine user role using type assertion and fallbacks
  const userRole = user?.role || 
                  (user as any)?.user_metadata?.role || 
                  'user';
                  
  // Check if user is admin or owner
  const isAdminOrOwner = userRole === "admin" || userRole === "owner";
  
  // Log the final determination for debugging
  useEffect(() => {
    console.log("Support Page - User Role:", userRole);
    console.log("Support Page - Is admin or owner:", isAdminOrOwner);
  }, [userRole, isAdminOrOwner]);

  const handleCreateInquiry = () => {
    setShowNewInquiryForm(true);
    setActiveTab("new");
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={userRole}>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Support Inquiries</h1>
                <p className="text-muted-foreground">
                  {isAdminOrOwner 
                    ? "Manage and respond to user inquiries"
                    : "Get support from our team"
                  }
                </p>
              </div>
              
              {!isAdminOrOwner && !showNewInquiryForm && (
                <Button onClick={handleCreateInquiry}>
                  <Plus className="h-4 w-4 mr-1" /> New Inquiry
                </Button>
              )}
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="inquiries">
                    {isAdminOrOwner ? "All Inquiries" : "My Inquiries"}
                  </TabsTrigger>
                  {isAdminOrOwner && (
                    <TabsTrigger value="open">Open Inquiries</TabsTrigger>
                  )}
                  {!isAdminOrOwner && showNewInquiryForm && (
                    <TabsTrigger value="new">New Inquiry</TabsTrigger>
                  )}
                </TabsList>
              </div>
              
              <TabsContent value="inquiries" className="p-0">
                <InquiriesList showAll={true} />
              </TabsContent>
              
              {isAdminOrOwner && (
                <TabsContent value="open" className="p-0">
                  <InquiriesList showAll={false} />
                </TabsContent>
              )}
              
              {!isAdminOrOwner && showNewInquiryForm && (
                <TabsContent value="new" className="p-0">
                  <NewInquiryForm onSuccessfulSubmit={() => {
                    setShowNewInquiryForm(false);
                    setActiveTab("inquiries");
                  }} />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default Support;


import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InquiriesList } from "@/components/support/InquiriesList";
import { NewInquiryForm } from "@/components/support/NewInquiryForm";
import { Plus } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";

const Support = () => {
  const [activeTab, setActiveTab] = useState<string>("inquiries");
  const [showNewInquiryForm, setShowNewInquiryForm] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const handleCreateInquiry = () => {
    setShowNewInquiryForm(true);
    setActiveTab("new");
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Customer Support</h1>
                <p className="text-muted-foreground">
                  {isAdmin 
                    ? "View and respond to customer inquiries"
                    : "Get help from our support team"
                  }
                </p>
              </div>
              
              {!isAdmin && !showNewInquiryForm && (
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
                    {isAdmin ? "All Inquiries" : "My Inquiries"}
                  </TabsTrigger>
                  {isAdmin && (
                    <TabsTrigger value="open">Open Inquiries</TabsTrigger>
                  )}
                  {!isAdmin && showNewInquiryForm && (
                    <TabsTrigger value="new">New Inquiry</TabsTrigger>
                  )}
                </TabsList>
              </div>
              
              <TabsContent value="inquiries" className="p-0">
                <InquiriesList showAll={true} />
              </TabsContent>
              
              {isAdmin && (
                <TabsContent value="open" className="p-0">
                  {/* For admin - show only open inquiries */}
                  <InquiriesList showAll={false} />
                </TabsContent>
              )}
              
              {!isAdmin && showNewInquiryForm && (
                <TabsContent value="new" className="p-0">
                  <NewInquiryForm />
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

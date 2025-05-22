
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { InquiriesList } from "@/components/support/InquiriesList";
import { NewInquiryForm } from "@/components/support/NewInquiryForm";

const Support = () => {
  const [activeTab, setActiveTab] = useState<string>("inquiries");
  const [showNewInquiryForm, setShowNewInquiryForm] = useState(false);
  const { user } = useAuth();
  const isAdminOrOwner = user?.role === "admin" || user?.role === "owner";

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

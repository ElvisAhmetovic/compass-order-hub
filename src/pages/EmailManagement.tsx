
import React from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import EmailTemplateManager from "@/components/invoices/EmailTemplateManager";

const EmailManagement = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
          <div className="container mx-auto py-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Email Management</h1>
              <p className="text-muted-foreground">
                Manage email templates and configure email settings.
              </p>
            </div>

            <EmailTemplateManager />
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default EmailManagement;

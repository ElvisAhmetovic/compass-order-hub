
import { RequireAuth } from "@/components/auth/RequireAuth";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TwoFactorAuth } from "@/components/security/TwoFactorAuth";
import { DataEncryption } from "@/components/security/DataEncryption";
import { GDPRCompliance } from "@/components/security/GDPRCompliance";
import { SessionManagement } from "@/components/security/SessionManagement";

export default function SecurityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <RequireAuth>
      <Layout userRole={user?.role}>
        <div className="max-w-4xl mx-auto py-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Security & Compliance</h1>
              <p className="text-muted-foreground">
                Manage your security settings and data privacy controls.
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <TwoFactorAuth />
            <DataEncryption />
            <SessionManagement />
            <GDPRCompliance />
          </div>
        </div>
      </Layout>
    </RequireAuth>
  );
}

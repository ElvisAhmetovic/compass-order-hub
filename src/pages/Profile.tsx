
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ProfileForm } from "@/components/profile/ProfileForm";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <RequireAuth>
      <Layout userRole={user?.role}>
        <div className="max-w-xl mx-auto py-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Your Profile</h1>
          </div>
          <ProfileForm />
        </div>
      </Layout>
    </RequireAuth>
  );
}

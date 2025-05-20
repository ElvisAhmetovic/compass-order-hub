
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ProfileForm } from "@/components/profile/ProfileForm";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <RequireAuth>
      <Layout userRole={user?.role}>
        <div className="max-w-xl mx-auto py-6 space-y-6">
          <h1 className="text-2xl font-bold">Your Profile</h1>
          <ProfileForm />
        </div>
      </Layout>
    </RequireAuth>
  );
}

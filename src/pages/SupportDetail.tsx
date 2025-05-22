
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { InquiryDetail } from "@/components/support/InquiryDetail";
import Sidebar from "@/components/dashboard/Sidebar";
import { UserRole } from "@/types";

const SupportDetail = () => {
  const { user } = useAuth();
  const { user: supabaseUser } = useSupabaseAuth();
  const currentUser = supabaseUser || user;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={(currentUser?.role as UserRole) || "user"}>
          <InquiryDetail />
        </Layout>
      </div>
    </div>
  );
};

export default SupportDetail;

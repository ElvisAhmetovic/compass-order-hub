
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { InquiryDetail } from "@/components/support/InquiryDetail";
import Sidebar from "@/components/dashboard/Sidebar";

const SupportDetail = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
          <InquiryDetail />
        </Layout>
      </div>
    </div>
  );
};

export default SupportDetail;


import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function Auth() {
  const { user, isLoading } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const location = useLocation();

  // Get the intended destination from location state or default to dashboard
  const from = location.state?.from || "/dashboard";

  // Redirect if user is already logged in
  if (user) {
    return <Navigate to={from} />;
  }

  return (
    <AuthContainer>
      <Card className="w-full max-w-md">
        <AuthHeader activeTab={activeTab} onTabChange={setActiveTab} />
        
        <CardContent>
          <Tabs value={activeTab}>
            <TabsContent value="login">
              <LoginForm redirectPath={from} />
            </TabsContent>
            
            <TabsContent value="register">
              <RegisterForm onSuccess={() => setActiveTab("login")} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AuthContainer>
  );
}

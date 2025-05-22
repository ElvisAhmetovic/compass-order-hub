
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";

export function LogoutButton() {
  const { logout } = useAuth();
  const { signOut } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      console.log("LogoutButton: Starting logout process");
      
      // First attempt to clear Supabase session
      try {
        await signOut();
        console.log("LogoutButton: Supabase signOut completed");
      } catch (supabaseError) {
        // Continue even if Supabase logout fails (session might already be invalid)
        console.error("LogoutButton: Supabase signOut error:", supabaseError);
      }
      
      // Always clear local auth state
      logout();
      console.log("LogoutButton: Local auth state cleared");
      
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of the system."
      });
      
      // Force navigation to auth page with replace to prevent back navigation
      console.log("LogoutButton: Navigating to auth page");
      navigate("/auth", { replace: true });
      
    } catch (error) {
      console.error("LogoutButton: Error in logout process:", error);
      toast({
        variant: "destructive",
        title: "Error logging out",
        description: "There was a problem signing you out."
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      onClick={handleLogout}
      title="Logout"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden md:inline">Logout</span>
    </Button>
  );
}

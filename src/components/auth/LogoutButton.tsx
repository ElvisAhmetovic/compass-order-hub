
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
      // Clear both authentication systems
      await signOut();
      logout();
      
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of the system."
      });
      
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
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
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden md:inline">Logout</span>
    </Button>
  );
}

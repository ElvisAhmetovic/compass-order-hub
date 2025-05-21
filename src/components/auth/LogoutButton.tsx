
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";

export function LogoutButton() {
  const { logout } = useAuth();
  const { signOut } = useSupabaseAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      logout();
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
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

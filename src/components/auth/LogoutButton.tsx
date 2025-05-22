
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";             
import { useAuth } from "@/context/AuthContext";

export function LogoutButton() {
  const { logout } = useAuth();

  return (
    <Button
      variant="destructive"          
      onClick={logout}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
}

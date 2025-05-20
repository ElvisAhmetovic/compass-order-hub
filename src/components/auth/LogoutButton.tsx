
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";      
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";             

export function LogoutButton() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    /** Clear any auth/session data here */
    localStorage.removeItem("userSession");   // adjust for your auth flow

    toast?.({
      title: "Logged out",
      description: "See you next time!",
    });

    navigate("/login");                       // redirect to login page
  };

  return (
    <Button
      variant="destructive"          // red button style
      onClick={handleLogout}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
}

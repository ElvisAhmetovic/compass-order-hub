
import { Card, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuthHeaderProps {
  activeTab: "login" | "register";
  onTabChange: (value: "login" | "register") => void;
}

export function AuthHeader({ activeTab, onTabChange }: AuthHeaderProps) {
  return (
    <CardHeader>
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as "login" | "register")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
      </Tabs>
    </CardHeader>
  );
}

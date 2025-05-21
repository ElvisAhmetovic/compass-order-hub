
import { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-primary">Order Flow Compass</h1>
        <p className="text-muted-foreground">Manage your orders efficiently</p>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <h2 className="text-2xl font-semibold text-center">{title}</h2>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

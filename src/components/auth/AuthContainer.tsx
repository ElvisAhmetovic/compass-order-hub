
import { ReactNode } from "react";

interface AuthContainerProps {
  children: ReactNode;
}

export function AuthContainer({ children }: AuthContainerProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-primary">Order Flow Compass</h1>
        <p className="text-muted-foreground">Manage your orders efficiently</p>
      </div>
      {children}
    </div>
  );
}

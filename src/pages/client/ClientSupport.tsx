import ClientLayout from "@/components/client-portal/ClientLayout";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

const ClientSupport = () => {
  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support</h1>
          <p className="text-muted-foreground mt-1">
            Get help with your orders
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Support system coming soon</p>
            <p className="text-sm text-muted-foreground mt-1">
              You'll be able to create and track support tickets here.
            </p>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
};

export default ClientSupport;

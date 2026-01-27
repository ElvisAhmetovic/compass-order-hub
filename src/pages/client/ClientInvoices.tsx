import ClientLayout from "@/components/client-portal/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const ClientInvoices = () => {
  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            View and download your invoices
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Invoice management coming soon</p>
            <p className="text-sm text-muted-foreground mt-1">
              You'll be able to view and download invoices here.
            </p>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
};

export default ClientInvoices;

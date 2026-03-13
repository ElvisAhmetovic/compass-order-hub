import ClientLayout from "@/components/client-portal/ClientLayout";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useLanguage } from "@/context/ClientLanguageContext";

const ClientInvoices = () => {
  const { t } = useLanguage();

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('invoices.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('invoices.subtitle')}
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('invoices.comingSoon')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('invoices.comingSoonDesc')}
            </p>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
};

export default ClientInvoices;

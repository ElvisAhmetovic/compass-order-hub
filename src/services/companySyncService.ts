import { InvoiceService } from "./invoiceService";
import { OrderService } from "./orderService";
import { toast } from "@/hooks/use-toast";

export class CompanySyncService {
  // Sync companies from Supabase orders to Supabase clients
  static async syncCompaniesToClients(): Promise<void> {
    try {
      console.log('🔄 Starting companies to clients sync...');
      
      // Get existing clients from Supabase
      const existingClients = await InvoiceService.getClients();
      const existingClientEmails = new Set(existingClients.map(c => c.email.toLowerCase()));
      
      // Get companies from Supabase orders
      const orders = await OrderService.getOrders();
      const companiesMap: {[key: string]: any} = {};
      
      // Extract unique companies from orders
      orders.forEach((order) => {
        const companyKey = order.company_name.trim().toLowerCase();
        if (!companiesMap[companyKey] && order.contact_email) {
          companiesMap[companyKey] = {
            name: order.company_name,
            email: order.contact_email,
            phone: order.contact_phone || "",
            address: order.company_address || "",
            contact_person: order.contact_name || "",
          };
        }
      });
      
      // Create clients for companies that don't exist in Supabase
      for (const [_, company] of Object.entries(companiesMap)) {
        if (company.email && !existingClientEmails.has(company.email.toLowerCase())) {
          try {
            await InvoiceService.createClient({
              name: company.name,
              email: company.email,
              phone: company.phone,
              address: company.address,
              contact_person: company.contact_person,
              city: "",
              zip_code: "",
              country: "",
              vat_id: "",
              tax_id: ""
            });
            console.log(`✅ Created client for company: ${company.name}`);
          } catch (error) {
            console.error(`❌ Failed to create client for ${company.name}:`, error);
          }
        }
      }
      
      console.log('✅ Companies to clients sync completed');
    } catch (error) {
      console.error('❌ Error syncing companies to clients:', error);
    }
  }

  // Full sync (companies → clients only)
  static async performFullSync(): Promise<void> {
    try {
      await this.syncCompaniesToClients();
      
      toast({
        title: "Sync completed",
        description: "Companies have been synced to clients successfully.",
      });
    } catch (error) {
      console.error('❌ Full sync failed:', error);
      toast({
        title: "Sync failed",
        description: "There was an error synchronizing companies to clients.",
        variant: "destructive",
      });
    }
  }
}

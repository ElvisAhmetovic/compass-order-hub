
import { InvoiceService } from "./invoiceService";
import { Client } from "@/types/invoice";
import { Company } from "@/types";
import { toast } from "@/hooks/use-toast";

export class CompanySyncService {
  // Sync companies from localStorage to Supabase clients
  static async syncCompaniesToClients(): Promise<void> {
    try {
      console.log('🔄 Starting companies to clients sync...');
      
      // Get existing clients from Supabase
      const existingClients = await InvoiceService.getClients();
      const existingClientEmails = new Set(existingClients.map(c => c.email.toLowerCase()));
      
      // Get companies from localStorage (via orders)
      const storedOrders = localStorage.getItem("orders");
      if (!storedOrders) return;
      
      const orders = JSON.parse(storedOrders);
      const companiesMap: {[key: string]: Company} = {};
      
      // Extract unique companies from orders
      orders.forEach((order: any) => {
        const companyKey = order.company_name.trim().toLowerCase();
        if (!companiesMap[companyKey]) {
          companiesMap[companyKey] = {
            name: order.company_name,
            email: order.contact_email,
            phone: order.contact_phone || "",
            address: order.company_address || "",
            mapLink: order.company_link || "",
            orders: []
          };
        }
      });
      
      // Create clients for companies that don't exist in Supabase
      for (const [_, company] of Object.entries(companiesMap)) {
        if (!existingClientEmails.has(company.email.toLowerCase())) {
          try {
            await InvoiceService.createClient({
              name: company.name,
              email: company.email,
              phone: company.phone,
              address: company.address,
              contact_person: "",
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

  // Sync clients from Supabase to localStorage companies
  static async syncClientsToCompanies(): Promise<void> {
    try {
      console.log('🔄 Starting clients to companies sync...');
      
      const clients = await InvoiceService.getClients();
      const storedOrders = localStorage.getItem("orders") || "[]";
      const orders = JSON.parse(storedOrders);
      
      // Create orders for clients that don't have corresponding companies
      for (const client of clients) {
        const hasCompany = orders.some((order: any) => 
          order.company_name.toLowerCase() === client.name.toLowerCase() ||
          order.contact_email.toLowerCase() === client.email.toLowerCase()
        );
        
        if (!hasCompany) {
          const newOrder = {
            id: crypto.randomUUID(),
            company_name: client.name,
            contact_name: client.contact_person || "Contact",
            contact_email: client.email,
            contact_phone: client.phone || "",
            company_address: client.address || "",
            company_link: "",
            description: "Auto-created from client",
            price: 0,
            status: "Created",
            priority: "Low",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: "system"
          };
          
          orders.push(newOrder);
          console.log(`✅ Created company order for client: ${client.name}`);
        }
      }
      
      localStorage.setItem("orders", JSON.stringify(orders));
      window.dispatchEvent(new CustomEvent('ordersUpdated'));
      
      console.log('✅ Clients to companies sync completed');
    } catch (error) {
      console.error('❌ Error syncing clients to companies:', error);
    }
  }

  // Full bidirectional sync
  static async performFullSync(): Promise<void> {
    try {
      await this.syncCompaniesToClients();
      await this.syncClientsToCompanies();
      
      toast({
        title: "Sync completed",
        description: "Companies and clients have been synchronized successfully.",
      });
    } catch (error) {
      console.error('❌ Full sync failed:', error);
      toast({
        title: "Sync failed",
        description: "There was an error synchronizing companies and clients.",
        variant: "destructive",
      });
    }
  }
}

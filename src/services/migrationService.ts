
import { supabase } from "@/integrations/supabase/client";
import { OrderService } from "./orderService";
import { CompanyService } from "./companyService";
import { toast } from "@/hooks/use-toast";

export class MigrationService {
  // Migrate orders from localStorage to Supabase
  static async migrateOrders(): Promise<void> {
    try {
      console.log('🔄 Starting orders migration from localStorage to Supabase...');
      
      const storedOrders = localStorage.getItem("orders");
      if (!storedOrders) {
        console.log('No orders found in localStorage');
        return;
      }

      const orders = JSON.parse(storedOrders);
      
      for (const order of orders) {
        try {
          // Check if order already exists in Supabase by looking for similar data
          const existingOrders = await OrderService.getOrders();
          const existingOrder = existingOrders.find(o => 
            o.company_name === order.company_name && 
            o.contact_email === order.contact_email &&
            o.description === order.description
          );
          
          if (!existingOrder) {
            // Create order in Supabase (without id - it will be auto-generated)
            await OrderService.createOrder({
              company_name: order.company_name,
              contact_name: order.contact_name,
              contact_email: order.contact_email,
              contact_phone: order.contact_phone,
              company_address: order.company_address,
              company_link: order.company_link,
              description: order.description,
              price: order.price,
              status: order.status,
              priority: order.priority,
              amount: order.amount,
              currency: order.currency || 'EUR',
              agent_name: order.agent_name
            });
            console.log(`✅ Migrated order: ${order.company_name}`);
          }
        } catch (error) {
          console.error(`❌ Failed to migrate order ${order.company_name}:`, error);
        }
      }
      
      console.log('✅ Orders migration completed');
    } catch (error) {
      console.error('❌ Orders migration failed:', error);
      throw error;
    }
  }

  // Migrate companies from localStorage to Supabase
  static async migrateCompanies(): Promise<void> {
    try {
      console.log('🔄 Starting companies migration from localStorage to Supabase...');
      
      const storedOrders = localStorage.getItem("orders");
      if (!storedOrders) {
        console.log('No orders found in localStorage to extract companies');
        return;
      }

      const orders = JSON.parse(storedOrders);
      const companiesMap: {[key: string]: any} = {};
      
      // Extract unique companies from orders
      orders.forEach((order: any) => {
        const companyKey = order.company_name.trim().toLowerCase();
        if (!companiesMap[companyKey]) {
          companiesMap[companyKey] = {
            name: order.company_name,
            email: order.contact_email || '',
            phone: order.contact_phone || '',
            address: order.company_address || '',
            contact_person: order.contact_name || 'Contact',
            map_link: order.company_link || ''
          };
        }
      });
      
      // Migrate companies to Supabase
      for (const [_, company] of Object.entries(companiesMap)) {
        try {
          if (company.email) {
            // Check if company already exists
            const existingCompanies = await CompanyService.getCompanies();
            const exists = existingCompanies.some(c => 
              c.email.toLowerCase() === company.email.toLowerCase() ||
              c.name.toLowerCase() === company.name.toLowerCase()
            );
            
            if (!exists) {
              await CompanyService.createCompany(company);
              console.log(`✅ Migrated company: ${company.name}`);
            }
          }
        } catch (error) {
          console.error(`❌ Failed to migrate company ${company.name}:`, error);
        }
      }
      
      console.log('✅ Companies migration completed');
    } catch (error) {
      console.error('❌ Companies migration failed:', error);
      throw error;
    }
  }

  // Full migration from localStorage to Supabase
  static async performFullMigration(): Promise<void> {
    try {
      console.log('🚀 Starting full migration from localStorage to Supabase...');
      
      // First migrate companies, then orders
      await this.migrateCompanies();
      await this.migrateOrders();
      
      toast({
        title: "Migration completed",
        description: "Successfully migrated all data from localStorage to Supabase.",
      });
      
      console.log('🎉 Full migration completed successfully');
    } catch (error) {
      console.error('💥 Migration failed:', error);
      toast({
        title: "Migration failed",
        description: "There was an error migrating data to Supabase.",
        variant: "destructive",
      });
      throw error;
    }
  }
}

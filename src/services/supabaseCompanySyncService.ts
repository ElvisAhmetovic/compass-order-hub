import { supabase } from "@/integrations/supabase/client";
import { Company, Order } from "@/types";
import { CompanyService } from "./companyService";

export class SupabaseCompanySyncService {
  // Enhanced sync that includes orders, clients, and companies
  static async performFullSync(): Promise<void> {
    console.log("Starting enhanced full sync with orders, clients, and companies...");
    
    try {
      // Step 1: Get all orders from the database
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        throw ordersError;
      }

      console.log(`Found ${orders?.length || 0} orders to process`);
      console.log("Sample order data:", orders?.[0]);

      // Step 2: Get existing companies and clients
      const [existingCompanies, existingClients] = await Promise.all([
        this.getExistingCompanies(),
        this.getExistingClients()
      ]);

      console.log(`Found ${existingCompanies.length} existing companies`);
      console.log(`Found ${existingClients.length} existing clients`);

      // Step 3: Process orders and create missing companies
      await this.syncCompaniesFromOrders(orders || [], existingCompanies);
      
      // Step 4: Sync with existing clients (original functionality)
      await this.syncCompaniesWithClients(existingClients, existingCompanies);

      console.log("Enhanced full sync completed successfully");
    } catch (error) {
      console.error("Enhanced full sync failed:", error);
      throw error;
    }
  }

  // New method to sync companies from order data
  private static async syncCompaniesFromOrders(orders: Order[], existingCompanies: Company[]): Promise<void> {
    console.log("Syncing companies from orders...");
    
    const companiesToCreate: Set<string> = new Set();
    const orderCompanyMap: Map<string, Order> = new Map();

    // Group orders by company name and collect unique companies
    orders.forEach(order => {
      if (order.company_name && order.company_name.trim()) {
        const companyKey = order.company_name.toLowerCase().trim();
        companiesToCreate.add(companyKey);
        
        // Keep the most recent order data for each company
        if (!orderCompanyMap.has(companyKey) || 
            new Date(order.created_at || '') > new Date(orderCompanyMap.get(companyKey)?.created_at || '')) {
          orderCompanyMap.set(companyKey, order);
        }
      }
    });

    console.log(`Found ${companiesToCreate.size} unique companies in orders`);
    console.log("Companies to potentially create:", Array.from(companiesToCreate));

    // Filter out companies that already exist (improved matching)
    const existingCompanyNames = new Set(
      existingCompanies.map(company => company.name.toLowerCase().trim())
    );

    console.log("Existing company names:", Array.from(existingCompanyNames));

    const newCompaniesToCreate = Array.from(companiesToCreate).filter(
      companyKey => !existingCompanyNames.has(companyKey)
    );

    console.log(`Creating ${newCompaniesToCreate.length} new companies from orders`);
    console.log("New companies to create:", newCompaniesToCreate);

    // Create companies from order data
    for (const companyKey of newCompaniesToCreate) {
      const orderData = orderCompanyMap.get(companyKey);
      if (orderData) {
        try {
          const companyData = {
            name: orderData.company_name,
            email: orderData.contact_email || `contact@${this.generateEmailDomain(orderData.company_name)}`,
            phone: orderData.contact_phone || "Not provided",
            address: orderData.company_address || "Not provided",
            contact_person: orderData.contact_name || "Not provided",
            map_link: orderData.company_link || ""
          };

          console.log("Creating company with data:", companyData);
          await CompanyService.createCompany(companyData);
          console.log(`Created company from order: ${orderData.company_name}`);
        } catch (error) {
          console.error(`Failed to create company from order ${orderData.company_name}:`, error);
        }
      }
    }
  }

  // Original method for syncing with clients (kept for backward compatibility)
  private static async syncCompaniesWithClients(existingClients: any[], existingCompanies: Company[]): Promise<void> {
    console.log("Syncing companies with existing clients...");
    
    const existingCompanyNames = new Set(
      existingCompanies.map(company => company.name.toLowerCase().trim())
    );

    const clientsToConvert = existingClients.filter(client => 
      client.name && !existingCompanyNames.has(client.name.toLowerCase().trim())
    );

    console.log(`Converting ${clientsToConvert.length} clients to companies`);

    for (const client of clientsToConvert) {
      try {
        const companyData = {
          name: client.name,
          email: client.email || `contact@${this.generateEmailDomain(client.name)}`,
          phone: client.phone || "Not provided",
          address: client.address || "Not provided",
          contact_person: client.contact_person || "Not provided",
          map_link: ""
        };

        await CompanyService.createCompany(companyData);
        console.log(`Converted client to company: ${client.name}`);
      } catch (error) {
        console.error(`Failed to convert client ${client.name}:`, error);
      }
    }
  }

  // Helper method to get existing companies
  private static async getExistingCompanies(): Promise<Company[]> {
    try {
      return await CompanyService.getCompanies();
    } catch (error) {
      console.error("Error fetching existing companies:", error);
      return [];
    }
  }

  // Helper method to get existing clients
  private static async getExistingClients(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching existing clients:", error);
      return [];
    }
  }

  // Helper method to generate email domain from company name
  private static generateEmailDomain(companyName: string): string {
    return companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20) + '.com';
  }

  // Method to sync a specific order's company data
  static async syncOrderCompany(order: Order): Promise<void> {
    if (!order.company_name) return;

    try {
      const existingCompanies = await this.getExistingCompanies();
      const companyExists = existingCompanies.some(
        company => company.name.toLowerCase().trim() === order.company_name.toLowerCase().trim()
      );

      if (!companyExists) {
        const companyData = {
          name: order.company_name,
          email: order.contact_email || `contact@${this.generateEmailDomain(order.company_name)}`,
          phone: order.contact_phone || "Not provided",
          address: order.company_address || "Not provided",
          contact_person: order.contact_name || "Not provided",
          map_link: order.company_link || ""
        };

        await CompanyService.createCompany(companyData);
        console.log(`Auto-created company from order: ${order.company_name}`);
      }
    } catch (error) {
      console.error(`Failed to sync company for order ${order.id}:`, error);
    }
  }

  // Method to remove duplicate companies
  static async removeDuplicateCompanies(): Promise<void> {
    console.log("Starting duplicate company removal...");
    
    try {
      const companies = await this.getExistingCompanies();
      const companyGroups = new Map<string, Company[]>();
      
      // Group companies by normalized name
      companies.forEach(company => {
        const normalizedName = company.name.toLowerCase().trim();
        if (!companyGroups.has(normalizedName)) {
          companyGroups.set(normalizedName, []);
        }
        companyGroups.get(normalizedName)!.push(company);
      });
      
      // Remove duplicates (keep the newest one)
      for (const [name, groupedCompanies] of companyGroups) {
        if (groupedCompanies.length > 1) {
          // Sort by created_at descending and keep the first (newest)
          groupedCompanies.sort((a, b) => 
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
          );
          
          const [keepCompany, ...duplicates] = groupedCompanies;
          console.log(`Found ${duplicates.length} duplicates for "${name}", keeping:`, keepCompany.id);
          
          // Delete the duplicates
          for (const duplicate of duplicates) {
            try {
              await CompanyService.deleteCompany(duplicate.id);
              console.log(`Deleted duplicate company: ${duplicate.name} (${duplicate.id})`);
            } catch (error) {
              console.error(`Failed to delete duplicate company ${duplicate.id}:`, error);
            }
          }
        }
      }
      
      console.log("Duplicate removal completed");
    } catch (error) {
      console.error("Duplicate removal failed:", error);
      throw error;
    }
  }
}

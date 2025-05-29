
import { supabase } from "@/integrations/supabase/client";
import { Company } from "@/types";

export class CompanyService {
  // Get all companies
  static async getCompanies(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // Get company by ID
  static async getCompany(id: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create new company
  static async createCompany(companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<Company> {
    const user = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('companies')
      .insert({
        ...companyData,
        user_id: user.data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update company
  static async updateCompany(id: string, companyData: Partial<Company>): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .update(companyData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete company
  static async deleteCompany(id: string): Promise<void> {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

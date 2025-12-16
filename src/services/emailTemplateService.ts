import { supabase } from "@/integrations/supabase/client";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  is_default: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateInput {
  name: string;
  subject: string;
  body: string;
  type: string;
  is_default?: boolean;
}

export const emailTemplateService = {
  async getTemplates(type?: string): Promise<EmailTemplate[]> {
    let query = supabase
      .from("email_templates")
      .select("*")
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching email templates:", error);
      throw error;
    }

    return data as EmailTemplate[];
  },

  async getDefaultTemplate(type: string): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("type", type)
      .eq("is_default", true)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching default template:", error);
      throw error;
    }

    return data as EmailTemplate | null;
  },

  async getTemplateById(id: string): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching template:", error);
      throw error;
    }

    return data as EmailTemplate;
  },

  async createTemplate(template: EmailTemplateInput): Promise<EmailTemplate> {
    const { data: user } = await supabase.auth.getUser();

    // If setting as default, unset other defaults first
    if (template.is_default) {
      await supabase
        .from("email_templates")
        .update({ is_default: false })
        .eq("type", template.type)
        .eq("is_default", true);
    }

    const { data, error } = await supabase
      .from("email_templates")
      .insert({
        ...template,
        user_id: user?.user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating template:", error);
      throw error;
    }

    return data as EmailTemplate;
  },

  async updateTemplate(id: string, template: Partial<EmailTemplateInput>): Promise<EmailTemplate> {
    // If setting as default, unset other defaults first
    if (template.is_default && template.type) {
      await supabase
        .from("email_templates")
        .update({ is_default: false })
        .eq("type", template.type)
        .eq("is_default", true)
        .neq("id", id);
    }

    const { data, error } = await supabase
      .from("email_templates")
      .update(template)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating template:", error);
      throw error;
    }

    return data as EmailTemplate;
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from("email_templates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting template:", error);
      throw error;
    }
  },

  async duplicateTemplate(id: string, newName: string): Promise<EmailTemplate> {
    const original = await this.getTemplateById(id);
    if (!original) throw new Error("Template not found");

    return this.createTemplate({
      name: newName,
      subject: original.subject,
      body: original.body,
      type: original.type,
      is_default: false,
    });
  },

  // Replace template variables with actual values
  replaceVariables(
    template: string,
    variables: {
      companyName?: string;
      clientEmail?: string;
      contactPhone?: string;
      website?: string;
      orderDate?: string;
      orderDescription?: string;
      amount?: string;
      customMessage?: string;
      teamMemberName?: string;
    }
  ): string {
    let result = template;

    if (variables.companyName) {
      result = result.replace(/{companyName}/g, variables.companyName);
    }
    if (variables.clientEmail) {
      result = result.replace(/{clientEmail}/g, variables.clientEmail);
    }
    if (variables.contactPhone) {
      result = result.replace(/{contactPhone}/g, variables.contactPhone || "N/A");
    }
    if (variables.website) {
      result = result.replace(/{website}/g, variables.website);
    } else {
      result = result.replace(/{website}/g, "N/A");
    }
    if (variables.orderDate) {
      result = result.replace(/{orderDate}/g, variables.orderDate);
    }
    if (variables.orderDescription) {
      result = result.replace(/{orderDescription}/g, variables.orderDescription || "N/A");
    }
    if (variables.amount) {
      result = result.replace(/{amount}/g, variables.amount);
    }
    if (variables.customMessage) {
      result = result.replace(
        /{customMessage}/g,
        `<div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;"><p style="margin: 0; font-style: italic;">"${variables.customMessage}"</p></div>`
      );
    } else {
      result = result.replace(/{customMessage}/g, "");
    }
    if (variables.teamMemberName) {
      result = result.replace(/{teamMemberName}/g, variables.teamMemberName);
    }

    return result;
  },
};

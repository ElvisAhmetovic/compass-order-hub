import { supabase } from "@/integrations/supabase/client";

export interface ProposalTemplate {
  id: string;
  name: string;
  is_default: boolean;
  template_data: Record<string, unknown>;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProposalTemplateInput {
  name: string;
  is_default?: boolean;
  template_data: Record<string, unknown>;
}

export const proposalTemplateService = {
  async getTemplates(): Promise<ProposalTemplate[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from("proposal_templates")
        .select("*")
        .eq("user_id", user.user.id)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching proposal templates:", error);
        throw error;
      }

      return (data || []) as ProposalTemplate[];
    } catch (error) {
      console.error("Error in getTemplates:", error);
      return [];
    }
  },

  async getDefaultTemplate(): Promise<ProposalTemplate | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        return null;
      }

      const { data, error } = await supabase
        .from("proposal_templates")
        .select("*")
        .eq("user_id", user.user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching default template:", error);
        return null;
      }

      return data as ProposalTemplate | null;
    } catch (error) {
      console.error("Error in getDefaultTemplate:", error);
      return null;
    }
  },

  async createTemplate(template: ProposalTemplateInput): Promise<ProposalTemplate> {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      throw new Error("User not authenticated");
    }

    // If setting as default, unset other defaults first
    if (template.is_default) {
      await supabase
        .from("proposal_templates")
        .update({ is_default: false })
        .eq("user_id", user.user.id)
        .eq("is_default", true);
    }

    const { data, error } = await supabase
      .from("proposal_templates")
      .insert({
        name: template.name,
        is_default: template.is_default || false,
        template_data: template.template_data,
        user_id: user.user.id
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating template:", error);
      throw error;
    }

    return data as ProposalTemplate;
  },

  async updateTemplate(id: string, template: Partial<ProposalTemplateInput>): Promise<ProposalTemplate> {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      throw new Error("User not authenticated");
    }

    // If setting as default, unset other defaults first
    if (template.is_default) {
      await supabase
        .from("proposal_templates")
        .update({ is_default: false })
        .eq("user_id", user.user.id)
        .eq("is_default", true)
        .neq("id", id);
    }

    const { data, error } = await supabase
      .from("proposal_templates")
      .update(template)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating template:", error);
      throw error;
    }

    return data as ProposalTemplate;
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from("proposal_templates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting template:", error);
      throw error;
    }
  },

  async setAsDefault(id: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      throw new Error("User not authenticated");
    }

    // Unset all defaults first
    await supabase
      .from("proposal_templates")
      .update({ is_default: false })
      .eq("user_id", user.user.id)
      .eq("is_default", true);

    // Set the new default
    await supabase
      .from("proposal_templates")
      .update({ is_default: true })
      .eq("id", id);
  }
};

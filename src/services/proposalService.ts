import { supabase } from "@/integrations/supabase/client";

export interface ProposalLineItem {
  id: string;
  proposal_id: string;
  item_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit?: string;
  category?: string;
  created_at?: string;
}

export interface Proposal {
  id: string;
  number: string;
  customer: string;
  subject?: string;
  reference: string;
  amount: string;
  status: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  currency?: string;
  vat_enabled?: boolean;
  vat_rate?: number;
  customer_name?: string;
  customer_address?: string;
  customer_email?: string;
  customer_country?: string;
  customer_ref?: string;
  your_contact?: string;
  internal_contact?: string;
  proposal_title?: string;
  proposal_description?: string;
  delivery_terms?: string;
  payment_terms?: string;
  terms_and_conditions?: string;
  footer_content?: string;
  include_payment_data?: boolean;
  logo?: string;
  logo_size?: number;
  net_amount?: number;
  vat_amount?: number;
  total_amount?: number;
  pdf_language?: string;
  proposal_date?: string;
  proposal_time?: string;
  iban?: string;
  bic?: string;
  blz_konto?: string;
  content?: string;
  lineItems?: ProposalLineItem[];
}

export interface ProposalInput {
  number: string;
  customer: string;
  subject?: string;
  reference: string;
  amount: string;
  status: string;
  currency?: string;
  vat_enabled?: boolean;
  vat_rate?: number;
  customer_name?: string;
  customer_address?: string;
  customer_email?: string;
  customer_country?: string;
  customer_ref?: string;
  your_contact?: string;
  internal_contact?: string;
  proposal_title?: string;
  proposal_description?: string;
  delivery_terms?: string;
  payment_terms?: string;
  terms_and_conditions?: string;
  footer_content?: string;
  include_payment_data?: boolean;
  logo?: string;
  logo_size?: number;
  net_amount?: number;
  vat_amount?: number;
  total_amount?: number;
  pdf_language?: string;
  proposal_date?: string;
  proposal_time?: string;
  iban?: string;
  bic?: string;
  blz_konto?: string;
  content?: string;
  lineItems?: Omit<ProposalLineItem, 'id' | 'proposal_id' | 'created_at'>[];
}

export const proposalService = {
  async getProposals(): Promise<Proposal[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        console.warn("User not authenticated, returning empty proposals");
        return [];
      }

      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching proposals:", error);
        throw error;
      }

      return (data || []).map(p => ({
        ...p,
        vatEnabled: p.vat_enabled,
        customerName: p.customer_name,
        customerAddress: p.customer_address,
        customerEmail: p.customer_email,
        customerCountry: p.customer_country,
        customerRef: p.customer_ref,
        yourContact: p.your_contact,
        internalContact: p.internal_contact,
        proposalTitle: p.proposal_title,
        proposalDescription: p.proposal_description,
        deliveryTerms: p.delivery_terms,
        paymentTerms: p.payment_terms,
        termsAndConditions: p.terms_and_conditions,
        footerContent: p.footer_content,
        includePaymentData: p.include_payment_data,
        logoSize: p.logo_size,
        netAmount: p.net_amount,
        vatAmount: p.vat_amount,
        totalAmount: p.total_amount,
        pdfLanguage: p.pdf_language,
        proposalDate: p.proposal_date,
        proposalTime: p.proposal_time,
        blzKonto: p.blz_konto
      })) as Proposal[];
    } catch (error) {
      console.error("Error in getProposals:", error);
      return [];
    }
  },

  async getProposal(id: string): Promise<Proposal | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        console.warn("User not authenticated");
        return null;
      }

      // Fetch proposal
      const { data: proposal, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching proposal:", error);
        return null;
      }

      if (!proposal) {
        return null;
      }

      // Fetch line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from("proposal_line_items")
        .select("*")
        .eq("proposal_id", id)
        .order("created_at", { ascending: true });

      if (lineItemsError) {
        console.error("Error fetching line items:", lineItemsError);
      }

      return {
        ...proposal,
        vatEnabled: proposal.vat_enabled,
        customerName: proposal.customer_name,
        customerAddress: proposal.customer_address,
        customerEmail: proposal.customer_email,
        customerCountry: proposal.customer_country,
        customerRef: proposal.customer_ref,
        yourContact: proposal.your_contact,
        internalContact: proposal.internal_contact,
        proposalTitle: proposal.proposal_title,
        proposalDescription: proposal.proposal_description,
        deliveryTerms: proposal.delivery_terms,
        paymentTerms: proposal.payment_terms,
        termsAndConditions: proposal.terms_and_conditions,
        footerContent: proposal.footer_content,
        includePaymentData: proposal.include_payment_data,
        logoSize: proposal.logo_size,
        netAmount: proposal.net_amount,
        vatAmount: proposal.vat_amount,
        totalAmount: proposal.total_amount,
        pdfLanguage: proposal.pdf_language,
        proposalDate: proposal.proposal_date,
        proposalTime: proposal.proposal_time,
        blzKonto: proposal.blz_konto,
        lineItems: (lineItems || []).map(item => ({
          ...item,
          item_id: item.item_id || undefined
        }))
      } as Proposal;
    } catch (error) {
      console.error("Error in getProposal:", error);
      return null;
    }
  },

  async createProposal(input: ProposalInput): Promise<Proposal> {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      throw new Error("User not authenticated");
    }

    const { lineItems, ...proposalData } = input;

    // Map camelCase fields to snake_case for database
    const dbProposalData = {
      number: proposalData.number,
      customer: proposalData.customer,
      subject: proposalData.subject,
      reference: proposalData.reference,
      amount: proposalData.amount,
      status: proposalData.status,
      user_id: user.user.id,
      currency: proposalData.currency || 'EUR',
      vat_enabled: proposalData.vat_enabled ?? true,
      vat_rate: proposalData.vat_rate ?? 19,
      customer_name: proposalData.customer_name,
      customer_address: proposalData.customer_address,
      customer_email: proposalData.customer_email,
      customer_country: proposalData.customer_country,
      customer_ref: proposalData.customer_ref,
      your_contact: proposalData.your_contact,
      internal_contact: proposalData.internal_contact,
      proposal_title: proposalData.proposal_title,
      proposal_description: proposalData.proposal_description,
      delivery_terms: proposalData.delivery_terms,
      payment_terms: proposalData.payment_terms,
      terms_and_conditions: proposalData.terms_and_conditions,
      footer_content: proposalData.footer_content,
      include_payment_data: proposalData.include_payment_data ?? true,
      logo: proposalData.logo,
      logo_size: proposalData.logo_size ?? 33,
      net_amount: proposalData.net_amount ?? 0,
      vat_amount: proposalData.vat_amount ?? 0,
      total_amount: proposalData.total_amount ?? 0,
      pdf_language: proposalData.pdf_language ?? 'en',
      proposal_date: proposalData.proposal_date,
      proposal_time: proposalData.proposal_time,
      iban: proposalData.iban,
      bic: proposalData.bic,
      blz_konto: proposalData.blz_konto,
      content: proposalData.content
    };

    const { data: proposal, error } = await supabase
      .from("proposals")
      .insert(dbProposalData)
      .select()
      .single();

    if (error) {
      console.error("Error creating proposal:", error);
      throw error;
    }

    // Insert line items if provided
    if (lineItems && lineItems.length > 0) {
      const lineItemsData = lineItems.map(item => ({
        proposal_id: proposal.id,
        item_id: item.item_id || null,
        name: item.name,
        description: item.description || null,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_price: item.total_price || 0,
        unit: item.unit || 'unit',
        category: item.category || null
      }));

      const { error: lineItemsError } = await supabase
        .from("proposal_line_items")
        .insert(lineItemsData);

      if (lineItemsError) {
        console.error("Error creating line items:", lineItemsError);
        // Don't throw, proposal was created
      }
    }

    return proposal as Proposal;
  },

  async updateProposal(id: string, input: Partial<ProposalInput>): Promise<Proposal> {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      throw new Error("User not authenticated");
    }

    const { lineItems, ...proposalData } = input;

    // Map camelCase fields to snake_case for database
    const dbUpdateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (proposalData.number !== undefined) dbUpdateData.number = proposalData.number;
    if (proposalData.customer !== undefined) dbUpdateData.customer = proposalData.customer;
    if (proposalData.subject !== undefined) dbUpdateData.subject = proposalData.subject;
    if (proposalData.reference !== undefined) dbUpdateData.reference = proposalData.reference;
    if (proposalData.amount !== undefined) dbUpdateData.amount = proposalData.amount;
    if (proposalData.status !== undefined) dbUpdateData.status = proposalData.status;
    if (proposalData.currency !== undefined) dbUpdateData.currency = proposalData.currency;
    if (proposalData.vat_enabled !== undefined) dbUpdateData.vat_enabled = proposalData.vat_enabled;
    if (proposalData.vat_rate !== undefined) dbUpdateData.vat_rate = proposalData.vat_rate;
    if (proposalData.customer_name !== undefined) dbUpdateData.customer_name = proposalData.customer_name;
    if (proposalData.customer_address !== undefined) dbUpdateData.customer_address = proposalData.customer_address;
    if (proposalData.customer_email !== undefined) dbUpdateData.customer_email = proposalData.customer_email;
    if (proposalData.customer_country !== undefined) dbUpdateData.customer_country = proposalData.customer_country;
    if (proposalData.customer_ref !== undefined) dbUpdateData.customer_ref = proposalData.customer_ref;
    if (proposalData.your_contact !== undefined) dbUpdateData.your_contact = proposalData.your_contact;
    if (proposalData.internal_contact !== undefined) dbUpdateData.internal_contact = proposalData.internal_contact;
    if (proposalData.proposal_title !== undefined) dbUpdateData.proposal_title = proposalData.proposal_title;
    if (proposalData.proposal_description !== undefined) dbUpdateData.proposal_description = proposalData.proposal_description;
    if (proposalData.delivery_terms !== undefined) dbUpdateData.delivery_terms = proposalData.delivery_terms;
    if (proposalData.payment_terms !== undefined) dbUpdateData.payment_terms = proposalData.payment_terms;
    if (proposalData.terms_and_conditions !== undefined) dbUpdateData.terms_and_conditions = proposalData.terms_and_conditions;
    if (proposalData.footer_content !== undefined) dbUpdateData.footer_content = proposalData.footer_content;
    if (proposalData.include_payment_data !== undefined) dbUpdateData.include_payment_data = proposalData.include_payment_data;
    if (proposalData.logo !== undefined) dbUpdateData.logo = proposalData.logo;
    if (proposalData.logo_size !== undefined) dbUpdateData.logo_size = proposalData.logo_size;
    if (proposalData.net_amount !== undefined) dbUpdateData.net_amount = proposalData.net_amount;
    if (proposalData.vat_amount !== undefined) dbUpdateData.vat_amount = proposalData.vat_amount;
    if (proposalData.total_amount !== undefined) dbUpdateData.total_amount = proposalData.total_amount;
    if (proposalData.pdf_language !== undefined) dbUpdateData.pdf_language = proposalData.pdf_language;
    if (proposalData.proposal_date !== undefined) dbUpdateData.proposal_date = proposalData.proposal_date;
    if (proposalData.proposal_time !== undefined) dbUpdateData.proposal_time = proposalData.proposal_time;
    if (proposalData.iban !== undefined) dbUpdateData.iban = proposalData.iban;
    if (proposalData.bic !== undefined) dbUpdateData.bic = proposalData.bic;
    if (proposalData.blz_konto !== undefined) dbUpdateData.blz_konto = proposalData.blz_konto;
    if (proposalData.content !== undefined) dbUpdateData.content = proposalData.content;

    const { data: proposal, error } = await supabase
      .from("proposals")
      .update(dbUpdateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating proposal:", error);
      throw error;
    }

    // Update line items if provided
    if (lineItems !== undefined) {
      // Delete existing line items
      await supabase
        .from("proposal_line_items")
        .delete()
        .eq("proposal_id", id);

      // Insert new line items
      if (lineItems.length > 0) {
        const lineItemsData = lineItems.map(item => ({
          proposal_id: id,
          item_id: item.item_id || null,
          name: item.name,
          description: item.description || null,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          unit: item.unit || 'unit',
          category: item.category || null
        }));

        const { error: lineItemsError } = await supabase
          .from("proposal_line_items")
          .insert(lineItemsData);

        if (lineItemsError) {
          console.error("Error updating line items:", lineItemsError);
        }
      }
    }

    return proposal as Proposal;
  },

  async deleteProposal(id: string): Promise<void> {
    const { error } = await supabase
      .from("proposals")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting proposal:", error);
      throw error;
    }
  },

  async getNextProposalNumber(): Promise<string> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        return `AN-${9985}`;
      }

      const { count, error } = await supabase
        .from("proposals")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.user.id);

      if (error) {
        console.error("Error getting proposal count:", error);
        return `AN-${9985}`;
      }

      return `AN-${9984 + (count || 0) + 1}`;
    } catch (error) {
      console.error("Error in getNextProposalNumber:", error);
      return `AN-${9985}`;
    }
  },

  async getNextReference(): Promise<string> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        return `REF-${new Date().getFullYear()}-001`;
      }

      const { count, error } = await supabase
        .from("proposals")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.user.id);

      if (error) {
        console.error("Error getting proposal count:", error);
        return `REF-${new Date().getFullYear()}-001`;
      }

      return `REF-${new Date().getFullYear()}-${((count || 0) + 1).toString().padStart(3, '0')}`;
    } catch (error) {
      console.error("Error in getNextReference:", error);
      return `REF-${new Date().getFullYear()}-001`;
    }
  }
};

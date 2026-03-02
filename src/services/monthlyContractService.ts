import { supabase } from "@/integrations/supabase/client";

export interface MonthlyContract {
  id: string;
  client_name: string;
  client_email: string;
  website: string | null;
  total_value: number;
  monthly_amount: number;
  currency: string;
  start_date: string;
  duration_months: number;
  status: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlyInstallment {
  id: string;
  contract_id: string;
  month_label: string;
  month_number: number;
  due_date: string;
  amount: number;
  currency: string;
  payment_status: string;
  paid_at: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  client_name: string | null;
  client_email: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

const germanMonths = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

export const monthlyContractService = {
  async getContracts(): Promise<MonthlyContract[]> {
    const { data, error } = await supabase
      .from("monthly_contracts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as MonthlyContract[];
  },

  async createContract(
    contract: Omit<MonthlyContract, "id" | "created_at" | "updated_at" | "monthly_amount">,
    userId: string
  ): Promise<MonthlyContract> {
    const monthlyAmount = contract.total_value / contract.duration_months;

    const { data, error } = await supabase
      .from("monthly_contracts")
      .insert({
        client_name: contract.client_name,
        client_email: contract.client_email,
        website: contract.website,
        total_value: contract.total_value,
        monthly_amount: Math.round(monthlyAmount * 100) / 100,
        currency: contract.currency,
        start_date: contract.start_date,
        duration_months: contract.duration_months,
        status: contract.status || "active",
        description: contract.description,
        created_by: userId,
      } as any)
      .select()
      .single();

    if (error) throw error;
    const newContract = data as unknown as MonthlyContract;

    // Pre-generate all installment rows
    const startDate = new Date(contract.start_date);
    const installments = [];

    for (let i = 0; i < contract.duration_months; i++) {
      const installmentDate = new Date(startDate);
      installmentDate.setMonth(startDate.getMonth() + i);

      const monthIndex = installmentDate.getMonth();
      const year = installmentDate.getFullYear();
      const monthLabel = `${germanMonths[monthIndex]} ${year}`;
      const dueDate = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;

      installments.push({
        contract_id: newContract.id,
        month_label: monthLabel,
        month_number: i + 1,
        due_date: dueDate,
        amount: newContract.monthly_amount,
        currency: newContract.currency,
        payment_status: "unpaid",
        client_name: contract.client_name,
        client_email: contract.client_email,
        website: contract.website,
      });
    }

    const { error: installError } = await supabase
      .from("monthly_installments")
      .insert(installments as any);

    if (installError) throw installError;

    return newContract;
  },

  async getInstallments(contractId?: string): Promise<MonthlyInstallment[]> {
    let query = supabase
      .from("monthly_installments")
      .select("*")
      .order("due_date", { ascending: true });

    if (contractId) {
      query = query.eq("contract_id", contractId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as MonthlyInstallment[];
  },

  async togglePaymentStatus(installmentId: string, newStatus: "paid" | "unpaid") {
    const updateData: any = {
      payment_status: newStatus,
      paid_at: newStatus === "paid" ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from("monthly_installments")
      .update(updateData)
      .eq("id", installmentId);

    if (error) throw error;
  },

  async updateContractStatus(contractId: string, status: string) {
    const { error } = await supabase
      .from("monthly_contracts")
      .update({ status } as any)
      .eq("id", contractId);
    if (error) throw error;
  },

  async deleteContract(contractId: string) {
    const { error } = await supabase
      .from("monthly_contracts")
      .delete()
      .eq("id", contractId);
    if (error) throw error;
  },
};

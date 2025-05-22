
export interface Proposal {
  id: string;
  reference: string;
  number: string;
  customer: string;
  user_id?: string;
  created_at: string;
  updated_at?: string;
  status: ProposalStatus;
  amount: string;
}

export type ProposalStatus = 'All' | 'Draft' | 'Unpaid' | 'Paid' | 'Received' | 'Calculated' | 'Partially Calculated' | 'Rejected' | 'Archived';

export interface ProposalFilterOptions {
  status: ProposalStatus | null;
  searchTerm: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

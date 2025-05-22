
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

export type ProposalStatus = 'Sve' | 'Nacrt' | 'Neisplaćen' | 'Primljen' | 'Izračunat' | 'Djelomično izračunato' | 'Odbijen' | 'Arhiv';

export interface ProposalFilterOptions {
  status: ProposalStatus | null;
  searchTerm: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

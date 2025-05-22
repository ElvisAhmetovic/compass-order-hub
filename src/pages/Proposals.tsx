
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ProposalsHeader from '@/components/proposals/ProposalsHeader';
import ProposalsTabs from '@/components/proposals/ProposalsTabs';
import ProposalsTable from '@/components/proposals/ProposalsTable';
import { ProposalStatus, ProposalFilterOptions } from '@/types/proposal';
import { useAuth } from '@/context/AuthContext';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CreateProposalModal from '@/components/proposals/CreateProposalModal';
import Sidebar from '@/components/dashboard/Sidebar';

const Proposals = () => {
  const [activeTab, setActiveTab] = useState<ProposalStatus>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<ProposalFilterOptions>({
    status: null,
    searchTerm: '',
    dateRange: { from: null, to: null }
  });

  const { user: localUser } = useAuth();
  const { user: supabaseUser } = useSupabaseAuth();
  const user = supabaseUser || localUser;
  const { toast } = useToast();

  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Check if user has access to the proposals page
  useEffect(() => {
    if (user && (user.role !== 'admin' && user.role !== 'owner')) {
      setError('You do not have permission to access this page.');
      setIsLoading(false);
    } else {
      setError(null);
    }
  }, [user]);
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={(user?.role || 'user') as UserRole}>
          <div className="space-y-6">
            <ProposalsHeader 
              title="Proposals"
              onCreateProposal={() => setIsCreateModalOpen(true)}
            />
            
            {error ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            ) : (
              <>
                <ProposalsTabs 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                />
                
                <ProposalsTable 
                  statusFilter={activeTab}
                  filterOptions={filterOptions}
                  setFilterOptions={setFilterOptions}
                  refreshTrigger={refreshTrigger}
                />
              </>
            )}
            
            <CreateProposalModal
              open={isCreateModalOpen}
              onClose={() => {
                setIsCreateModalOpen(false);
                handleRefresh();
              }}
            />
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default Proposals;

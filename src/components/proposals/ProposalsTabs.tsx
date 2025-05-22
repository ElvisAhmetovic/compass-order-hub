
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProposalStatus } from '@/types/proposal';

interface ProposalsTabsProps {
  activeTab: ProposalStatus;
  setActiveTab: (tab: ProposalStatus) => void;
}

const ProposalsTabs: React.FC<ProposalsTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs: ProposalStatus[] = [
    'All', 'Draft', 'Unpaid', 'Received', 'Calculated', 'Partially Calculated', 'Rejected', 'Archived'
  ];

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ProposalStatus)}>
      <TabsList className="w-full h-auto flex-wrap gap-2 bg-transparent">
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab} 
            value={tab}
            className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default ProposalsTabs;

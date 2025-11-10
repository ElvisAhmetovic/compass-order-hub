import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PeriodFilterProps {
  selectedPeriod: 'today' | 'week' | 'month' | 'all';
  onPeriodChange: (period: 'today' | 'week' | 'month' | 'all') => void;
}

export const PeriodFilter = ({ selectedPeriod, onPeriodChange }: PeriodFilterProps) => {
  return (
    <Tabs value={selectedPeriod} onValueChange={(value) => onPeriodChange(value as any)}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="today">Today</TabsTrigger>
        <TabsTrigger value="week">This Week</TabsTrigger>
        <TabsTrigger value="month">This Month</TabsTrigger>
        <TabsTrigger value="all">All Time</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

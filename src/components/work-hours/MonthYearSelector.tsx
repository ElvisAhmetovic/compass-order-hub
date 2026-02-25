import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

interface MonthYearSelectorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

const MonthYearSelector = ({ month, year, onChange }: MonthYearSelectorProps) => {
  const goBack = () => {
    if (month === 0) onChange(11, year - 1);
    else onChange(month - 1, year);
  };

  const goForward = () => {
    if (month === 11) onChange(0, year + 1);
    else onChange(month + 1, year);
  };

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon" onClick={goBack}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-lg font-semibold min-w-[180px] text-center">
        {MONTH_NAMES[month]} {year}
      </span>
      <Button variant="outline" size="icon" onClick={goForward}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MonthYearSelector;

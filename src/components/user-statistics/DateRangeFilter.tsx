import { useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "@/utils/dateRangeHelpers";
import {
  getThisMonth,
  getLastMonth,
  getThisQuarter,
  getLastQuarter,
  getLast30Days,
  getLast90Days,
  getThisYear,
  getLastYear,
  formatDateRange,
} from "@/utils/dateRangeHelpers";

interface DateRangeFilterProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export const DateRangeFilter = ({
  dateRange,
  onDateRangeChange,
}: DateRangeFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({});

  const handlePresetClick = (range: DateRange) => {
    onDateRangeChange(range);
    setIsOpen(false);
  };

  const handleClearRange = () => {
    onDateRangeChange(undefined);
    setTempRange({});
  };

  const handleCustomRangeApply = () => {
    if (tempRange.from && tempRange.to) {
      onDateRangeChange({
        from: tempRange.from,
        to: new Date(tempRange.to.getTime() + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000),
      });
      setIsOpen(false);
      setTempRange({});
    }
  };

  const presets = [
    { label: "This Month", getValue: getThisMonth },
    { label: "Last Month", getValue: getLastMonth },
    { label: "This Quarter", getValue: getThisQuarter },
    { label: "Last Quarter", getValue: getLastQuarter },
    { label: "Last 30 Days", getValue: getLast30Days },
    { label: "Last 90 Days", getValue: getLast90Days },
    { label: "This Year", getValue: getThisYear },
    { label: "Last Year", getValue: getLastYear },
  ];

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange ? formatDateRange(dateRange) : "Select date range"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div>
              <h4 className="font-medium mb-3">Quick Filters</h4>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetClick(preset.getValue())}
                    className="justify-start"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Custom Range</h4>
              <div className="space-y-3">
                <Calendar
                  mode="range"
                  selected={{ from: tempRange.from, to: tempRange.to }}
                  onSelect={(range) => {
                    setTempRange({
                      from: range?.from,
                      to: range?.to,
                    });
                  }}
                  numberOfMonths={2}
                  disabled={(date) => date > new Date()}
                />
                <Button
                  onClick={handleCustomRangeApply}
                  disabled={!tempRange.from || !tempRange.to}
                  className="w-full"
                >
                  Apply Custom Range
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {dateRange && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearRange}
          className="h-10 w-10"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

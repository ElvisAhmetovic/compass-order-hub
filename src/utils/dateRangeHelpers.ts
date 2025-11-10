import { format } from "date-fns";

export interface DateRange {
  from: Date;
  to: Date;
}

export const getThisMonth = (): DateRange => {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
  };
};

export const getLastMonth = (): DateRange => {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
  };
};

export const getThisQuarter = (): DateRange => {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  return {
    from: new Date(now.getFullYear(), quarter * 3, 1),
    to: new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59),
  };
};

export const getLastQuarter = (): DateRange => {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const lastQuarter = quarter === 0 ? 3 : quarter - 1;
  const year = quarter === 0 ? now.getFullYear() - 1 : now.getFullYear();

  return {
    from: new Date(year, lastQuarter * 3, 1),
    to: new Date(year, lastQuarter * 3 + 3, 0, 23, 59, 59),
  };
};

export const getLast30Days = (): DateRange => {
  const now = new Date();
  return {
    from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    to: now,
  };
};

export const getLast90Days = (): DateRange => {
  const now = new Date();
  return {
    from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    to: now,
  };
};

export const getThisYear = (): DateRange => {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), 0, 1),
    to: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
  };
};

export const getLastYear = (): DateRange => {
  const now = new Date();
  return {
    from: new Date(now.getFullYear() - 1, 0, 1),
    to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59),
  };
};

export const formatDateRange = (range: DateRange): string => {
  return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`;
};

export const getDateRangeLabel = (range: DateRange): string => {
  const { from, to } = range;
  const isSameMonth = from.getMonth() === to.getMonth() && 
                      from.getFullYear() === to.getFullYear();
  
  if (isSameMonth) {
    return format(from, "MMMM yyyy");
  }
  
  const isSameYear = from.getFullYear() === to.getFullYear();
  if (isSameYear) {
    return `${format(from, "MMM d")} - ${format(to, "MMM d, yyyy")}`;
  }
  
  return formatDateRange(range);
};

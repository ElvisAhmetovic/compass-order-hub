import { UserStatistics } from "@/services/userStatisticsService";
import { DateRange, formatDateRange } from "./dateRangeHelpers";

export const exportToCSV = (data: UserStatistics[], dateRange?: DateRange) => {
  const dateRangeText = dateRange ? formatDateRange(dateRange) : 'All Time';
  
  // CSV Headers with date range info
  const infoRows = [
    'User Statistics Report',
    `Date Range: ${dateRangeText}`,
    `Generated: ${new Date().toLocaleString()}`,
    '', // Empty row
  ];

  const headers = [
    'Name',
    'Email',
    'Role',
    'Lifetime Orders',
    dateRange ? `Orders (${dateRangeText})` : 'Monthly Orders',
    'Weekly Orders',
    'Today Orders',
    'Last Order Date'
  ];

  // Convert data to CSV rows
  const rows = data.map(stat => [
    stat.userName,
    stat.email,
    stat.role,
    stat.lifetimeOrders,
    stat.customPeriodOrders,
    stat.weeklyOrders,
    stat.todayOrders,
    stat.lastOrderDate || 'Never'
  ]);

  // Combine info, headers and rows
  const csvContent = [
    ...infoRows,
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const timestamp = new Date().toISOString().split('T')[0];
  const rangeSlug = dateRange ? dateRangeText.replace(/[^\w]/g, '-') : 'all-time';
  link.setAttribute('href', url);
  link.setAttribute('download', `user-statistics-${rangeSlug}-${timestamp}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

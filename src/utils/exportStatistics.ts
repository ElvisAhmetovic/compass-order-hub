import { UserStatistics } from "@/services/userStatisticsService";

export const exportToCSV = (data: UserStatistics[]) => {
  // CSV Headers
  const headers = [
    'Name',
    'Email',
    'Role',
    'Lifetime Orders',
    'Monthly Orders',
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
    stat.monthlyOrders,
    stat.weeklyOrders,
    stat.todayOrders,
    stat.lastOrderDate || 'Never'
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `user-statistics-${timestamp}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

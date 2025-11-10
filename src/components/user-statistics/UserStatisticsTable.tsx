import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserStatistics } from "@/services/userStatisticsService";
import { formatDate } from "@/lib/utils";
import { DateRange, getDateRangeLabel } from "@/utils/dateRangeHelpers";

type SortField = 'userName' | 'lifetimeOrders' | 'monthlyOrders' | 'weeklyOrders' | 'todayOrders' | 'customPeriodOrders';
type SortDirection = 'asc' | 'desc' | null;

interface UserStatisticsTableProps {
  data: UserStatistics[];
  dateRange?: DateRange;
}

export const UserStatisticsTable = ({ data, dateRange }: UserStatisticsTableProps) => {
  const [sortField, setSortField] = useState<SortField>('lifetimeOrders');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection(null);
        setSortField('userName');
      } else {
        setSortDirection('desc');
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortDirection) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    return sortDirection === 'asc' 
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'agent':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    if (sortDirection === 'asc') return <ArrowUp className="ml-2 h-4 w-4" />;
    if (sortDirection === 'desc') return <ArrowDown className="ml-2 h-4 w-4" />;
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No user statistics found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead 
              className="cursor-pointer select-none"
              onClick={() => handleSort('lifetimeOrders')}
            >
              <div className="flex items-center">
                Lifetime Orders
                <SortIcon field="lifetimeOrders" />
              </div>
            </TableHead>
            {dateRange ? (
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('customPeriodOrders')}
              >
                <div className="flex items-center">
                  <div className="flex flex-col">
                    <span>Selected Period</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {getDateRangeLabel(dateRange)}
                    </span>
                  </div>
                  <SortIcon field="customPeriodOrders" />
                </div>
              </TableHead>
            ) : (
              <>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('monthlyOrders')}
                >
                  <div className="flex items-center">
                    Monthly
                    <SortIcon field="monthlyOrders" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('weeklyOrders')}
                >
                  <div className="flex items-center">
                    Weekly
                    <SortIcon field="weeklyOrders" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('todayOrders')}
                >
                  <div className="flex items-center">
                    Today
                    <SortIcon field="todayOrders" />
                  </div>
                </TableHead>
              </>
            )}
            <TableHead>Last Order</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((stat, index) => (
            <TableRow key={stat.userId}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(stat.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{stat.userName}</div>
                    <div className="text-xs text-muted-foreground">{stat.email}</div>
                  </div>
                  {index < 3 && stat.lifetimeOrders > 0 && (
                    <span className="text-lg">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(stat.role)}>
                  {stat.role}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold">{stat.lifetimeOrders}</TableCell>
              {dateRange ? (
                <TableCell className="font-semibold text-primary">
                  {stat.customPeriodOrders}
                </TableCell>
              ) : (
                <>
                  <TableCell>{stat.monthlyOrders}</TableCell>
                  <TableCell>{stat.weeklyOrders}</TableCell>
                  <TableCell>{stat.todayOrders}</TableCell>
                </>
              )}
              <TableCell className="text-muted-foreground text-sm">
                {stat.lastOrderDate ? formatDate(stat.lastOrderDate) : 'Never'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

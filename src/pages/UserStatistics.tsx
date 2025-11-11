import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserStatistics } from "@/services/userStatisticsService";
import { UserStatisticsTable } from "@/components/user-statistics/UserStatisticsTable";
import { StatisticsFilters } from "@/components/user-statistics/StatisticsFilters";
import { exportToCSV } from "@/utils/exportStatistics";
import { useToast } from "@/hooks/use-toast";
import { DateRange, getDateRangeLabel } from "@/utils/dateRangeHelpers";

const UserStatistics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const { data: statistics, isLoading, error } = useQuery({
    queryKey: ['user-statistics', dateRange],
    queryFn: () => getUserStatistics(dateRange?.from, dateRange?.to),
    refetchInterval: 60000, // Refresh every minute
  });

  const filteredData = useMemo(() => {
    if (!statistics) return [];

    return statistics.filter(stat => {
      const matchesSearch = 
        stat.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stat.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || stat.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [statistics, searchTerm, roleFilter]);

  const periodLabel = useMemo(() => {
    if (!dateRange) return "This Month";
    return getDateRangeLabel(dateRange);
  }, [dateRange]);

  const periodOrders = useMemo(() => {
    if (!filteredData) return 0;
    return filteredData.reduce((sum, stat) => sum + stat.customPeriodOrders, 0);
  }, [filteredData]);

  const handleExport = () => {
    if (!filteredData || filteredData.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no statistics to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      exportToCSV(filteredData, dateRange);
      toast({
        title: "Export successful",
        description: `Exported ${filteredData.length} user statistics to CSV.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export statistics. Please try again.",
        variant: "destructive",
      });
    }
  };

  const totalOrders = useMemo(() => {
    if (!filteredData) return 0;
    return filteredData.reduce((sum, stat) => sum + stat.lifetimeOrders, 0);
  }, [filteredData]);


  const weeklyOrders = useMemo(() => {
    if (!filteredData) return 0;
    return filteredData.reduce((sum, stat) => sum + stat.weeklyOrders, 0);
  }, [filteredData]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role}>
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">User Statistics</h1>
                <p className="text-muted-foreground">
                  Comprehensive performance metrics for all team members
                </p>
              </div>
              <Button onClick={handleExport} disabled={!filteredData || filteredData.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Lifetime Orders</CardDescription>
                  <CardTitle className="text-3xl">{totalOrders}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Orders - {periodLabel}</CardDescription>
                  <CardTitle className="text-3xl">{periodOrders}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Orders This Week</CardDescription>
                  <CardTitle className="text-3xl">{weeklyOrders}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>
                  Click column headers to sort. Search and filter to refine results.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StatisticsFilters
                  searchValue={searchTerm}
                  roleFilter={roleFilter}
                  dateRange={dateRange}
                  onSearchChange={setSearchTerm}
                  onRoleFilterChange={setRoleFilter}
                  onDateRangeChange={setDateRange}
                />

                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12 text-destructive">
                    Failed to load statistics. Please try again later.
                  </div>
                ) : (
                  <UserStatisticsTable data={filteredData} dateRange={dateRange} />
                )}

                {!isLoading && !error && filteredData.length > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    Showing {filteredData.length} of {statistics?.length || 0} users
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default UserStatistics;

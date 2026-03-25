import React, { useState, useEffect, useCallback, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, CalendarRange, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import CreateMonthlyContractModal from "@/components/monthly/CreateMonthlyContractModal";
import MonthlyInstallmentsTable from "@/components/monthly/MonthlyInstallmentsTable";
import {
  monthlyContractService,
  MonthlyContract,
  MonthlyInstallment,
} from "@/services/monthlyContractService";
import { toast } from "@/hooks/use-toast";

const MonthlyPackages: React.FC = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<MonthlyContract[]>([]);
  const [installments, setInstallments] = useState<MonthlyInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin = user?.role === "admin";
  const isAdminOrAgent = user?.role === "admin" || user?.role === "agent";

  const fetchData = useCallback(async () => {
    try {
      const [c, i] = await Promise.all([
        monthlyContractService.getContracts(),
        monthlyContractService.getInstallments(),
      ]);
      setContracts(c);
      setInstallments(i);
    } catch (err: any) {
      toast({ title: "Error loading data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredContracts = useMemo(() => {
    if (!searchTerm.trim()) return contracts;
    const term = searchTerm.toLowerCase();
    return contracts.filter(c =>
      [c.client_name, c.client_email, c.website].some(field =>
        field?.toLowerCase().includes(term)
      )
    );
  }, [contracts, searchTerm]);

  const filteredInstallments = useMemo(() => {
    if (!searchTerm.trim()) return installments;
    const contractIds = new Set(filteredContracts.map(c => c.id));
    return installments.filter(i => contractIds.has(i.contract_id));
  }, [installments, filteredContracts, searchTerm]);

  const totalContracts = filteredContracts.filter((c) => c.status === "active").length;
  const totalPaid = filteredInstallments.filter((i) => i.payment_status === "paid").length;
  const totalUnpaid = filteredInstallments.filter((i) => i.payment_status === "unpaid").length;
  const totalRevenue = filteredInstallments
    .filter((i) => i.payment_status === "paid")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex">
        <Layout>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarRange className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Monthly Packages</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage yearly contracts with monthly billing
                  </p>
                </div>
              </div>
              {isAdminOrAgent && (
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Contract
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Active Contracts</p>
                <p className="text-2xl font-bold text-foreground">{totalContracts}</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Paid Installments</p>
                <p className="text-2xl font-bold text-green-600">{totalPaid}</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Open Installments</p>
                <p className="text-2xl font-bold text-red-600">{totalUnpaid}</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Revenue (paid)</p>
                <p className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
                    totalRevenue
                  )}
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client name, email or website..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 max-w-md"
              />
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <MonthlyInstallmentsTable
                contracts={filteredContracts}
                installments={filteredInstallments}
                onRefresh={fetchData}
                isAdmin={isAdmin}
                currentUserName={user?.full_name || user?.email || "Unknown"}
              />
            )}

            <CreateMonthlyContractModal
              open={showCreate}
              onOpenChange={setShowCreate}
              onCreated={fetchData}
            />
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default MonthlyPackages;

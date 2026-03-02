import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Trash2, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  monthlyContractService,
  MonthlyContract,
  MonthlyInstallment,
} from "@/services/monthlyContractService";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  contracts: MonthlyContract[];
  installments: MonthlyInstallment[];
  onRefresh: () => void;
  isAdmin: boolean;
}

const MonthlyInstallmentsTable: React.FC<Props> = ({
  contracts,
  installments,
  onRefresh,
  isAdmin,
}) => {
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const toggleExpand = (contractId: string) => {
    setExpandedContracts((prev) => {
      const next = new Set(prev);
      if (next.has(contractId)) next.delete(contractId);
      else next.add(contractId);
      return next;
    });
  };

  const handleToggleStatus = async (installment: MonthlyInstallment) => {
    const newStatus = installment.payment_status === "paid" ? "unpaid" : "paid";
    setTogglingIds((prev) => new Set(prev).add(installment.id));
    try {
      await monthlyContractService.togglePaymentStatus(installment.id, newStatus);
      toast({
        title: newStatus === "paid" ? "Als bezahlt markiert" : "Als unbezahlt markiert",
      });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(installment.id);
        return next;
      });
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    try {
      await monthlyContractService.deleteContract(contractId);
      toast({ title: "Vertrag gelöscht" });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    }
  };

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: currency || "EUR" }).format(amount);

  const getContractInstallments = (contractId: string) =>
    installments.filter((i) => i.contract_id === contractId);

  const getPaidCount = (contractId: string) =>
    getContractInstallments(contractId).filter((i) => i.payment_status === "paid").length;

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Noch keine Monatsverträge vorhanden. Erstellen Sie einen neuen Vertrag.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => {
        const contractInstallments = getContractInstallments(contract.id);
        const paidCount = getPaidCount(contract.id);
        const totalMonths = contract.duration_months;
        const progressPercent = totalMonths > 0 ? (paidCount / totalMonths) * 100 : 0;
        const isExpanded = expandedContracts.has(contract.id);

        return (
          <div key={contract.id} className="border rounded-lg overflow-hidden bg-card">
            {/* Contract header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => toggleExpand(contract.id)}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <div className="font-semibold text-foreground">{contract.client_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {contract.client_email}
                    {contract.website && (
                      <>
                        {" · "}
                        <a
                          href={contract.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {contract.website} <ExternalLink className="w-3 h-3" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {formatPrice(contract.monthly_amount, contract.currency)} / Monat
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Gesamt: {formatPrice(contract.total_value, contract.currency)}
                  </div>
                </div>

                <div className="w-40">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">
                      {paidCount} / {totalMonths} bezahlt
                    </span>
                    <span className="font-medium">{Math.round(progressPercent)}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>

                <Badge
                  variant={
                    contract.status === "active"
                      ? "default"
                      : contract.status === "completed"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {contract.status === "active"
                    ? "Aktiv"
                    : contract.status === "completed"
                    ? "Abgeschlossen"
                    : "Storniert"}
                </Badge>

                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Vertrag löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Dies löscht den Vertrag und alle zugehörigen Raten unwiderruflich.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteContract(contract.id)}>
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* Installments table */}
            {isExpanded && (
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Monat</TableHead>
                      <TableHead>Fällig am</TableHead>
                      <TableHead>Betrag</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Bezahlt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractInstallments.map((inst) => {
                      const isPaid = inst.payment_status === "paid";
                      return (
                        <TableRow
                          key={inst.id}
                          className={cn(
                            isPaid
                              ? "bg-green-500/5 hover:bg-green-500/10"
                              : "bg-red-500/5 hover:bg-red-500/10"
                          )}
                        >
                          <TableCell className="font-medium">{inst.month_label}</TableCell>
                          <TableCell>
                            {new Date(inst.due_date).toLocaleDateString("de-DE")}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatPrice(inst.amount, inst.currency)}
                          </TableCell>
                          <TableCell>
                            {inst.email_sent ? (
                              <Badge variant="secondary" className="text-xs">
                                Gesendet
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Ausstehend
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isPaid ? "default" : "destructive"}>
                              {isPaid ? "Bezahlt" : "Unbezahlt"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Switch
                              checked={isPaid}
                              disabled={togglingIds.has(inst.id)}
                              onCheckedChange={() => handleToggleStatus(inst)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MonthlyInstallmentsTable;

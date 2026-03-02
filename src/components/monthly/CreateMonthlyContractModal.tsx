import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { monthlyContractService } from "@/services/monthlyContractService";
import { useAuth } from "@/context/AuthContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const CreateMonthlyContractModal: React.FC<Props> = ({ open, onOpenChange, onCreated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    website: "",
    total_value: "",
    currency: "EUR",
    start_date: new Date().toISOString().split("T")[0],
    duration_months: "12",
    description: "",
  });

  const totalValue = parseFloat(form.total_value) || 0;
  const durationMonths = parseInt(form.duration_months) || 12;
  const monthlyAmount = durationMonths > 0 ? totalValue / durationMonths : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name || !form.client_email || !form.total_value || !form.start_date) {
      toast({ title: "Pflichtfelder ausfüllen", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await monthlyContractService.createContract(
        {
          client_name: form.client_name,
          client_email: form.client_email,
          website: form.website || null,
          total_value: totalValue,
          currency: form.currency,
          start_date: form.start_date,
          duration_months: durationMonths,
          status: "active",
          description: form.description || null,
          created_by: user?.id || null,
        },
        user?.id || ""
      );

      toast({ title: "Vertrag erstellt", description: `${durationMonths} Raten wurden generiert.` });
      onCreated();
      onOpenChange(false);
      setForm({
        client_name: "",
        client_email: "",
        website: "",
        total_value: "",
        currency: "EUR",
        start_date: new Date().toISOString().split("T")[0],
        duration_months: "12",
        description: "",
      });
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: form.currency }).format(value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Neuen Monatsvertrag erstellen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kundenname *</Label>
              <Input
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                placeholder="Firmenname"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>E-Mail *</Label>
              <Input
                type="email"
                value={form.client_email}
                onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                placeholder="kunde@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://www.example.com"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Gesamtwert *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.total_value}
                onChange={(e) => setForm({ ...form, total_value: e.target.value })}
                placeholder="1200"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Währung</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                  <SelectItem value="BAM">BAM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Laufzeit (Monate)</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={form.duration_months}
                onChange={(e) => setForm({ ...form, duration_months: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Startdatum *</Label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Beschreibung</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optionale Vertragsbeschreibung..."
              rows={2}
            />
          </div>

          {totalValue > 0 && (
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <p className="text-sm text-muted-foreground">Monatliche Rate</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(monthlyAmount)}</p>
              <p className="text-xs text-muted-foreground">
                {durationMonths} Raten × {formatPrice(monthlyAmount)} = {formatPrice(totalValue)}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Erstelle..." : "Vertrag erstellen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMonthlyContractModal;

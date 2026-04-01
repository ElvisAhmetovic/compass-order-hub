import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { supabase } from "@/integrations/supabase/client";
import OrderSearchDropdown from "@/components/dashboard/OrderSearchDropdown";
import InventoryItemsSelector, { SelectedInventoryItem } from "@/components/dashboard/InventoryItemsSelector";
import { Order } from "@/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  clientName: z.string().min(1, "Company name is required"),
  clientEmail: z.string().email("Invalid email address"),
  website: z.string().optional(),
  companyAddress: z.string().optional(),
  contactPhone: z.string().optional(),
  companyLink: z.string().optional(),
  totalValue: z.coerce.number().min(0.01, "Total value must be greater than 0"),
  currency: z.string().default("EUR"),
  durationMonths: z.coerce.number().min(1).max(60).default(12),
  billingFrequency: z.coerce.number().min(1).max(12).default(1),
  startDate: z.string().min(1, "Start date is required"),
  priority: z.string().default("medium"),
  assignedTo: z.string().optional(),
  description: z.string().optional(),
  internalNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface User {
  id: string;
  full_name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const CreateMonthlyContractModal: React.FC<Props> = ({ open, onOpenChange, onCreated }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<SelectedInventoryItem[]>([]);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatPercentage, setVatPercentage] = useState(19);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      website: "",
      companyAddress: "",
      contactPhone: "",
      companyLink: "",
      totalValue: 0,
      currency: "EUR",
      durationMonths: 12,
      billingFrequency: 1,
      startDate: new Date().toISOString().split("T")[0],
      priority: "medium",
      assignedTo: "",
      description: "",
      internalNotes: "",
    },
  });

  const totalValue = form.watch("totalValue") || 0;
  const durationMonths = form.watch("durationMonths") || 12;
  const billingFrequency = form.watch("billingFrequency") || 1;
  const currency = form.watch("currency") || "EUR";
  const numberOfInstallments = durationMonths > 0 && billingFrequency > 0 ? Math.floor(durationMonths / billingFrequency) : 0;
  const installmentAmount = numberOfInstallments > 0 ? totalValue / numberOfInstallments : 0;

  const vatRate = vatPercentage / 100;
  const netTotal = vatEnabled ? Math.round((totalValue / (1 + vatRate)) * 100) / 100 : totalValue;
  const vatAmountTotal = vatEnabled ? Math.round((totalValue - netTotal) * 100) / 100 : 0;
  const netInstallment = numberOfInstallments > 0 ? Math.round((netTotal / numberOfInstallments) * 100) / 100 : 0;
  const vatInstallment = numberOfInstallments > 0 ? Math.round((vatAmountTotal / numberOfInstallments) * 100) / 100 : 0;

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(value);

  useEffect(() => {
    if (!open) return;
    const loadUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .order("first_name");
        if (error) return;
        setUsers(
          data.map((p) => ({
            id: p.id,
            full_name: `${p.first_name} ${p.last_name}`.trim() || "Unknown User",
          }))
        );
      } catch {}
    };
    loadUsers();
  }, [open]);

  useEffect(() => {
    if (open && user) {
      form.setValue("assignedTo", user.id);
      setSelectedInventoryItems([]);
      setVatEnabled(false);
      setVatPercentage(19);
    }
  }, [open, user, form]);

  const handleOrderAutofill = (selectedOrder: Order) => {
    form.setValue("clientName", selectedOrder.company_name);
    form.setValue("clientEmail", selectedOrder.contact_email || "");
    form.setValue("companyAddress", selectedOrder.company_address || "");
    form.setValue("contactPhone", selectedOrder.contact_phone || "");
    form.setValue("companyLink", selectedOrder.company_link || "");
    form.setValue("currency", selectedOrder.currency || "EUR");
    form.setValue("priority", selectedOrder.priority || "medium");
    form.setValue("website", selectedOrder.company_link || "");
    // Reset order-specific fields
    form.setValue("totalValue", 0);
    form.setValue("description", "");
    form.setValue("internalNotes", "");
    setSelectedInventoryItems([]);
    toast({
      title: "Company information filled",
      description: `Autofilled from: ${selectedOrder.company_name}`,
    });
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const assignedUser = users.find((u) => u.id === values.assignedTo);
      const assignedToName = assignedUser?.full_name || (values.assignedTo === user.id ? user.full_name : "");

      await monthlyContractService.createContract(
        {
          client_name: values.clientName,
          client_email: values.clientEmail,
          website: values.website || null,
          total_value: values.totalValue,
          currency: values.currency,
          start_date: values.startDate,
          duration_months: values.durationMonths,
          status: "active",
          description: values.description || null,
          created_by: user.id,
          company_address: values.companyAddress || null,
          contact_phone: values.contactPhone || null,
          company_link: values.companyLink || null,
          priority: values.priority,
          assigned_to: values.assignedTo || null,
          assigned_to_name: assignedToName || null,
          internal_notes: values.internalNotes || null,
          inventory_items: selectedInventoryItems.length > 0 ? JSON.stringify(selectedInventoryItems) : null,
          billing_frequency: values.billingFrequency,
          vat_enabled: vatEnabled,
          vat_rate: vatEnabled ? vatPercentage / 100 : 0,
        },
        user.id
      );

      // Fire-and-forget: notify team about new contract
      const numInstallments = Math.floor(values.durationMonths / values.billingFrequency);
      const instAmount = numInstallments > 0 ? values.totalValue / numInstallments : 0;
      supabase.functions.invoke('send-monthly-contract-created', {
        body: {
          clientName: values.clientName,
          clientEmail: values.clientEmail,
          clientPhone: values.contactPhone || '',
          totalValue: values.totalValue,
          currency: values.currency,
          durationMonths: values.durationMonths,
          billingFrequency: values.billingFrequency,
          installmentAmount: instAmount,
          numberOfInstallments: numInstallments,
          startDate: values.startDate,
          assignedTo: assignedToName || '',
          description: values.description || '',
          priority: values.priority,
        },
      }).catch((err) => console.error('Failed to send contract notification:', err));

      toast({
        title: "Contract created",
        description: `${values.durationMonths} installments have been generated.`,
      });
      onCreated();
      onOpenChange(false);
      form.reset();
      setSelectedInventoryItems([]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorities = ["low", "medium", "high", "urgent"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto" onFocusOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Monthly Contract</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Fill in the details below to create a new monthly contract</p>

        {/* Autofill */}
        <div className="mb-4">
          <OrderSearchDropdown onOrderSelect={handleOrderAutofill} className="w-full" />
          <p className="text-xs text-muted-foreground mt-1">
            Select an existing order to autofill company information
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <h3 className="text-base font-medium">Company Information</h3>
                <FormField control={form.control} name="clientName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl><Input placeholder="Enter company name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="clientEmail" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email *</FormLabel>
                    <FormControl><Input type="email" placeholder="client@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="companyAddress" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Address</FormLabel>
                    <FormControl><Input placeholder="Street, City, Country" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="contactPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl><Input placeholder="+49..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="companyLink" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Link</FormLabel>
                      <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="website" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl><Input placeholder="https://www.example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <h3 className="text-base font-medium">Contract Details</h3>
                <div className="grid grid-cols-4 gap-4 items-start">
                  <FormField control={form.control} name="totalValue" render={({ field }) => (
                    <FormItem>
                      <div className="min-h-[2.5rem] flex items-end"><FormLabel>Total Value *</FormLabel></div>
                      <FormControl><Input type="number" step="0.01" min="0" placeholder="1200" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem>
                      <div className="min-h-[2.5rem] flex items-end"><FormLabel>Currency</FormLabel></div>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CHF">CHF</SelectItem>
                          <SelectItem value="BAM">BAM</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="durationMonths" render={({ field }) => (
                    <FormItem>
                      <div className="min-h-[2.5rem] flex items-end"><FormLabel>Duration (months)</FormLabel></div>
                      <FormControl><Input type="number" min="1" max="60" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="billingFrequency" render={({ field }) => (
                    <FormItem>
                      <div className="min-h-[2.5rem] flex items-end"><FormLabel>Billing Freq.</FormLabel></div>
                      <FormControl><Input type="number" min="1" max="12" placeholder="1" {...field} /></FormControl>
                      <p className="text-xs text-muted-foreground">Every {billingFrequency} mo.</p>
                      {durationMonths % billingFrequency !== 0 && (
                        <p className="text-xs text-destructive">Must divide duration</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* VAT Toggle */}
                <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Switch checked={vatEnabled} onCheckedChange={setVatEnabled} id="vat-toggle" />
                    <Label htmlFor="vat-toggle" className="text-sm font-medium">VAT %</Label>
                  </div>
                  {vatEnabled && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        step="0.5"
                        value={vatPercentage}
                        onChange={(e) => setVatPercentage(Number(e.target.value) || 0)}
                        className="w-20 h-8"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  )}
                </div>

                {vatEnabled && totalValue > 0 && (
                  <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Netto:</span>
                      <span>{formatPrice(netTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">VAT ({vatPercentage}%):</span>
                      <span>{formatPrice(vatAmountTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t pt-1">
                      <span>Total (Brutto):</span>
                      <span>{formatPrice(totalValue)}</span>
                    </div>
                  </div>
                )}

                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="priority" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {priorities.map((p) => (
                            <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="assignedTo" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="Contract description..." rows={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="internalNotes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl><Textarea placeholder="Notes visible only to team..." rows={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Inventory Items */}
            <div>
              <h3 className="text-base font-medium mb-2">Inventory Items</h3>
              <InventoryItemsSelector
                selectedItems={selectedInventoryItems}
                onItemsChange={setSelectedInventoryItems}
              />
            </div>

            {/* Installment Preview */}
            {totalValue > 0 && numberOfInstallments > 0 && (
              <div className="rounded-lg bg-primary/10 p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {billingFrequency === 1 ? "Monthly Installment" : `Installment (every ${billingFrequency} months)`}
                </p>
                <p className="text-2xl font-bold text-primary">{formatPrice(installmentAmount)}</p>
                <p className="text-xs text-muted-foreground">
                  {numberOfInstallments} installments × {formatPrice(installmentAmount)} = {formatPrice(totalValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Contract duration: {durationMonths} months
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Contract"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMonthlyContractModal;


import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Send, Download, Printer, Eye } from "lucide-react";

const proposalSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  subject: z.string().min(1, "Subject is required"),
  number: z.string().min(1, "Proposal number is required"),
  reference: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  content: z.string().min(1, "Content is required"),
  amount: z.string().min(1, "Amount is required"),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

const ProposalDetail = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      customer: "",
      subject: "Proposal No. 9984",
      number: "AN-9984",
      reference: "",
      date: new Date().toISOString().split('T')[0],
      address: "123 Sample Street\nLLC & City",
      country: "Deutschland",
      content: "Thank you for your enquiry. We will be happy to provide you with the requested non-binding offer.",
      amount: "0.00",
    },
  });

  const onSubmit = (data: ProposalFormValues) => {
    setIsSubmitting(true);
    
    // In a real app, you would save this to your backend
    console.log("Saving proposal:", data);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Proposal saved",
        description: "Your proposal has been saved as a draft.",
      });
      navigate("/proposals");
    }, 1000);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
          <div className="container mx-auto py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate("/proposals")}>
                  <ArrowLeft size={16} />
                </Button>
                <h1 className="text-2xl font-bold">Edit proposal</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  Save as draft
                </Button>
                <Button size="sm" className="bg-blue-600">
                  <Send className="h-4 w-4 mr-1" />
                  Send / Print / Download
                </Button>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    {/* Contact and proposal information section */}
                    <div className="mb-8">
                      <h2 className="text-sm font-semibold bg-gray-100 p-2 mb-4 uppercase">
                        Contact and proposal information
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="customer"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Customer</FormLabel>
                                <FormControl>
                                  <Input placeholder="Search / create contact" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Textarea rows={4} {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Proposal no.</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="date"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Proposal date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="reference"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reference / Order No.</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Proposal content section */}
                    <div className="mb-8">
                      <h2 className="text-sm font-semibold bg-gray-100 p-2 mb-4 uppercase">
                        Proposal Content
                      </h2>
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                rows={6}
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Products section */}
                    <div className="mb-8">
                      <h2 className="text-sm font-semibold bg-gray-100 p-2 mb-4 uppercase">
                        Products
                      </h2>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Line item or service
                              </th>
                              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                                Quantity
                              </th>
                              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                                Price (gross)
                              </th>
                              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">
                                VAT
                              </th>
                              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                                Discount
                              </th>
                              <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                              <td className="px-2 py-3">
                                <Input placeholder="Search product" className="text-sm" />
                              </td>
                              <td className="px-2 py-3">
                                <div className="flex items-center">
                                  <Input type="text" defaultValue="1.00" className="text-sm" />
                                  <span className="ml-1 text-xs">pcs</span>
                                </div>
                              </td>
                              <td className="px-2 py-3">
                                <Input type="text" defaultValue="0.00" className="text-sm text-right" />
                              </td>
                              <td className="px-2 py-3">
                                <Input type="text" defaultValue="19%" className="text-sm" />
                              </td>
                              <td className="px-2 py-3">
                                <div className="flex items-center">
                                  <Input type="text" defaultValue="0" className="text-sm" />
                                  <span className="ml-1 text-xs">%</span>
                                </div>
                              </td>
                              <td className="px-2 py-3 text-right">
                                <div className="flex items-center justify-end">
                                  <Input type="text" defaultValue="0.00" className="text-sm text-right" />
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 flex justify-between">
                        <Button variant="outline" type="button" size="sm" className="text-blue-600">
                          + Add line item
                        </Button>
                      </div>
                    </div>
                    
                    {/* Footer content section */}
                    <div className="mb-8">
                      <h2 className="text-sm font-semibold bg-gray-100 p-2 mb-4 uppercase">
                        Footer content
                      </h2>
                      <Textarea 
                        rows={4}
                        defaultValue="By placing your order, you agree to pay for the services included in this offer within 7 days of receipt of the invoice. The invoice will only be issued after the service has been provided."
                        className="min-h-[80px] w-full"
                      />
                    </div>
                    
                    {/* Summary section */}
                    <div>
                      <div className="flex justify-end">
                        <div className="w-64">
                          <div className="flex justify-between py-1">
                            <span className="text-sm text-gray-700">Net amount (inc. discount/surcharge)</span>
                            <span className="font-medium">€0.00</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-sm text-gray-700">VAT 19%</span>
                            <span className="font-medium">€0.00</span>
                          </div>
                          <div className="flex justify-between py-2 border-t border-gray-200 mt-1">
                            <span className="font-medium">Total</span>
                            <span className="font-bold">€0.00</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => navigate("/proposals")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Proposal"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default ProposalDetail;

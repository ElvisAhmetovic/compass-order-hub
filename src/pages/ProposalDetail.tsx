import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Send, Download, Printer, Eye, Plus, Trash2, FileText, Languages, ToggleLeft, ToggleRight } from "lucide-react";
import { Proposal, InventoryItem } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  downloadProposal, 
  loadInventoryItems,
  generateProposalPDF,
  previewProposalPDF,
  PROPOSAL_LANGUAGES,
  saveCompanyInfo, 
  getCompanyInfo
} from "@/utils/proposalUtils";

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
  currency: z.string().default("EUR"),
  deliveryTerms: z.string().optional(),
  paymentTerms: z.string().optional(),
  internalContact: z.string().default("Thomas Klein"),
  vatRule: z.string().default("umsatzsteuerpflichtig"),
  signatureUrl: z.string().optional(),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  vat: number;
  discount: number;
  amount: number;
}

const ProposalDetail = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "1",
      description: "",
      quantity: 1.0,
      unit: "pcs",
      price: 0.0,
      vat: 19,
      discount: 0,
      amount: 0.0
    }
  ]);
  const [popoverOpen, setPopoverOpen] = useState<{[key: string]: boolean}>({});
  const [searchQuery, setSearchQuery] = useState<{[key: string]: string}>({});
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [signaturePadOpen, setSignaturePadOpen] = useState(false);
  const [isLogoDialogOpen, setIsLogoDialogOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string>("https://placehold.co/200x60?text=Your+Logo");
  const [logoSize, setLogoSize] = useState(33); // Default logo size percentage
  const [selectedCurrency, setSelectedCurrency] = useState("EUR");
  const [currencySymbol, setCurrencySymbol] = useState("€");
  const [isVatEnabled, setIsVatEnabled] = useState(true);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // PDF preview state variables
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLogoSize, setPreviewLogoSize] = useState(33);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const previewContentRef = useRef<HTMLDivElement>(null);

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
      currency: "EUR",
      deliveryTerms: "",
      paymentTerms: "",
      internalContact: "Thomas Klein",
      vatRule: "umsatzsteuerpflichtig",
      signatureUrl: "",
    },
  });

  // When preview is opened, initialize logo size from current setting
  useEffect(() => {
    if (isPreviewOpen) {
      setPreviewLogoSize(logoSize);
      generatePreview();
    }
  }, [isPreviewOpen]);

  // Dynamic preview generator
  const generatePreview = async () => {
    setIsGeneratingPreview(true);
    
    const data = form.getValues();
    const proposalData = {
      ...data,
      lineItems,
      totalAmount,
      vatAmount,
      netAmount,
      vatRate: 19,
      signatureUrl,
      logo: companyLogo,
      logoSize: previewLogoSize // Use preview-specific logo size
    };
    
    try {
      // Create a temporary container for the PDF preview
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '794px'; // A4 width at 96 DPI
      document.body.appendChild(tempContainer);
      
      // Generate PDF content
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add logo with dynamic size
      if (companyLogo) {
        doc.addImage(
          companyLogo, 
          'JPEG', 
          20, 
          20, 
          (previewLogoSize / 100) * 80, // Scale logo based on percentage
          30
        );
      }
      
      // Add proposal content
      doc.setFontSize(22);
      doc.text("PROPOSAL", 20, 60);
      
      doc.setFontSize(12);
      doc.text(`${proposalData.customer}`, 20, 80);
      doc.text(`${proposalData.address}`, 20, 90);
      
      doc.text(`Proposal No: ${proposalData.number}`, 130, 80);
      doc.text(`Date: ${proposalData.date}`, 130, 90);
      
      doc.text(`Subject: ${proposalData.subject}`, 20, 110);
      doc.text(`${proposalData.content}`, 20, 120);
      
      // Add line items table
      let yPos = 150;
      doc.line(20, yPos, 190, yPos);
      yPos += 10;
      
      doc.text("Description", 20, yPos);
      doc.text("Qty", 120, yPos);
      doc.text("Price", 140, yPos);
      doc.text("Amount", 170, yPos);
      
      yPos += 5;
      doc.line(20, yPos, 190, yPos);
      yPos += 10;
      
      lineItems.forEach(item => {
        doc.text(item.description.substring(0, 40), 20, yPos);
        doc.text(item.quantity.toString(), 120, yPos);
        doc.text(`${currencySymbol}${item.price.toFixed(2)}`, 140, yPos);
        doc.text(`${currencySymbol}${item.amount.toFixed(2)}`, 170, yPos);
        yPos += 10;
      });
      
      yPos += 5;
      doc.line(20, yPos, 190, yPos);
      yPos += 10;
      
      // Add totals
      doc.text("Total:", 140, yPos);
      doc.text(`${currencySymbol}${(isVatEnabled ? totalAmount : netAmount).toFixed(2)}`, 170, yPos);
      
      // Add signature if available
      if (signatureUrl) {
        yPos += 30;
        doc.text("Signature:", 20, yPos);
        doc.addImage(signatureUrl, 'PNG', 20, yPos + 5, 50, 20);
      }
      
      // Convert to data URL
      const pdfOutput = doc.output('datauristring');
      setPdfPreviewUrl(pdfOutput);
      
      // Clean up
      document.body.removeChild(tempContainer);
    } catch (error) {
      console.error("Error generating preview:", error);
      toast({
        title: "Preview Error",
        description: "Could not generate PDF preview.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Preview logo size controls
  const decreasePreviewLogoSize = () => {
    const newSize = Math.max(10, previewLogoSize - 5);
    setPreviewLogoSize(newSize);
    generatePreview();
  };

  const increasePreviewLogoSize = () => {
    const newSize = Math.min(100, previewLogoSize + 5);
    setPreviewLogoSize(newSize);
    generatePreview();
  };

  // Apply preview logo size to actual logo size
  const applyPreviewLogoSize = () => {
    setLogoSize(previewLogoSize);
    
    // Save the updated size to company info
    const companyInfo = getCompanyInfo();
    companyInfo.logoSize = previewLogoSize;
    saveCompanyInfo(companyInfo);
    
    toast({
      title: "Logo size updated",
      description: `Logo size updated to ${previewLogoSize}%`,
    });
  };

  // Load company logo and size from saved company info
  useEffect(() => {
    const companyInfo = getCompanyInfo();
    if (companyInfo && companyInfo.logo) {
      setCompanyLogo(companyInfo.logo);
    }
    if (companyInfo && companyInfo.logoSize) {
      setLogoSize(companyInfo.logoSize);
    }
  }, []);

  // Handle logo change
  const handleLogoChange = (logo: string) => {
    setCompanyLogo(logo);
    
    // Save the logo to company info
    const companyInfo = getCompanyInfo();
    companyInfo.logo = logo;
    companyInfo.logoSize = logoSize;
    saveCompanyInfo(companyInfo);
    
    toast({
      title: "Company logo updated",
      description: "Your company logo has been updated successfully.",
    });
  };

  // Function to save logo size to company info and update the component state
  const updateLogoSize = (newSize: number) => {
    setLogoSize(newSize);
    
    // Save the updated size to company info
    const companyInfo = getCompanyInfo();
    companyInfo.logoSize = newSize;
    saveCompanyInfo(companyInfo);
    
    console.log(`Logo size updated to: ${newSize}%`);
  };

  // Decrease logo size
  const decreaseLogoSize = () => {
    const newSize = Math.max(10, logoSize - 5);
    updateLogoSize(newSize);
  };

  // Increase logo size
  const increaseLogoSize = () => {
    const newSize = Math.min(100, logoSize + 5);
    updateLogoSize(newSize);
  };

  // Handle currency change
  useEffect(() => {
    // Update currency symbol when currency changes
    switch (selectedCurrency) {
      case "USD":
        setCurrencySymbol("$");
        break;
      case "GBP":
        setCurrencySymbol("£");
        break;
      case "EUR":
      default:
        setCurrencySymbol("€");
        break;
    }
  }, [selectedCurrency]);

  // Load existing VAT setting when editing a proposal
  useEffect(() => {
    if (id && id !== "new") {
      const savedProposals = localStorage.getItem("proposals");
      if (savedProposals) {
        const proposals: Proposal[] = JSON.parse(savedProposals);
        const existingProposal = proposals.find(p => p.id === id);
        if (existingProposal && existingProposal.vatEnabled !== undefined) {
          setIsVatEnabled(existingProposal.vatEnabled);
        }
      }
    }
  }, [id]);

  // Trigger file input click
  const triggerLogoUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 2MB.",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPEG, PNG, etc.).",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          handleLogoChange(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Signature pad functions
  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.closePath();
    setIsDrawing(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const signatureData = canvas.toDataURL('image/png');
    setSignatureUrl(signatureData);
    form.setValue('signatureUrl', signatureData);
    setSignaturePadOpen(false);
    
    toast({
      title: "Signature saved",
      description: "Your signature has been added to the proposal.",
    });
  };

  const clearSignature = () => {
    initializeCanvas();
  };
  
  // Initialize canvas when signature dialog opens
  useEffect(() => {
    if (signaturePadOpen) {
      initializeCanvas();
    }
  }, [signaturePadOpen]);

  // Load inventory items
  useEffect(() => {
    const items = loadInventoryItems();
    if (items && items.length > 0) {
      console.log("Loaded inventory items:", items.length);
      setInventoryItems(items);
    } else {
      console.warn("No inventory items found in local storage");
    }
  }, []);

  // Load existing proposal if editing
  useEffect(() => {
    if (id && id !== "new") {
      const savedProposals = localStorage.getItem("proposals");
      if (savedProposals) {
        const proposals: Proposal[] = JSON.parse(savedProposals);
        const existingProposal = proposals.find(p => p.id === id);
        if (existingProposal) {
          form.reset({
            customer: existingProposal.customer,
            subject: existingProposal.subject || "Proposal",
            number: existingProposal.number,
            reference: existingProposal.reference,
            date: new Date().toISOString().split('T')[0],
            address: existingProposal.address || "123 Sample Street\nLLC & City",
            country: existingProposal.country || "Deutschland",
            content: existingProposal.content || "Thank you for your enquiry. We will be happy to provide you with the requested non-binding offer.",
            amount: existingProposal.amount,
            currency: "EUR",
            deliveryTerms: "",
            paymentTerms: "",
            internalContact: "Thomas Klein",
            vatRule: "umsatzsteuerpflichtig",
            signatureUrl: "",
          });
          
          // If proposal has line items, load them
          if (existingProposal.lineItems && existingProposal.lineItems.length > 0) {
            const formattedLineItems = existingProposal.lineItems.map(item => ({
              id: item.id,
              description: item.name,
              quantity: item.quantity,
              unit: item.unit || "pcs",
              price: item.unit_price,
              vat: 19,
              discount: 0,
              amount: item.total_price
            }));
            setLineItems(formattedLineItems);
          }
        }
      }
    }
  }, [id, form]);

  const togglePopover = (itemId: string) => {
    setPopoverOpen(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleSearchChange = (itemId: string, value: string) => {
    setSearchQuery(prev => ({
      ...prev,
      [itemId]: value
    }));
    
    // Open the popover when search has content
    if (value.length > 0 && !popoverOpen[itemId]) {
      togglePopover(itemId);
    }
  };

  // Filter inventory items based on search query
  const getFilteredItems = (itemId: string) => {
    const query = searchQuery[itemId] || "";
    if (!query.trim()) return inventoryItems.slice(0, 10); // Show first 10 items if no search query
    
    return inventoryItems
      .filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) || 
        item.id.toString().toLowerCase().includes(query.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
      )
      .slice(0, 10); // Limit to first 10 matches
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1.0,
      unit: "pcs",
      price: 0.0,
      vat: 19,
      discount: 0,
      amount: 0.0
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Recalculate amount when quantity, price, or discount changes
        if (field === 'quantity' || field === 'price' || field === 'discount') {
          const baseAmount = updatedItem.quantity * updatedItem.price;
          const discountAmount = baseAmount * (updatedItem.discount / 100);
          updatedItem.amount = baseAmount - discountAmount;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const selectInventoryItem = (itemId: string, lineItemId: string) => {
    const selectedItem = inventoryItems.find(item => item.id === itemId);
    if (selectedItem) {
      setLineItems(lineItems.map(item => {
        if (item.id === lineItemId) {
          const price = typeof selectedItem.price === 'string' 
            ? parseFloat(selectedItem.price.replace(/[^\d.-]/g, '') || '0') 
            : selectedItem.price;
            
          return {
            ...item,
            description: selectedItem.name,
            price: price || 0,
            unit: selectedItem.unit || "Stk",
            amount: price * item.quantity
          };
        }
        return item;
      }));
    }
    setPopoverOpen(prev => ({
      ...prev,
      [lineItemId]: false
    }));
  };

  // Update the saveProposal function to include VAT status
  const saveProposal = (data: ProposalFormValues, status: string = "Draft") => {
    const savedProposals = localStorage.getItem("proposals");
    const proposals: Proposal[] = savedProposals ? JSON.parse(savedProposals) : [];
    
    // Convert line items to proposal line items
    const proposalLineItems = lineItems.map(item => ({
      id: item.id,
      proposal_id: id === "new" ? uuidv4() : id!,
      item_id: item.id,
      name: item.description,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.amount,
      unit: item.unit,
      created_at: new Date().toISOString()
    }));
    
    const proposalData: Proposal = {
      id: id === "new" ? uuidv4() : id!,
      reference: data.reference || `REF-${new Date().getFullYear()}-${String(proposals.length + 1).padStart(3, '0')}`,
      number: data.number,
      customer: data.customer,
      subject: data.subject,
      amount: totalAmount.toFixed(2),
      status: status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lineItems: proposalLineItems,
      address: data.address,
      country: data.country,
      content: data.content,
      totalAmount: totalAmount,
      currency: selectedCurrency,
      vatEnabled: isVatEnabled // Save VAT enabled state
    };

    if (id === "new") {
      proposals.push(proposalData);
    } else {
      const index = proposals.findIndex(p => p.id === id);
      if (index >= 0) {
        proposals[index] = { ...proposals[index], ...proposalData };
      } else {
        proposals.push(proposalData);
      }
    }

    localStorage.setItem("proposals", JSON.stringify(proposals));
    return proposalData;
  };

  // Modified previewProposal to open our new preview dialog
  const previewProposal = () => {
    setIsPreviewOpen(true);
  };

  const saveAsDraft = () => {
    const data = form.getValues();
    saveProposal(data, "Draft");
    toast({
      title: "Proposal saved",
      description: "Your proposal has been saved as a draft.",
    });
  };

  const sendProposal = () => {
    const data = form.getValues();
    if (!data.customer || !data.subject) {
      toast({
        title: "Missing information",
        description: "Please fill in customer and subject fields.",
        variant: "destructive",
      });
      return;
    }
    
    saveProposal(data, "Sent");
    toast({
      title: "Proposal sent",
      description: "Your proposal has been sent to the customer.",
    });
  };

  const onSubmit = (data: ProposalFormValues) => {
    setIsSubmitting(true);
    
    try {
      saveProposal(data, "Draft");
      toast({
        title: "Proposal saved",
        description: "Your proposal has been saved successfully.",
      });
      navigate("/proposals");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save proposal.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recalculate amounts based on VAT status
  const calculateVatAmount = () => {
    if (!isVatEnabled) return 0;
    return lineItems.reduce((sum, item) => sum + (item.amount * item.vat / 100), 0);
  };

  const vatAmount = calculateVatAmount();
  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const netAmount = totalAmount - vatAmount;

  // Fix for the Company Logo button - ensure it opens the dialog
  const handleLogoButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLogoDialogOpen(true);
    console.log("Opening logo dialog");
  };

  // Function to handle downloading proposal as text
  const handleDownloadProposal = () => {
    const data = form.getValues();
    const proposalData = {
      ...data,
      lineItems,
      totalAmount,
      vatAmount,
      netAmount
    };
    
    downloadProposal(proposalData);
    
    toast({
      title: "Proposal downloaded",
      description: "Your proposal has been downloaded as a text file.",
    });
  };

  // Function to handle printing the proposal
  const printProposal = () => {
    const data = form.getValues();
    const proposalData = {
      ...data,
      lineItems,
      totalAmount,
      vatAmount,
      netAmount,
      vatRate: 19,
      signatureUrl,
      logo: companyLogo,
      logoSize: logoSize
    };
    
    // Generate PDF and then print it
    const doc = new jsPDF();
    
    // Add content to PDF
    doc.text("Proposal", 20, 20);
    doc.text(`Customer: ${proposalData.customer}`, 20, 30);
    doc.text(`Subject: ${proposalData.subject}`, 20, 40);
    doc.text(`Total Amount: ${currencySymbol}${totalAmount.toFixed(2)}`, 20, 50);
    
    // Print the document
    doc.autoPrint();
    doc.output('dataurlnewwindow');
    
    toast({
      title: "Printing proposal",
      description: "Your proposal has been sent to your printer.",
    });
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
                <h1 className="text-2xl font-bold">{id === "new" ? "Create proposal" : "Edit proposal"}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={previewProposal}>
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" onClick={saveAsDraft}>
                  <Save className="h-4 w-4 mr-1" />
                  Save as draft
                </Button>
                <div className="flex items-center">
                  <Button size="sm" className="bg-blue-600 rounded-r-none" onClick={sendProposal}>
                    <Send className="h-4 w-4 mr-1" />
                    Send
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-l-none border-l-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={handleGeneratePDF}>
                          <FileText className="h-4 w-4 mr-2" />
                          Download as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDownloadProposal}>
                          <Download className="h-4 w-4 mr-2" />
                          Download as Text
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={printProposal}>
                          <Printer className="h-4 w-4 mr-2" />
                          Print
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* PDF Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Proposal Preview</DialogTitle>
                  <DialogDescription>
                    Preview how your proposal will look as a PDF.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col h-[600px]">
                  {/* Controls */}
                  <div className="flex justify-between items-center p-2 bg-gray-50 border-b">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Language:</span>
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROPOSAL_LANGUAGES.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Logo Size:</span>
                        <Button variant="outline" size="sm" onClick={decreasePreviewLogoSize} className="h-8 w-8 p-0">
                          -
                        </Button>
                        <span className="text-sm w-10 text-center">{previewLogoSize}%</span>
                        <Button variant="outline" size="sm" onClick={increasePreviewLogoSize} className="h-8 w-8 p-0">
                          +
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={applyPreviewLogoSize}
                        className="text-xs"
                      >
                        Apply Size
                      </Button>
                      <Button 
                        onClick={downloadPreviewPDF}
                        className="bg-green-600"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                  
                  {/* PDF Preview */}
                  <div 
                    className="flex-1 overflow-auto bg-gray-200 flex justify-center p-4"
                    ref={previewContentRef}
                  >
                    {isGeneratingPreview ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                      </div>
                    ) : pdfPreviewUrl ? (
                      <iframe 
                        src={pdfPreviewUrl}
                        className="w-full h-full bg-white shadow-lg"
                        title="PDF Preview"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p>No preview available. Click "Apply Size" to refresh.</p>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Logo Dialog */}
            <Dialog open={isLogoDialogOpen} onOpenChange={setIsLogoDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Your company logo</DialogTitle>
                  <DialogDescription>
                    Select your company logo to display on proposals.
                  </DialogDescription>
                </DialogHeader>
                <div className="border border-gray-200 rounded-md p-4 flex flex-col items-center">
                  <div className="border border-dashed border-gray-300 rounded-md p-4 mb-4 w-full flex justify-center">
                    <img 
                      src={companyLogo} 
                      alt="Company Logo" 
                      className="max-h-32 object-contain" 
                      style={{ 
                        maxWidth: `${logoSize}%`,
                        height: 'auto'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://placehold.co/200x60?text=Your+Logo";
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-4 w-full">
                    <span className="text-sm font-medium">Size</span>
                    <Button variant="outline" size="sm" onClick={decreaseLogoSize} className="h-8 w-8 p-0">
                      -
                    </Button>
                    <span className="text-sm w-10 text-center">{logoSize}%</span>
                    <Button variant="outline" size="sm" onClick={increaseLogoSize} className="h-8 w-8 p-0">
                      +
                    </Button>
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  
                  {/* Custom button to trigger file upload */}
                  <div className="w-full flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      onClick={triggerLogoUpload} 
                      className="w-full"
                    >
                      Upload company logo
                    </Button>
                    
                    <div className="text-xs text-gray-500 text-center">
                      Recommended size: 200x60px, Max: 2MB, Formats: PNG, JPG
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsLogoDialogOpen(false)}>Save Logo</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Signature Dialog */}
            <Dialog open={signaturePadOpen} onOpenChange={setSignaturePadOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add your signature</DialogTitle>
                  <DialogDescription>
                    Draw your signature below. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <div className="border border-gray-300 rounded-md p-2">
                  <canvas
                    ref={canvasRef}
                    width={450}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="bg-white cursor-crosshair"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={clearSignature}>Clear</Button>
                  <Button onClick={saveSignature}>Save Signature</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    {/* Language and Company Logo Selection */}
                    <div className="mb-4 flex justify-between">
                      {/* Language Selector */}
                      <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        <span className="text-sm">PDF Language:</span>
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROPOSAL_LANGUAGES.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Fixed Company Logo Button - using our new handler */}
                      <Button 
                        variant="outline" 
                        onClick={handleLogoButtonClick}
                        type="button"
                        className="flex items-center gap-2"
                      >
                        <img 
                          src={companyLogo} 
                          alt="Company Logo" 
                          className="h-5 w-auto" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/200x60?text=Your+Logo";
                          }}
                        />
                        <span>Edit Company Logo</span>
                      </Button>
                    </div>

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
                    
                    {/* Products section with VAT toggle */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center bg-gray-100 p-2 mb-4">
                        <h2 className="text-sm font-semibold uppercase">
                          Products
                        </h2>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="vat-toggle" className="text-xs font-medium">
                            {isVatEnabled ? 'VAT Enabled' : 'VAT Disabled'}
                          </Label>
                          <div 
                            className="flex items-center cursor-pointer"
                            onClick={() => setIsVatEnabled(!isVatEnabled)}
                          >
                            {isVatEnabled ? (
                              <ToggleRight className="h-5 w-5 text-blue-600" />
                            ) : (
                              <ToggleLeft className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
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
                              {/* Conditionally render VAT header based on VAT enabled state */}
                              {isVatEnabled && (
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">
                                  VAT
                                </th>
                              )}
                              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                                Discount
                              </th>
                              <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                                Amount
                              </th>
                              <th className="px-2 py-3 w-[50px]"></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {lineItems.map((item, index) => (
                              <tr key={item.id}>
                                <td className="px-2 py-3">
                                  <Popover 
                                    open={popoverOpen[item.id] || false} 
                                    onOpenChange={() => togglePopover(item.id)}
                                  >
                                    <PopoverTrigger asChild>
                                      <Input 
                                        placeholder="Search product" 
                                        className="text-sm"
                                        value={item.description}
                                        onChange={(e) => {
                                          updateLineItem(item.id, 'description', e.target.value);
                                          handleSearchChange(item.id, e.target.value);
                                        }}
                                      />
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0 w-80" align="start">
                                      <Command>
                                        <CommandInput 
                                          placeholder="Search products..." 
                                          value={searchQuery[item.id] || ''}
                                          onValueChange={(value) => handleSearchChange(item.id, value)}
                                        />
                                        <CommandList>
                                          <CommandEmpty>No products found.</CommandEmpty>
                                          <CommandGroup>
                                            {getFilteredItems(item.id).map((invItem) => (
                                              <CommandItem 
                                                key={invItem.id} 
                                                onSelect={() => selectInventoryItem(invItem.id, item.id)}
                                                className="cursor-pointer"
                                              >
                                                <div className="flex flex-col">
                                                  <span className="font-medium">{invItem.name}</span>
                                                  <div className="flex justify-between text-xs text-gray-500">
                                                    <span>#{invItem.id}</span>
                                                    <span>{invItem.price} {typeof invItem.price === 'string' && !invItem.price.includes('EUR') ? 'EUR' : ''}</span>
                                                  </div>
                                                </div>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </td>
                                <td className="px-2 py-3">
                                  <div className="flex items-center">
                                    <Input 
                                      type="number" 
                                      step="0.01"
                                      value={item.quantity}
                                      onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                      className="text-sm" 
                                    />
                                    <span className="ml-1 text-xs">{item.unit}</span>
                                  </div>
                                </td>
                                <td className="px-2 py-3">
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    value={item.price}
                                    onChange={(e) => updateLineItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                    className="text-sm text-right" 
                                  />
                                </td>
                                {/* Conditionally render VAT cell based on VAT enabled state */}
                                {isVatEnabled && (
                                  <td className="px-2 py-3">
                                    <Input 
                                      type="text" 
                                      value={`${item.vat}%`}
                                      onChange={(e) => updateLineItem(item.id, 'vat', parseInt(e.target.value) || 19)}
                                      className="text-sm" 
                                    />
                                  </td>
                                )}
                                <td className="px-2 py-3">
                                  <div className="flex items-center">
                                    <Input 
                                      type="number" 
                                      value={item.discount}
                                      onChange={(e) => updateLineItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                      className="text-sm" 
                                    />
                                    <span className="ml-1 text-xs">%</span>
                                  </div>
                                </td>
                                <td className="px-2 py-3 text-right">
                                  <div className="flex items-center justify-end">
                                    <span className="text-sm font-medium">{currencySymbol}{item.amount.toFixed(2)}</span>
                                  </div>
                                </td>
                                <td className="px-2 py-3">
                                  {lineItems.length > 1 && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => removeLineItem(item.id)}
                                      className="h-6 w-6"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 flex justify-between">
                        <Button variant="outline" type="button" size="sm" className="text-blue-600" onClick={addLineItem}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add line item
                        </Button>
                      </div>
                    </div>
                    
                    {/* Signature Section */}
                    <div className="mb-8">
                      <h2 className="text-sm font-semibold bg-gray-100 p-2 mb-4 uppercase">
                        Signature
                      </h2>
                      <div className="flex items-start gap-6">
                        <div className="flex-1">
                          <Button 
                            variant="outline" 
                            type="button" 
                            onClick={() => setSignaturePadOpen(true)} 
                            className="mb-2 w-full"
                          >
                            Add Signature
                          </Button>
                          {signatureUrl && (
                            <div className="border border-gray-200 rounded p-4 mt-2 bg-gray-50">
                              <img src={signatureUrl} alt="Signature" className="max-h-24" />
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  setSignatureUrl(null);
                                  form.setValue('signatureUrl', '');
                                }} 
                                className="mt-2"
                              >
                                Clear Signature
                              </Button>
                            </div>
                          )}
                        </div>
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

                    {/* Options section */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold bg-gray-100 p-2 uppercase">
                          More Options
                        </h2>
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          Hide options
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Currency */}
                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Currency</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setSelectedCurrency(value);
                                }} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="EUR">EUR</SelectItem>
                                  <SelectItem value="USD">USD</SelectItem>
                                  <SelectItem value="GBP">GBP</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        {/* Internal contact person */}
                        <FormField
                          control={form.control}
                          name="internalContact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Internal contact person</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select contact" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Thomas Klein">Thomas Klein</SelectItem>
                                  <SelectItem value="Maria Schmidt">Maria Schmidt</SelectItem>
                                  <SelectItem value="John Doe">John Doe</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        {/* VAT rule */}
                        <FormField
                          control={form.control}
                          name="vatRule"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>VAT rule</FormLabel>
                              <FormControl>
                                <div className="space-y-3">
                                  <div className="font-medium text-sm">In Germany</div>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="space-y-2"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="umsatzsteuerpflichtig" id="r1" />
                                      <Label htmlFor="r1" className="text-sm">Umsatzsteuerpflichtige Umsätze</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="steuerfreie" id="r2" />
                                      <Label htmlFor="r2" className="text-sm">Steuerfreie Umsätze §4 UStG</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="reverse-charge" id="r3" />
                                      <Label htmlFor="r3" className="text-sm">Reverse Charge gem. §13b UStG</Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* Delivery terms */}
                        <FormField
                          control={form.control}
                          name="deliveryTerms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delivery terms</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter delivery terms" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* Payment terms */}
                        <FormField
                          control={form.control}
                          name="paymentTerms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment terms</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter payment terms" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    {/* Summary section with conditional VAT display */}
                    <div>
                      <div className="flex justify-end">
                        <div className="w-64">
                          <div className="flex justify-between py-1">
                            <span className="text-sm text-gray-700">Net amount (inc. discount/surcharge)</span>
                            <span className="font-medium">{currencySymbol}{netAmount.toFixed(2)}</span>
                          </div>
                          {isVatEnabled && (
                            <div className="flex justify-between py-1">
                              <span className="text-sm text-gray-700">VAT 19%</span>
                              <span className="font-medium">{currencySymbol}{vatAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between py-2 border-t border-gray-200 mt-1">
                            <span className="font-medium">Total</span>
                            <span className="font-bold">{currencySymbol}{(isVatEnabled ? totalAmount : netAmount).toFixed(2)}</span>
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

import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Proposal, ProposalLineItem } from '@/types';

// Function to generate a PDF from a proposal
export const generateProposalPDF = async (
  proposal: Proposal,
  elementId: string
): Promise<string> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error("Element not found");
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    const pdfBlob = pdf.output("blob");
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

// Function to download a proposal as a PDF
export const downloadProposalPDF = async (
  proposal: Proposal,
  elementId: string
): Promise<void> => {
  try {
    const pdfUrl = await generateProposalPDF(proposal, elementId);
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `Proposal_${proposal.number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw error;
  }
};

// Function to print a proposal
export const printProposal = async (
  proposal: Proposal,
  elementId: string
): Promise<void> => {
  try {
    const pdfUrl = await generateProposalPDF(proposal, elementId);
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(pdfUrl);
      }, 100);
    };
  } catch (error) {
    console.error("Error printing proposal:", error);
    throw error;
  }
};

// Function to format currency
export const formatCurrency = (value: number | string, currency: string = "EUR"): string => {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(numericValue);
};

// Function to parse price string from inventory item
export const parseInventoryPrice = (price: string): number => {
  if (!price) return 0;
  
  // Remove currency code and get just the number
  const numericString = price.replace(/[^\d.,]/g, "").replace(",", ".");
  return parseFloat(numericString) || 0;
};

// Function to get all inventory items
export const getInventoryItems = () => {
  try {
    const inventoryItems = localStorage.getItem("inventoryItems");
    if (inventoryItems) {
      return JSON.parse(inventoryItems);
    }
    return [];
  } catch (error) {
    console.error("Error loading inventory items:", error);
    return [];
  }
};

// Function to find an inventory item by ID
export const getInventoryItemById = (id: string) => {
  const items = getInventoryItems();
  return items.find((item: any) => item.id === id);
};

// Function to filter inventory items by name or ID match
export const findInventoryItems = (query: string) => {
  if (!query || query.length < 2) return [];
  
  const items = getInventoryItems();
  const lowerQuery = query.toLowerCase();
  
  return items.filter((item: any) => 
    item.name.toLowerCase().includes(lowerQuery) || 
    item.id.toLowerCase().includes(lowerQuery)
  );
};

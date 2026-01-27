import { InventoryItem, ProposalLineItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export const getProposalStatusColor = (status: string) => {
  switch (status) {
    case "Draft":
      return "bg-yellow-100 text-yellow-800";
    case "Sent":
      return "bg-blue-100 text-blue-800";
    case "Accepted":
      return "bg-green-100 text-green-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    case "Expired":
      return "bg-gray-100 text-gray-800";
    case "Revised":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * @deprecated Use loadInventoryItemsAsync instead for Supabase data
 */
export const loadInventoryItems = () => {
  console.warn('loadInventoryItems is deprecated. Use loadInventoryItemsAsync instead.');
  return [];
};

/**
 * Load inventory items from Supabase database
 */
export const loadInventoryItemsAsync = async (): Promise<InventoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading inventory items:', error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category as "Article" | "Service",
      description: item.description || '',
      lastBooking: item.last_booking,
      stock: item.stock || 0,
      unit: item.unit || 'Stk',
      price: item.price || 'EUR0.00',
      buyingPrice: item.buying_price || 'EUR0.00',
      buyingPriceGross: item.buying_price_gross,
      priceGross: item.price_gross,
      internalNote: item.internal_note || ''
    }));
  } catch (error) {
    console.error('Failed to load inventory items:', error);
    return [];
  }
};

export const formatInventoryItemForProposal = (item: InventoryItem, quantity: number = 1): ProposalLineItem => {
  const unitPrice = parseFloat(item.price.replace('EUR', '')) || 0;
  return {
    id: crypto.randomUUID(),
    proposal_id: "",
    item_id: item.id,
    name: item.name,
    description: item.description || "",
    quantity: quantity,
    unit_price: unitPrice,
    total_price: unitPrice * quantity,
    category: item.category,
    unit: item.unit || "unit",
    created_at: new Date().toISOString()
  };
};

export const downloadProposal = (proposalData: any) => {
  // Create a simple PDF-like content
  const content = `
PROPOSAL ${proposalData.number}
Customer: ${proposalData.customer}
Subject: ${proposalData.subject}
Date: ${proposalData.date || new Date().toLocaleDateString()}

Address:
${proposalData.address || 'N/A'}
${proposalData.country || 'N/A'}

Content:
${proposalData.content || 'N/A'}

Line Items:
${proposalData.lineItems.map((item: any) => 
  `${item.name} - ${item.description || 'No description'} - Qty: ${item.quantity} - Price: €${item.unit_price?.toFixed(2) || '0.00'} - Amount: €${item.total_price?.toFixed(2) || '0.00'}`
).join('\n')}

Total Amount: €${proposalData.totalAmount?.toFixed(2) || '0.00'}
`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `proposal_${proposalData.number}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

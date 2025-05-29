
import { Company, Order } from "@/types";

export const getGoogleMapsLink = (address: string, customLink?: string) => {
  if (customLink && customLink.trim() !== '') return customLink;
  if (address === "Not provided") return "#";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
};

export const groupOrdersByCompany = (orders: Order[]): {[key: string]: Company} => {
  const companyMap: {[key: string]: Company} = {};
  
  orders.forEach(order => {
    // Use company_name as the unique identifier
    const companyKey = order.company_name.trim().toLowerCase();
    
    if (!companyMap[companyKey]) {
      companyMap[companyKey] = {
        id: `company-${Date.now()}-${Math.random()}`, // Generate temporary ID
        name: order.company_name,
        email: order.contact_email || "",
        phone: order.contact_phone || "Not provided",
        address: order.company_address || "Not provided",
        contact_person: order.contact_name || "Contact",
        map_link: order.company_link || '',
        mapLink: order.company_link || '', // Keep for backward compatibility
        orders: [] // Keep for backward compatibility
      };
    } else {
      // Update company data with the most recent order data (in case it was updated)
      // Keep the most recent mapLink if it exists
      if (order.company_link && order.company_link.trim() !== '') {
        companyMap[companyKey].map_link = order.company_link;
        companyMap[companyKey].mapLink = order.company_link;
      }
      // Update other fields if they're more complete
      if (order.contact_email && order.contact_email !== companyMap[companyKey].email) {
        companyMap[companyKey].email = order.contact_email;
      }
      if (order.contact_phone && order.contact_phone !== "Not provided") {
        companyMap[companyKey].phone = order.contact_phone;
      }
      if (order.company_address && order.company_address !== "Not provided") {
        companyMap[companyKey].address = order.company_address;
      }
      if (order.contact_name && order.contact_name !== "Contact") {
        companyMap[companyKey].contact_person = order.contact_name;
      }
    }
    
    if (companyMap[companyKey].orders) {
      companyMap[companyKey].orders!.push(order);
    }
  });
  
  return companyMap;
};

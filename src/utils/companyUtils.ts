
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
        name: order.company_name,
        email: order.contact_email,
        phone: order.contact_phone || "Not provided",
        address: order.contact_address || "Not provided",
        mapLink: '',
        orders: []
      };
    }
    
    companyMap[companyKey].orders.push(order);
  });
  
  return companyMap;
};

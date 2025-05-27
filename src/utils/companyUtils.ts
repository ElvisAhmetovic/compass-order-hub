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
        address: order.company_address || "Not provided",
        mapLink: order.company_link || '',
        orders: []
      };
    } else {
      // Update company data with the most recent order data (in case it was updated)
      // Keep the most recent mapLink if it exists
      if (order.company_link && order.company_link.trim() !== '') {
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
    }
    
    companyMap[companyKey].orders.push(order);
  });
  
  return companyMap;
};

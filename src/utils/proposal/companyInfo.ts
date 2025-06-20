
// Helper function to get company information - can be replaced with API call or settings
export const getCompanyInfo = () => {
  try {
    // Get stored company info from localStorage if available
    const storedCompanyInfo = localStorage.getItem("companyInfo");
    if (storedCompanyInfo) {
      const parsed = JSON.parse(storedCompanyInfo);
      // Validate that we have essential company data
      if (parsed && parsed.name && parsed.name !== "Company Name") {
        return {
          ...getDefaultCompanyInfo(),
          ...parsed
        };
      }
    }
  } catch (error) {
    console.warn('Error loading company info from localStorage:', error);
  }
  
  // Return default company info if localStorage fails or is empty
  return getDefaultCompanyInfo();
};

// Separate function for default company info to ensure consistency
const getDefaultCompanyInfo = () => ({
  logo: "https://placehold.co/200x60?text=Your+Logo",
  name: "AB MEDIA TEAM LTD",
  contactPerson: "Andreas Berger",
  street: "Weseler Str.73",
  postal: "47169",
  city: "Duisburg",
  country: "Germany",
  phone: "+49 203 70 90 72 62",
  fax: "+49 203 70 90 73 53",
  email: "kontakt.abmedia@gmail.com",
  website: "www.abmedia-team.com",
  registrationNumber: "15748871",
  vatId: "DE123418679",
  taxNumber: "13426 27369",
  director: "Andreas Berger",
  wise: true,
  accountNumber: "12345678901234567",
  accountHolder: "YOUR NAME",
  paymentMethod: "CREDIT CARD",
  bankCode: "967",
  iban: "BE79967023897833",
  bic: "TRWIBEB1"
});

export const saveCompanyInfo = (companyInfo: any) => {
  try {
    localStorage.setItem("companyInfo", JSON.stringify(companyInfo));
  } catch (error) {
    console.error('Error saving company info to localStorage:', error);
  }
};

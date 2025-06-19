
// Main translation system for the entire application
export const SUPPORTED_UI_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'bs', name: 'Bosanski' }
];

export const uiTranslations = {
  en: {
    // Navigation & General
    navigation: "Navigation",
    dashboard: "Dashboard",
    analytics: "Analytics",
    support: "Support",
    myOrders: "My Orders",
    activeOrders: "Active Orders",
    yearlyPackages: "Yearly Packages",
    complaints: "Complaints",
    completed: "Completed",
    cancelled: "Cancelled",
    reviews: "Reviews",
    invoiceSent: "Invoice Sent",
    invoicePaid: "Invoice Paid",
    companies: "Companies",
    proposals: "Proposals",
    invoices: "Invoices",
    clients: "Clients",
    inventory: "Inventory",
    userManagement: "User Management",
    deleted: "Deleted",
    teamChat: "Team Chat",
    
    // Header & Common Actions
    orderManagementSystem: "Order Management System",
    logout: "Logout",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    create: "Create",
    search: "Search",
    filter: "Filter",
    export: "Export",
    import: "Import",
    refresh: "Refresh",
    settings: "Settings",
    profile: "Profile",
    
    // Forms & Validation
    required: "Required",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    firstName: "First Name",
    lastName: "Last Name",
    phoneNumber: "Phone Number",
    address: "Address",
    city: "City",
    country: "Country",
    zipCode: "ZIP Code",
    
    // Status & States
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    draft: "Draft",
    published: "Published",
    
    // Dates & Time
    date: "Date",
    time: "Time",
    createdAt: "Created At",
    updatedAt: "Updated At",
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    thisMonth: "This Month",
    
    // Buttons & Actions
    createNew: "Create New",
    viewDetails: "View Details",
    downloadPdf: "Download PDF",
    sendEmail: "Send Email",
    addNew: "Add New",
    saveChanges: "Save Changes",
    backToList: "Back to List",
    
    // Messages
    successSaved: "Successfully saved",
    successDeleted: "Successfully deleted",
    successCreated: "Successfully created",
    errorOccurred: "An error occurred",
    confirmDelete: "Are you sure you want to delete this item?",
    noDataFound: "No data found",
    loading: "Loading...",
    saving: "Saving...",
    
    // Language Switcher
    language: "Language",
    switchLanguage: "Switch Language",
  },
  bs: {
    // Navigation & General
    navigation: "Navigacija",
    dashboard: "Kontrolna tabla",
    analytics: "Analitika",
    support: "Podrška",
    myOrders: "Moje narudžbe",
    activeOrders: "Aktivne narudžbe",
    yearlyPackages: "Godišnji paketi",
    complaints: "Žalbe",
    completed: "Završeno",
    cancelled: "Otkazano",
    reviews: "Recenzije",
    invoiceSent: "Račun poslan",
    invoicePaid: "Račun plaćen",
    companies: "Kompanije",
    proposals: "Ponude",
    invoices: "Računi",
    clients: "Klijenti",
    inventory: "Inventar",
    userManagement: "Upravljanje korisnicima",
    deleted: "Obrisano",
    teamChat: "Timski chat",
    
    // Header & Common Actions
    orderManagementSystem: "Sistem za upravljanje narudžbama",
    logout: "Odjava",
    save: "Sačuvaj",
    cancel: "Otkaži",
    edit: "Uredi",
    delete: "Obriši",
    create: "Kreiraj",
    search: "Pretraži",
    filter: "Filter",
    export: "Izvezi",
    import: "Uvezi",
    refresh: "Osveži",
    settings: "Podešavanja",
    profile: "Profil",
    
    // Forms & Validation
    required: "Obavezno",
    email: "Email",
    password: "Lozinka",
    confirmPassword: "Potvrdi lozinku",
    firstName: "Ime",
    lastName: "Prezime",
    phoneNumber: "Broj telefona",
    address: "Adresa",
    city: "Grad",
    country: "Država",
    zipCode: "Poštanski broj",
    
    // Status & States
    active: "Aktivan",
    inactive: "Neaktivan",
    pending: "Na čekanju",
    approved: "Odobren",
    rejected: "Odbačen",
    draft: "Nacrt",
    published: "Objavljen",
    
    // Dates & Time
    date: "Datum",
    time: "Vreme",
    createdAt: "Kreiran",
    updatedAt: "Ažuriran",
    today: "Danas",
    yesterday: "Juče",
    thisWeek: "Ova sedmica",
    thisMonth: "Ovaj mesec",
    
    // Buttons & Actions
    createNew: "Kreiraj novi",
    viewDetails: "Pogledaj detalje",
    downloadPdf: "Preuzmi PDF",
    sendEmail: "Pošalji email",
    addNew: "Dodaj novi",
    saveChanges: "Sačuvaj izmene",
    backToList: "Nazad na listu",
    
    // Messages
    successSaved: "Uspešno sačuvano",
    successDeleted: "Uspešno obrisano",
    successCreated: "Uspešno kreirano",
    errorOccurred: "Došlo je do greške",
    confirmDelete: "Da li ste sigurni da želite da obrišete ovu stavku?",
    noDataFound: "Nema podataka",
    loading: "Učitavanje...",
    saving: "Čuvanje...",
    
    // Language Switcher
    language: "Jezik",
    switchLanguage: "Promeni jezik",
  }
};

export const getUITranslation = (language: string, key: string): string => {
  const keys = key.split('.');
  let value: any = uiTranslations[language as keyof typeof uiTranslations] || uiTranslations.en;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || uiTranslations.en[key as keyof typeof uiTranslations.en] || key;
};

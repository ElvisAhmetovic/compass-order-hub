import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InventoryItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

export const useInventory = () => {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchInventory = async () => {
    try {
      setLoading(true);
      console.log('Fetching inventory...');
      
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching inventory:', error);
        throw error;
      }

      console.log('Fetched inventory data:', data);

      const formattedData: InventoryItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        description: item.description || '',
        lastBooking: item.last_booking,
        stock: item.stock,
        unit: item.unit,
        price: item.price,
        buyingPrice: item.buying_price || '',
        buyingPriceGross: item.buying_price_gross,
        priceGross: item.price_gross,
        internalNote: item.internal_note
      }));

      setInventoryData(formattedData);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory items.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateInventoryItem = async (item: InventoryItem) => {
    try {
      console.log('Updating inventory item:', item);
      
      const { error } = await supabase
        .from('inventory_items')
        .update({
          name: item.name,
          category: item.category,
          description: item.description,
          stock: item.stock,
          unit: item.unit,
          price: item.price,
          buying_price: item.buyingPrice,
          buying_price_gross: item.buyingPriceGross,
          price_gross: item.priceGross,
          internal_note: item.internalNote
        })
        .eq('id', item.id);

      if (error) {
        console.error('Error updating inventory item:', error);
        throw error;
      }

      // Update local state
      setInventoryData(prev => 
        prev.map(prevItem => 
          prevItem.id === item.id ? item : prevItem
        )
      );

      toast({
        title: "Item Updated",
        description: `${item.name} has been successfully updated.`,
        variant: "default",
      });

      return true;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      toast({
        title: "Error",
        description: "Failed to update inventory item.",
        variant: "destructive",
      });
      return false;
    }
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    try {
      console.log('Adding inventory item:', item);
      
      // Check if user is authenticated through AuthContext
      if (!user) {
        throw new Error('User not authenticated - please log in');
      }

      console.log('Current user from AuthContext:', user.id);

      // Generate a random ID for the inventory item
      const itemId = Math.random().toString(36).substring(2, 7).toUpperCase();

      const insertData = {
        id: itemId,
        name: item.name,
        category: item.category,
        description: item.description,
        stock: item.stock,
        unit: item.unit,
        price: item.price,
        buying_price: item.buyingPrice,
        buying_price_gross: item.buyingPriceGross,
        price_gross: item.priceGross,
        internal_note: item.internalNote,
        user_id: null // Set to null since we're using local authentication
      };

      console.log('Insert data:', insertData);

      const { data, error } = await supabase
        .from('inventory_items')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Successfully inserted item:', data);

      if (data) {
        const newItem: InventoryItem = {
          id: data.id,
          name: data.name,
          category: data.category,
          description: data.description || '',
          lastBooking: data.last_booking,
          stock: data.stock,
          unit: data.unit,
          price: data.price,
          buyingPrice: data.buying_price || '',
          buyingPriceGross: data.buying_price_gross,
          priceGross: data.price_gross,
          internalNote: data.internal_note
        };

        setInventoryData(prev => [newItem, ...prev]);

        toast({
          title: "Product Added",
          description: `${item.name} has been successfully added to inventory.`,
          variant: "default",
        });
      }

      return true;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      toast({
        title: "Error",
        description: `Failed to add inventory item: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const importProductData = async () => {
    const productData = [
      {
        id: "10354",
        name: "Google Maps Seite Erstellen - GOLD PAKET",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR0.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "2000",
        name: "Entfernung negativer Online-Inhalte",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR168.07",
        buyingPrice: "EUR0.00"
      },
      {
        id: "9999",
        name: "Professionelle SEO-Optimierung zur Verdrängung negativer Inhalte",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR335.29",
        buyingPrice: "EUR0.00"
      },
      {
        id: "10351",
        name: "Deletion Trustpilot Negative Reviews",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR0.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "103526",
        name: "TRIPADVISOR",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR0.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "2587",
        name: "SUPPRIMER L'AVIS NÉGATIF - PAQUET GOOGLE ARGENT",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR0.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "10254",
        name: "REMOVE NEGATIVE RATING - GOOGLE SILVER PACKAGE",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR0.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "10987",
        name: "NEGATIVE BEWERTUNG ENTFERNEN - GOOGLE SILBER PAKET",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR0.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "2058",
        name: "SILVER PACKAGE",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR300.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1966",
        name: "Google Maps-Element Erstellen",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR126.05",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1084",
        name: "Einzelne negative Google-Bewertungen löschen",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR100.84",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1041",
        name: "NEUE OPTIMIERTE GOOGLE-SEITE ERSTELLEN",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR209.24",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1089",
        name: "TRUSTPILOT OPTIMISATION",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR300.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1034",
        name: "Google Maps Seite Erstellen",
        category: "Article",
        description: "",
        stock: 1,
        unit: "Stk",
        price: "EUR83.19",
        buyingPrice: "EUR84.00"
      },
      {
        id: "1035",
        name: "SEO OPTIMIERUNG",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR251.26",
        buyingPrice: "EUR0.00"
      },
      {
        id: "2323",
        name: "CANCELLAZIONE DELLA RECENSIONE DI GOOGLE MY BUSINESS",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR299.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "103345",
        name: "Website Erstellung",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR420.17",
        buyingPrice: "EUR0.00"
      },
      {
        id: "11111",
        name: "FORFAIT D'OPTIMISATION ARGENT",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR209.24",
        buyingPrice: "EUR0.00"
      },
      {
        id: "10331",
        name: "Produkt Verlinkung",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR8.40",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1039",
        name: "Google My Business Eintrag Erstellen",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR167.23",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1038",
        name: "Google My Business Eintrag Erstellen",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR84.03",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1032",
        name: "Yearly Protection Package",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR1799.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1031",
        name: "FACEBOOK VERWALTUNG",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR100.84",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1030",
        name: "Webdesing Gold Paket",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR335.29",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1029",
        name: "FACEBOOK BEWERTUNGEN",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR8.40",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1028",
        name: "DREI MONATE VERWALTUNG",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR293.28",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1027",
        name: "FACEBOOK DELETION PACKAGE",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR83.19",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1026",
        name: "GOOGLE MY BUSINESS ANNUAL PROTECTION PACKAGE",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR1008.40",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1025",
        name: "POSITIVE GOOGLE RATINGS",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR0.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1021",
        name: "Google AdWords (60 - 150 km)",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR249.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1020",
        name: "Google AdWords (10 - 60 km)",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR199.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1019",
        name: "3 MONATE PAKET-BEWERTUNGEN MOBILE UND AUTOSCOUT",
        category: "Article",
        description: "",
        stock: 90,
        unit: "Stk",
        price: "EUR378.15",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1018",
        name: "POSITIVE GOOGLE BEWERTUNGEN",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR12.61",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1017",
        name: "EINZELNE AUTOSCOUT UND MOBILE BEWERTUNGEN",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR12.61",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1016",
        name: "BRANCHENPAKET MIT BACKLINKS LOCALES SEO",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR167.23",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1015",
        name: "GOOGLE MY BUSINESS JAHRESSCHUTZ",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR1008.40",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1014",
        name: "GOOGLE MAPS EINTRAG ERSTELLEN",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR83.19",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1013",
        name: "GOOGLE MY BUSINESS WEBSITE",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR84.03",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1012",
        name: "6 MONATE BLOKADE DES GOOGLE MY BUSINESS EINTRAGS",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR209.24",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1011",
        name: "POSITIVE GOOGLE BEWERTUNGEN MIT KOMMENTAR",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR16.81",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1010",
        name: "PLATIN-OPTIMIERUNGSPAKET",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR419.33",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1009",
        name: "GOLD-OPTIMIERUNGSPAKET",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR293.28",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1008",
        name: "SILBER-OPTIMIERUNGSPAKET",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR251.26",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1033",
        name: "12 MONATE BLOKADE DES GOOGLE MY BUSINESS EINTRAGS",
        category: "Article",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR251.26",
        buyingPrice: "EUR0.00"
      },
      {
        id: "9730",
        name: "Neue Google Maps Profil-Erstellung für Ihr Unternehmen",
        category: "Service",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR167.23",
        buyingPrice: "EUR0.00"
      },
      {
        id: "9720",
        name: "Neue Google Maps Profil-Erstellung für Ihr Unternehmen",
        category: "Service",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR0.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1040",
        name: "SEO OPTIMISATION",
        category: "Service",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR293.28",
        buyingPrice: "EUR0.00"
      },
      {
        id: "103575",
        name: "GOOGLE NORVESKI",
        category: "Service",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR0.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1037",
        name: "WEBSITE-ERSTELLUNG GOLD PAKET",
        category: "Service",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR798.32",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1587",
        name: "Google Local Service Ads",
        category: "Service",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR167.23",
        buyingPrice: "EUR0.00"
      },
      {
        id: "11487",
        name: "GOOGLE SEO - GOLD PACKAGE",
        category: "Service",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR299.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "10024",
        name: "SILBER PAKET",
        category: "Service",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR0.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1036",
        name: "GoodFirm Reviews",
        category: "Service",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR0.00",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1024",
        name: "BLOCK THE GOOGLE MY BUSINESS ENTRY",
        category: "Service",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR293.28",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1023",
        name: "GOOGLE DELETION PACKAGE",
        category: "Service",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR335.29",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1007",
        name: "BLOKADE DES GOOGLE MY BUSINESS EINTRAGS",
        category: "Service",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR293.28",
        buyingPrice: "EUR0.00"
      },
      {
        id: "1006",
        name: "1880 GOLOCAL AUTOPLENUM CYLEX FIRMEN EINTRAG",
        category: "Service",
        description: "",
        stock: 0,
        unit: "Stk",
        price: "EUR167.23",
        buyingPrice: "EUR0.00"
      }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const product of productData) {
      const insertData = {
        id: product.id,
        name: product.name,
        category: product.category,
        description: product.description,
        stock: product.stock,
        unit: product.unit,
        price: product.price,
        buying_price: product.buyingPrice,
        buying_price_gross: null,
        price_gross: null,
        internal_note: null,
        user_id: null
      };

      try {
        const { error } = await supabase
          .from('inventory_items')
          .insert(insertData);

        if (error) {
          console.error('Error inserting product:', product.name, error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error('Error inserting product:', product.name, error);
        errorCount++;
      }
    }

    // Refresh inventory after import
    await fetchInventory();

    toast({
      title: "Import Complete",
      description: `Successfully imported ${successCount} products. ${errorCount > 0 ? `${errorCount} errors occurred.` : ''}`,
      variant: successCount > 0 ? "default" : "destructive",
    });

    return { successCount, errorCount };
  };

  const deleteInventoryItem = async (itemId: string) => {
    try {
      console.log('Deleting inventory item:', itemId);
      
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting inventory item:', error);
        throw error;
      }

      // Update local state
      setInventoryData(prev => prev.filter(item => item.id !== itemId));

      toast({
        title: "Item Deleted",
        description: "Item has been successfully deleted from inventory.",
        variant: "default",
      });

      return true;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      toast({
        title: "Error",
        description: "Failed to delete inventory item.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteAllInventoryItems = async () => {
    try {
      console.log('Deleting all inventory items...');
      
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .neq('id', ''); // This deletes all records

      if (error) {
        console.error('Error deleting all inventory items:', error);
        throw error;
      }

      // Clear local state
      setInventoryData([]);

      toast({
        title: "All Items Deleted",
        description: "All inventory items have been successfully deleted.",
        variant: "default",
      });

      return true;
    } catch (error) {
      console.error('Error deleting all inventory items:', error);
      toast({
        title: "Error",
        description: "Failed to delete all inventory items.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return {
    inventoryData,
    loading,
    updateInventoryItem,
    addInventoryItem,
    deleteInventoryItem,
    deleteAllInventoryItems,
    importProductData,
    refreshInventory: fetchInventory
  };
};

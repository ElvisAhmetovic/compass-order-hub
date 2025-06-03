
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InventoryItem } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useInventory = () => {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    try {
      setLoading(true);
      console.log('Loading inventory items...');
      
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading inventory:', error);
        throw error;
      }

      console.log('Loaded inventory items:', data);
      
      // Convert data to match InventoryItem type
      const formattedData: InventoryItem[] = (data || []).map(item => ({
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

      setInventoryData(formattedData);
    } catch (error: any) {
      console.error('Failed to load inventory:', error);
      toast({
        title: "Error loading inventory",
        description: error.message || "Could not load inventory items",
        variant: "destructive",
      });
      setInventoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const updateInventoryItem = async (item: InventoryItem): Promise<boolean> => {
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
          internal_note: item.internalNote,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) {
        console.error('Error updating inventory item:', error);
        throw error;
      }

      toast({
        title: "Item updated",
        description: "Inventory item has been updated successfully.",
      });

      await loadInventory();
      return true;
    } catch (error: any) {
      console.error('Failed to update inventory item:', error);
      toast({
        title: "Error updating item",
        description: error.message || "Could not update inventory item",
        variant: "destructive",
      });
      return false;
    }
  };

  const addInventoryItem = async (newItem: Omit<InventoryItem, 'id'>): Promise<boolean> => {
    try {
      console.log('Adding new inventory item:', newItem);
      
      // Generate a simple incremental ID
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const newId = `${timestamp}${randomSuffix}`;
      
      const { error } = await supabase
        .from('inventory_items')
        .insert({
          id: newId,
          name: newItem.name,
          category: newItem.category,
          description: newItem.description,
          stock: newItem.stock,
          unit: newItem.unit,
          price: newItem.price,
          buying_price: newItem.buyingPrice,
          buying_price_gross: newItem.buyingPriceGross,
          price_gross: newItem.priceGross,
          internal_note: newItem.internalNote,
          last_booking: newItem.lastBooking
        });

      if (error) {
        console.error('Error adding inventory item:', error);
        throw error;
      }

      toast({
        title: "Item added",
        description: "New inventory item has been added successfully.",
      });

      await loadInventory();
      return true;
    } catch (error: any) {
      console.error('Failed to add inventory item:', error);
      toast({
        title: "Error adding item",
        description: error.message || "Could not add inventory item",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteInventoryItem = async (itemId: string): Promise<boolean> => {
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

      toast({
        title: "Item deleted",
        description: "Inventory item has been deleted successfully.",
      });

      await loadInventory();
      return true;
    } catch (error: any) {
      console.error('Failed to delete inventory item:', error);
      toast({
        title: "Error deleting item",
        description: error.message || "Could not delete inventory item",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteAllInventoryItems = async (): Promise<boolean> => {
    try {
      console.log('Deleting all inventory items...');
      
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .neq('id', ''); // Delete all items

      if (error) {
        console.error('Error deleting all inventory items:', error);
        throw error;
      }

      toast({
        title: "All items deleted",
        description: "All inventory items have been deleted successfully.",
      });

      await loadInventory();
      return true;
    } catch (error: any) {
      console.error('Failed to delete all inventory items:', error);
      toast({
        title: "Error deleting items",
        description: error.message || "Could not delete inventory items",
        variant: "destructive",
      });
      return false;
    }
  };

  const importProductData = async (): Promise<boolean> => {
    try {
      console.log('Importing predefined product data...');
      
      const predefinedProducts = [
        {
          name: "Video Production",
          category: "Service" as const,
          description: "Professional video production services",
          stock: 0,
          unit: "hour",
          price: "EUR150.00",
          buyingPrice: "EUR0.00"
        },
        {
          name: "Photography Session",
          category: "Service" as const,
          description: "Professional photography services",
          stock: 0,
          unit: "hour",
          price: "EUR100.00",
          buyingPrice: "EUR0.00"
        },
        {
          name: "Graphic Design",
          category: "Service" as const,
          description: "Creative graphic design services",
          stock: 0,
          unit: "hour",
          price: "EUR80.00",
          buyingPrice: "EUR0.00"
        }
      ];

      let successCount = 0;
      for (const product of predefinedProducts) {
        const success = await addInventoryItem({
          ...product,
          lastBooking: null,
          buyingPriceGross: undefined,
          priceGross: undefined,
          internalNote: ''
        });
        if (success) successCount++;
      }

      toast({
        title: "Import complete",
        description: `Successfully imported ${successCount} AB Media Team products.`,
      });

      return true;
    } catch (error: any) {
      console.error('Failed to import product data:', error);
      toast({
        title: "Error importing products",
        description: error.message || "Could not import product data",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  return {
    inventoryData,
    loading,
    updateInventoryItem,
    addInventoryItem,
    deleteInventoryItem,
    deleteAllInventoryItems,
    importProductData,
    reloadInventory: loadInventory
  };
};

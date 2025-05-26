
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InventoryItem } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useInventory = () => {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

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

      if (error) throw error;

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
      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          id: Math.random().toString(36).substring(2, 7).toUpperCase(),
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
        .select()
        .single();

      if (error) throw error;

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
        description: "Failed to add inventory item.",
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
    refreshInventory: fetchInventory
  };
};

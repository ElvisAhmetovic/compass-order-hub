
import { Order, Company } from '@/types';
import { OrderService } from './orderService';
import { supabase } from '@/integrations/supabase/client';

export interface SearchFilters {
  globalSearch?: string;
  companyName?: string;
  contactEmail?: string;
  status?: string[];
  priority?: string[];
  assignedTo?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  currency?: string[];
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: SearchFilters;
  userId: string;
  isDefault?: boolean;
  created_at: string;
}

export class SearchService {
  // Global search across orders, companies, and clients
  static async globalSearch(query: string): Promise<{
    orders: Order[];
    companies: Company[];
    clients: any[];
  }> {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      
      // Search orders
      const orders = await OrderService.getOrders();
      const filteredOrders = orders.filter(order => 
        order.company_name?.toLowerCase().includes(query.toLowerCase()) ||
        order.contact_email?.toLowerCase().includes(query.toLowerCase()) ||
        order.description?.toLowerCase().includes(query.toLowerCase()) ||
        order.company_address?.toLowerCase().includes(query.toLowerCase())
      );

      // Search companies
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},contact_person.ilike.${searchTerm},address.ilike.${searchTerm}`);

      if (companiesError) {
        console.error('Error searching companies:', companiesError);
      }

      // Search clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},contact_person.ilike.${searchTerm},address.ilike.${searchTerm}`);

      if (clientsError) {
        console.error('Error searching clients:', clientsError);
      }

      return {
        orders: filteredOrders,
        companies: companies || [],
        clients: clients || []
      };
    } catch (error) {
      console.error('Error in global search:', error);
      return { orders: [], companies: [], clients: [] };
    }
  }

  // Advanced filtering with multiple criteria
  static async advancedSearch(filters: SearchFilters): Promise<Order[]> {
    try {
      let orders = await OrderService.getOrders();

      // Apply global search filter
      if (filters.globalSearch) {
        const query = filters.globalSearch.toLowerCase();
        orders = orders.filter(order =>
          order.company_name?.toLowerCase().includes(query) ||
          order.contact_email?.toLowerCase().includes(query) ||
          order.description?.toLowerCase().includes(query) ||
          order.company_address?.toLowerCase().includes(query) ||
          order.assigned_to_name?.toLowerCase().includes(query)
        );
      }

      // Apply company name filter
      if (filters.companyName) {
        const query = filters.companyName.toLowerCase();
        orders = orders.filter(order =>
          order.company_name?.toLowerCase().includes(query)
        );
      }

      // Apply contact email filter
      if (filters.contactEmail) {
        const query = filters.contactEmail.toLowerCase();
        orders = orders.filter(order =>
          order.contact_email?.toLowerCase().includes(query)
        );
      }

      // Apply status filters
      if (filters.status && filters.status.length > 0) {
        orders = orders.filter(order => {
          const activeStatuses = OrderService.getActiveStatuses(order);
          return filters.status!.some(status => activeStatuses.includes(status as any));
        });
      }

      // Apply priority filters
      if (filters.priority && filters.priority.length > 0) {
        orders = orders.filter(order =>
          filters.priority!.includes(order.priority || 'Medium')
        );
      }

      // Apply assigned to filters
      if (filters.assignedTo && filters.assignedTo.length > 0) {
        orders = orders.filter(order =>
          filters.assignedTo!.includes(order.assigned_to || 'unassigned')
        );
      }

      // Apply date range filter
      if (filters.dateRange) {
        orders = orders.filter(order => {
          const orderDate = new Date(order.created_at || '');
          return orderDate >= filters.dateRange!.from && orderDate <= filters.dateRange!.to;
        });
      }

      // Apply price range filter
      if (filters.priceRange) {
        orders = orders.filter(order => {
          const price = order.price || 0;
          return price >= filters.priceRange!.min && price <= filters.priceRange!.max;
        });
      }

      // Apply currency filter
      if (filters.currency && filters.currency.length > 0) {
        orders = orders.filter(order =>
          filters.currency!.includes(order.currency || 'EUR')
        );
      }

      return orders;
    } catch (error) {
      console.error('Error in advanced search:', error);
      return [];
    }
  }

  // Save filter presets
  static async saveFilterPreset(name: string, filters: SearchFilters, userId: string, isDefault = false): Promise<SavedFilter> {
    try {
      const savedFilter: Omit<SavedFilter, 'id' | 'created_at'> = {
        name,
        filters,
        userId,
        isDefault
      };

      // Store in localStorage for now (could be moved to Supabase later)
      const existingFilters = this.getSavedFilters(userId);
      const newFilter: SavedFilter = {
        ...savedFilter,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      };

      const updatedFilters = [...existingFilters, newFilter];
      localStorage.setItem(`savedFilters_${userId}`, JSON.stringify(updatedFilters));

      return newFilter;
    } catch (error) {
      console.error('Error saving filter preset:', error);
      throw error;
    }
  }

  // Get saved filter presets
  static getSavedFilters(userId: string): SavedFilter[] {
    try {
      const saved = localStorage.getItem(`savedFilters_${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error getting saved filters:', error);
      return [];
    }
  }

  // Delete saved filter
  static deleteSavedFilter(filterId: string, userId: string): void {
    try {
      const filters = this.getSavedFilters(userId);
      const updatedFilters = filters.filter(f => f.id !== filterId);
      localStorage.setItem(`savedFilters_${userId}`, JSON.stringify(updatedFilters));
    } catch (error) {
      console.error('Error deleting saved filter:', error);
    }
  }

  // Get available filter options
  static async getFilterOptions(): Promise<{
    assignedUsers: Array<{ id: string; name: string }>;
    currencies: string[];
    priorities: string[];
    statuses: string[];
  }> {
    try {
      // Get all orders to extract unique values
      const orders = await OrderService.getOrders();
      
      // Get unique assigned users
      const assignedUsers = Array.from(new Set(
        orders
          .filter(order => order.assigned_to && order.assigned_to_name)
          .map(order => ({ id: order.assigned_to!, name: order.assigned_to_name! }))
      ));

      // Get unique currencies
      const currencies = Array.from(new Set(
        orders.map(order => order.currency || 'EUR')
      ));

      // Static priorities and statuses
      const priorities = ['Low', 'Medium', 'High', 'Urgent'];
      const statuses = [
        'Created', 'In Progress', 'Complaint', 'Invoice Sent', 
        'Invoice Paid', 'Resolved', 'Cancelled', 'Deleted', 'Review'
      ];

      return {
        assignedUsers,
        currencies,
        priorities,
        statuses
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      return {
        assignedUsers: [],
        currencies: ['EUR'],
        priorities: ['Low', 'Medium', 'High', 'Urgent'],
        statuses: ['Created', 'In Progress', 'Complaint', 'Invoice Sent', 'Invoice Paid', 'Resolved', 'Cancelled', 'Deleted', 'Review']
      };
    }
  }
}


import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Client } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, FileEdit, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InvoiceService } from "@/services/invoiceService";
import { CreateClientDialog } from "@/components/clients/CreateClientDialog";
import { EditClientDialog } from "@/components/clients/EditClientDialog";
import { CompanySyncService } from "@/services/companySyncService";
import { MigrationService } from "@/services/migrationService";

const Clients = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const loadClients = async () => {
    try {
      setLoading(true);
      
      // First sync companies and clients
      await CompanySyncService.performFullSync();
      
      // Then load clients
      const data = await InvoiceService.getClients();
      setClients(data);
    } catch (error) {
      console.error("Error loading clients:", error);
      toast({
        title: "Error",
        description: "Failed to load clients.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle migration from localStorage to Supabase
  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      console.log("Starting migration from localStorage to Supabase...");
      await MigrationService.performFullMigration();
      
      // Reload clients after migration
      await loadClients();
      
      toast({
        title: "Migration completed",
        description: "Successfully migrated all data from localStorage to Supabase."
      });
    } catch (error) {
      console.error("Migration failed:", error);
      toast({
        variant: "destructive",
        title: "Migration failed",
        description: "There was an error migrating data to Supabase."
      });
    } finally {
      setIsMigrating(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleDeleteClient = async (id: string) => {
    try {
      await InvoiceService.deleteClient(id);
      setClients(clients.filter(client => client.id !== id));
      
      toast({
        title: "Client deleted",
        description: "Client has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        title: "Error",
        description: "Failed to delete client. Check if they have associated invoices.",
        variant: "destructive",
      });
    }
  };

  const handleClientCreated = async (newClient: Client) => {
    setClients([...clients, newClient]);
    setShowCreateDialog(false);
    
    // Sync the new client to companies
    await CompanySyncService.syncClientsToCompanies();
  };

  const handleClientUpdated = async (updatedClient: Client) => {
    setClients(clients.map(client => 
      client.id === updatedClient.id ? updatedClient : client
    ));
    setEditingClient(null);
    
    // Sync the updated client to companies
    await CompanySyncService.syncClientsToCompanies();
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(filterText.toLowerCase()) ||
    client.email.toLowerCase().includes(filterText.toLowerCase()) ||
    (client.contact_person && client.contact_person.toLowerCase().includes(filterText.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
          <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Clients</h1>
              <div className="flex gap-2">
                <Button 
                  onClick={handleMigration}
                  disabled={isMigrating}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isMigrating ? "🔄 Migrating..." : "📦 Migrate from localStorage"}
                </Button>
                <Button 
                  onClick={() => CompanySyncService.performFullSync()} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  🔄 Sync with Companies
                </Button>
                <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
                  <PlusCircle size={16} />
                  Add Client
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Manage Clients</CardTitle>
                  <div className="w-72">
                    <Input
                      placeholder="Search clients..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Name</TableHead>
                      <TableHead className="w-[180px]">Contact Person</TableHead>
                      <TableHead className="w-[250px]">Email</TableHead>
                      <TableHead className="w-[150px]">Phone</TableHead>
                      <TableHead className="w-[120px]">City</TableHead>
                      <TableHead className="w-[120px]">VAT ID</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">Loading clients...</TableCell>
                      </TableRow>
                    ) : filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">No clients found</TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-gray-400" />
                              <span className="font-medium">{client.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{client.contact_person || '-'}</TableCell>
                          <TableCell className="break-all">{client.email}</TableCell>
                          <TableCell>{client.phone || '-'}</TableCell>
                          <TableCell>{client.city || '-'}</TableCell>
                          <TableCell>{client.vat_id || '-'}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setEditingClient(client)}
                                title="Edit"
                              >
                                <FileEdit size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteClient(client.id)}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </Layout>
      </div>

      <CreateClientDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onClientCreated={handleClientCreated}
      />

      {editingClient && (
        <EditClientDialog
          client={editingClient}
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
          onClientUpdated={handleClientUpdated}
        />
      )}
    </div>
  );
};

export default Clients;

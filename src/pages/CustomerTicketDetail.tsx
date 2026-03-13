import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Sidebar from '@/components/dashboard/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Mail, Building2, FileText, Calendar, Ticket, Trash2, UserPlus, X } from 'lucide-react';
import { customerTicketService, CustomerTicket, ClientUser } from '@/services/customerTicketService';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const CustomerTicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<CustomerTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const data = await customerTicketService.getById(id);
        setTicket(data);
        setNotes(data?.notes || '');
      } catch {
        toast({ title: 'Error', description: 'Ticket not found', variant: 'destructive' });
        navigate('/customer-tickets');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  useEffect(() => {
    customerTicketService.getClientUsers().then(setClientUsers).catch(console.error);
  }, []);

  const handleStatusChange = async (status: string) => {
    if (!id || !ticket) return;
    try {
      await customerTicketService.updateStatus(id, status);
      setTicket({ ...ticket, status: status as any });
      toast({ title: 'Status updated' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await customerTicketService.updateNotes(id, notes);
      toast({ title: 'Notes saved' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save notes', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await customerTicketService.deleteTicket(id);
      toast({ title: 'Ticket deleted' });
      navigate('/customer-tickets');
    } catch {
      toast({ title: 'Error', description: 'Failed to delete ticket', variant: 'destructive' });
    }
  };

  const handleAssign = async () => {
    if (!id || !ticket || !selectedClientId) return;
    const client = clientUsers.find(c => c.id === selectedClientId);
    if (!client) return;
    setAssigning(true);
    try {
      await customerTicketService.assignToClient(id, {
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        orderId: ticket.order_id,
        subject: ticket.subject,
      });
      setTicket({
        ...ticket,
        assigned_client_id: client.id,
        assigned_client_name: client.name,
        assigned_client_email: client.email,
      });
      setSelectedClientId('');
      toast({ title: 'Ticket assigned', description: `Assigned to ${client.name}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to assign ticket', variant: 'destructive' });
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!id || !ticket) return;
    try {
      await customerTicketService.unassignClient(id);
      setTicket({ ...ticket, assigned_client_id: null, assigned_client_name: null, assigned_client_email: null });
      toast({ title: 'Client unassigned' });
    } catch {
      toast({ title: 'Error', description: 'Failed to unassign', variant: 'destructive' });
    }
  };

  if (loading) {
    return <Layout><div className="flex justify-center p-8">Loading...</div></Layout>;
  }

  if (!ticket) {
    return <Layout><div className="flex justify-center p-8">Ticket not found</div></Layout>;
  }

  const statusLabel = (s: string) => {
    switch (s) { case 'open': return 'Open'; case 'in_progress': return 'In Progress'; case 'closed': return 'Closed'; default: return s; }
  };

  const statusColor = (s: string) => {
    switch (s) { case 'open': return 'destructive'; case 'in_progress': return 'default'; case 'closed': return 'secondary'; default: return 'outline'; }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/customer-tickets')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="w-6 h-6" />
            Ticket Details
          </h1>
          {ticket.assigned_client_name && (
            <Badge variant="outline" className="ml-auto flex items-center gap-1">
              <UserPlus className="w-3 h-3" />
              {ticket.assigned_client_name}
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{ticket.subject}</CardTitle>
            <Badge variant={statusColor(ticket.status) as any}>
              {statusLabel(ticket.status)}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{ticket.client_name || ticket.client_email}</p>
                  <p className="text-sm text-muted-foreground">{ticket.client_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{ticket.company_name || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono text-sm">{ticket.order_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p>{format(new Date(ticket.created_at), 'dd.MM.yyyy HH:mm')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assign to Client */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Assign to Client Portal User
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ticket.assigned_client_id ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{ticket.assigned_client_name}</p>
                  <p className="text-sm text-muted-foreground">{ticket.assigned_client_email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleUnassign}>
                  <X className="w-4 h-4 mr-1" /> Unassign
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a client user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientUsers.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.email ? `(${c.email})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssign} disabled={!selectedClientId || assigning}>
                  {assigning ? 'Assigning...' : 'Assign'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={ticket.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this ticket..."
              rows={4}
            />
            <Button onClick={handleSaveNotes} disabled={saving}>
              {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          </CardContent>
        </Card>

        {user?.role === 'admin' && (
          <div className="flex justify-end">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Ticket
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CustomerTicketDetail;

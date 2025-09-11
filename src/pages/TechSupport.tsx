import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, CheckCircle, Clock, Trash2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import CreateTechSupportModal from '@/components/tech-support/CreateTechSupportModal';
import CreateTechSupportWithImageModal from '@/components/tech-support/CreateTechSupportWithImageModal';
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { UserRole } from "@/types";

interface TechSupportTicket {
  id: string;
  company_name: string;
  problem_description: string;
  action_needed: string;
  status: 'in_progress' | 'problem_solved';
  attachment_url?: string;
  attachment_name?: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

const TechSupport = () => {
  const [tickets, setTickets] = useState<TechSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateWithImageModalOpen, setIsCreateWithImageModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole: UserRole = user?.role || "user";

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tech_support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tech support tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load tech support tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleStatusChange = async (ticketId: string, newStatus: 'in_progress' | 'problem_solved') => {
    try {
      const { error } = await supabase
        .from('tech_support_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
        )
      );

      toast({
        title: "Success",
        description: `Ticket status updated to ${newStatus.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('tech_support_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(prevTickets =>
        prevTickets.filter(ticket => ticket.id !== ticketId)
      );

      toast({
        title: "Success",
        description: "Tech support ticket deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast({
        title: "Error",
        description: "Failed to delete ticket",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout userRole={userRole}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 p-6">Loading tech support tickets...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole={userRole}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tech Support</h1>
              <p className="text-gray-600 mt-2">Internal tech support tickets and issues</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Ticket
              </Button>
              <Button 
                onClick={() => setIsCreateWithImageModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                Create Ticket with Image
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {tickets.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  No tech support tickets found. Create your first ticket to get started.
                </CardContent>
              </Card>
            ) : (
              tickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="text-lg cursor-pointer hover:text-primary" 
                                   onClick={() => navigate(`/tech-support/${ticket.id}`)}>
                          {ticket.company_name}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(ticket.created_at)}
                          <span>•</span>
                          <span>by {ticket.created_by_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={ticket.status === 'problem_solved' ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleStatusChange(
                            ticket.id, 
                            ticket.status === 'in_progress' ? 'problem_solved' : 'in_progress'
                          )}
                          className="flex items-center gap-2"
                        >
                          {ticket.status === 'problem_solved' ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Problem Solved
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4" />
                              In Progress
                            </>
                          )}
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="flex items-center gap-2">
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Tech Support Ticket</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this tech support ticket for "{ticket.company_name}"? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteTicket(ticket.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Ticket
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Problem Description:</h4>
                        <p className="text-gray-700">{ticket.problem_description}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Action Needed:</h4>
                        <p className="text-gray-700">{ticket.action_needed}</p>
                      </div>

                      {ticket.attachment_url && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Attachment:</h4>
                          <a
                            href={ticket.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {ticket.attachment_name || 'View Attachment'}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Badge variant={ticket.status === 'problem_solved' ? "default" : "secondary"}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <CreateTechSupportModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={() => {
              setIsCreateModalOpen(false);
              fetchTickets();
            }}
          />

          <CreateTechSupportWithImageModal
            isOpen={isCreateWithImageModalOpen}
            onClose={() => setIsCreateWithImageModalOpen(false)}
            onSuccess={() => {
              setIsCreateWithImageModalOpen(false);
              fetchTickets();
            }}
          />
        </div>
      </div>
    </Layout>
  );
};

export default TechSupport;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle, Clock, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import AttachmentViewer from "@/components/attachments/AttachmentViewer";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { UserRole } from "@/types";

interface TechSupportTicket {
  id: string;
  company_name: string;
  problem_description: string;
  action_needed: string;
  status: 'in_progress' | 'problem_solved';
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

const TechSupportDetail = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TechSupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const userRole: UserRole = user?.role || "user";

  const fetchTicket = async () => {
    if (!ticketId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tech_support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Not Found",
            description: "Tech support ticket not found",
            variant: "destructive",
          });
          navigate('/tech-support');
          return;
        }
        throw error;
      }
      
      setTicket(data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast({
        title: "Error",
        description: "Failed to load tech support ticket",
        variant: "destructive",
      });
      navigate('/tech-support');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'in_progress' | 'problem_solved') => {
    if (!ticket) return;

    try {
      const { error } = await supabase
        .from('tech_support_tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id);

      if (error) throw error;

      setTicket({ ...ticket, status: newStatus });

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

  const handleDeleteTicket = async () => {
    if (!ticket) return;

    try {
      const { error } = await supabase
        .from('tech_support_tickets')
        .delete()
        .eq('id', ticket.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tech support ticket deleted successfully",
      });

      navigate('/tech-support');
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  if (loading) {
    return (
      <Layout userRole={userRole}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout userRole={userRole}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-foreground mb-2">Ticket Not Found</h2>
              <p className="text-muted-foreground mb-4">The requested tech support ticket could not be found.</p>
              <Button onClick={() => navigate('/tech-support')}>
                Back to Tech Support
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole={userRole}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tech-support')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tech Support
            </Button>
          </div>

          {/* Ticket Details Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <CardTitle className="text-2xl">{ticket.company_name}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Created {formatDate(ticket.created_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {ticket.created_by_name}
                    </div>
                  </div>
                  <Badge 
                    variant={ticket.status === 'problem_solved' ? "default" : "secondary"}
                    className="w-fit"
                  >
                    {ticket.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={ticket.status === 'problem_solved' ? "default" : "outline"}
                    onClick={() => handleStatusChange(
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
                        Mark as Solved
                      </>
                    )}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Tech Support Ticket</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this tech support ticket for "{ticket.company_name}"? 
                          This action cannot be undone and will also delete all associated attachments.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteTicket}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete Ticket
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Problem Description */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Problem Description</h3>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-foreground whitespace-pre-wrap">{ticket.problem_description}</p>
                </div>
              </div>
              
              {/* Action Needed */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Action Needed</h3>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-foreground whitespace-pre-wrap">{ticket.action_needed}</p>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <AttachmentViewer ticketId={ticket.id} />
              </div>

              {/* Metadata */}
              <div className="pt-4 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Created:</span>
                    <span className="ml-2 text-foreground">{formatDate(ticket.created_at)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Last Updated:</span>
                    <span className="ml-2 text-foreground">{formatDate(ticket.updated_at)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Created By:</span>
                    <span className="ml-2 text-foreground">{ticket.created_by_name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Ticket ID:</span>
                    <span className="ml-2 text-foreground font-mono text-xs">{ticket.id}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TechSupportDetail;
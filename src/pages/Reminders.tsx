import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { AlarmClock, Trash2, Loader2, Phone, Building2, User, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Sidebar from '@/components/dashboard/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import AttachmentUploader from '@/components/attachments/AttachmentUploader';
import { CalendarIcon } from 'lucide-react';

interface AttachmentFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  error?: string;
}

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
}

interface Reminder {
  id: string;
  company_name: string;
  contact_phone: string | null;
  note: string;
  remind_at: string;
  assignee_email: string;
  assignee_name: string | null;
  created_by_name: string | null;
  status: string;
  sent_at: string | null;
  created_at: string;
}

const Reminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [timeValue, setTimeValue] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [files, setFiles] = useState<AttachmentFile[]>([]);

  const fetchReminders = useCallback(async () => {
    const { data, error } = await supabase
      .from('follow_up_reminders')
      .select('*')
      .order('remind_at', { ascending: true })
      .limit(100);

    if (!error && data) setReminders(data as Reminder[]);
    setLoading(false);
  }, []);

  const fetchTeamMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from('team_members_view' as any)
      .select('id, email, full_name');

    if (!error && data) {
      setTeamMembers(data as TeamMember[]);
      // Default assignee to current user
      if (user?.email && !assigneeEmail) {
        setAssigneeEmail(user.email);
      }
    }
  }, [user?.email]);

  useEffect(() => {
    fetchReminders();
    fetchTeamMembers();
  }, [fetchReminders, fetchTeamMembers]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('follow-up-reminders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follow_up_reminders' }, () => {
        fetchReminders();
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [fetchReminders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim() || !note.trim() || !selectedDate || !timeValue || !assigneeEmail) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    const [hours, minutes] = timeValue.split(':').map(Number);
    const remindAt = new Date(selectedDate);
    remindAt.setHours(hours, minutes, 0, 0);

    if (remindAt <= new Date()) {
      toast({ title: 'Invalid time', description: 'Reminder time must be in the future.', variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      const assignee = teamMembers.find(m => m.email === assigneeEmail);
      const reminderId = crypto.randomUUID();

      const { error } = await supabase
        .from('follow_up_reminders')
        .insert({
          id: reminderId,
          company_name: companyName.trim(),
          contact_phone: contactPhone.trim() || null,
          note: note.trim(),
          remind_at: remindAt.toISOString(),
          assignee_email: assigneeEmail,
          assignee_name: assignee?.full_name || assigneeEmail,
          created_by: user?.id,
          created_by_name: user?.full_name || user?.email || 'Unknown',
        });

      if (error) throw error;

      // Upload attachments
      if (files.length > 0) {
        for (const attachmentFile of files) {
          if (attachmentFile.error) continue;

          const fileExt = attachmentFile.file.name.split('.').pop();
          const filePath = `reminders/${reminderId}/${crypto.randomUUID()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('team-files')
            .upload(filePath, attachmentFile.file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('team-files')
            .getPublicUrl(filePath);

          await supabase.from('file_attachments').insert({
            reminder_id: reminderId,
            file_name: attachmentFile.file.name,
            file_type: attachmentFile.file.type,
            file_size: attachmentFile.file.size,
            file_url: urlData.publicUrl,
            uploaded_by: user?.id || '',
            uploaded_by_name: user?.full_name || user?.email || 'Unknown',
          });
        }
      }

      toast({ title: 'Reminder created', description: `Reminder set for ${format(remindAt, 'PPP HH:mm')} → ${assignee?.full_name || assigneeEmail}` });

      // Reset form
      setCompanyName('');
      setContactPhone('');
      setNote('');
      setSelectedDate(undefined);
      setTimeValue('');
      setFiles([]);
      // Keep assignee as current user
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('follow_up_reminders').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting', description: error.message, variant: 'destructive' });
    } else {
      setReminders(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Reminder deleted' });
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case 'sent':
        return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const scheduledReminders = reminders.filter(r => r.status === 'scheduled');
  const pastReminders = reminders.filter(r => r.status !== 'scheduled');

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <Layout>
        <div className="p-6 max-w-5xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <AlarmClock className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Reminders</h1>
          </div>

          {/* Create Reminder Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="w-5 h-5" />
                Create Follow-Up Reminder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Assignee */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Assign to</label>
                  <Select value={assigneeEmail} onValueChange={setAssigneeEmail}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map(m => (
                        <SelectItem key={m.id} value={m.email}>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {m.full_name || m.email}
                            {m.email === user?.email && <span className="text-xs text-muted-foreground">(me)</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Company / Client Name *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        placeholder="e.g. Kurdo Car GmbH"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Contact Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                        placeholder="+49 123 456789"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Note / Call Summary *</label>
                  <Textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Spoke with secretary. Director is absent until today 14:00. Should call back after 14:00."
                    rows={3}
                    required
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Reminder Date *</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Reminder Time *</label>
                    <Input
                      type="time"
                      value={timeValue}
                      onChange={e => setTimeValue(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Attachments */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Attachments (optional)</label>
                  <AttachmentUploader
                    files={files}
                    onFilesChange={setFiles}
                    maxFiles={5}
                  />
                </div>

                <Button type="submit" disabled={saving} className="w-full md:w-auto">
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><AlarmClock className="w-4 h-4 mr-2" />Create Reminder</>}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Scheduled Reminders */}
          {scheduledReminders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Scheduled ({scheduledReminders.length})
              </h2>
              <div className="grid gap-3">
                {scheduledReminders.map(r => (
                  <Card key={r.id} className="border-amber-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">{r.company_name}</span>
                            {statusBadge(r.status)}
                          </div>
                          {r.contact_phone && (
                            <a href={`tel:${r.contact_phone.replace(/\s/g, '')}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                              <Phone className="w-3 h-3" />{r.contact_phone}
                            </a>
                          )}
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{r.note}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                            <span>⏰ {format(new Date(r.remind_at), 'PPP HH:mm')}</span>
                            <span>→ {r.assignee_name || r.assignee_email}</span>
                            {r.created_by_name && <span>by {r.created_by_name}</span>}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Reminders */}
          {pastReminders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Past Reminders ({pastReminders.length})
              </h2>
              <div className="grid gap-3">
                {pastReminders.map(r => (
                  <Card key={r.id} className="opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">{r.company_name}</span>
                            {statusBadge(r.status)}
                          </div>
                          {r.contact_phone && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />{r.contact_phone}
                            </span>
                          )}
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{r.note}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                            <span>⏰ {format(new Date(r.remind_at), 'PPP HH:mm')}</span>
                            <span>→ {r.assignee_name || r.assignee_email}</span>
                            {r.sent_at && <span>Sent: {format(new Date(r.sent_at), 'PPP HH:mm')}</span>}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && reminders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <AlarmClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No reminders yet. Create your first follow-up reminder above.</p>
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
};

export default Reminders;

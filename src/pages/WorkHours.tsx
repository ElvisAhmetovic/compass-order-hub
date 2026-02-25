import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Sidebar from '@/components/dashboard/Sidebar';
import MonthYearSelector from '@/components/work-hours/MonthYearSelector';
import WorkHoursTable from '@/components/work-hours/WorkHoursTable';
import { useAuth } from '@/context/AuthContext';
import { fetchAllUsers } from '@/services/workHoursService';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

const WorkHours = () => {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedUserId, setSelectedUserId] = useState(user?.id || '');
  const [users, setUsers] = useState<any[]>([]);
  const [nickname, setNickname] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user?.id) setSelectedUserId(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers().then(setUsers).catch(console.error);
    }
  }, [isAdmin]);

  // Sync nickname input when selected user changes
  useEffect(() => {
    const selected = users.find(u => u.id === selectedUserId);
    setNickname(selected?.nickname || '');
  }, [selectedUserId, users]);

  const handleNicknameBlur = async () => {
    const selected = users.find(u => u.id === selectedUserId);
    if (!selected || nickname === (selected.nickname || '')) return;

    const { error } = await supabase
      .from('profiles')
      .update({ nickname } as any)
      .eq('id', selectedUserId);

    if (error) {
      toast.error('Failed to save nickname');
      return;
    }

    setUsers(prev => prev.map(u => u.id === selectedUserId ? { ...u, nickname } : u));
    toast.success('Nickname saved');
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <Layout userRole={user?.role as any}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Work Hours</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <MonthYearSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />

            {isAdmin && users.length > 0 && (
              <div className="flex flex-col gap-2">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-[260px]">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex flex-col">
                          <span>{u.first_name} {u.last_name}</span>
                          {u.nickname && (
                            <span className="text-xs text-muted-foreground">{u.nickname}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Nickname:</span>
                  <Input
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    onBlur={handleNicknameBlur}
                    onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    placeholder="e.g. Marketing Lead"
                    className="h-7 text-xs w-[200px]"
                  />
                </div>
              </div>
            )}
          </div>

          {selectedUserId && (
            <WorkHoursTable userId={selectedUserId} month={month} year={year} />
          )}
        </div>
      </Layout>
    </div>
  );
};

export default WorkHours;

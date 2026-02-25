import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Sidebar from '@/components/dashboard/Sidebar';
import MonthYearSelector from '@/components/work-hours/MonthYearSelector';
import WorkHoursTable from '@/components/work-hours/WorkHoursTable';
import { useAuth } from '@/context/AuthContext';
import { fetchAllUsers } from '@/services/workHoursService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock } from 'lucide-react';

const WorkHours = () => {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedUserId, setSelectedUserId] = useState(user?.id || '');
  const [users, setUsers] = useState<any[]>([]);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user?.id) setSelectedUserId(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers().then(setUsers).catch(console.error);
    }
  }, [isAdmin]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <Layout userRole={user?.role as any}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Radni Sati</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <MonthYearSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />

            {isAdmin && users.length > 0 && (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Mitarbeiter wählen" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.first_name} {u.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

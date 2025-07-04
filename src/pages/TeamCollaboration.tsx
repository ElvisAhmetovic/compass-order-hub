
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InternalChat from '@/components/messaging/InternalChat';
import TaskManager from '@/components/tasks/TaskManager';
import CalendarView from '@/components/calendar/CalendarView';
import ActivityFeed from '@/components/notifications/ActivityFeed';
import SmartAlerts from '@/components/notifications/SmartAlerts';
import TeamSocialFeed from '@/components/dashboard/TeamSocialFeed';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuth } from '@/context/AuthContext';

const TeamCollaboration = () => {
  // ALL HOOKS MUST BE CALLED FIRST - before any early returns or conditional logic
  const { user } = useAuth();

  // NOW we can do conditional logic after all hooks are called
  if (!user) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Layout userRole="user">
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Please log in to access team collaboration.</p>
            </div>
          </Layout>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user.role}>
          <div className="space-y-6">
            <SmartAlerts />
            
            <div>
              <h1 className="text-3xl font-bold">Team Collaboration</h1>
              <p className="text-muted-foreground">
                Manage internal communications, tasks, and schedule with your team
              </p>
            </div>

            <Tabs defaultValue="messaging" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="messaging">Internal Messaging</TabsTrigger>
                <TabsTrigger value="tasks">Task Management</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="activity">Activity Feed</TabsTrigger>
                <TabsTrigger value="social">Team Social</TabsTrigger>
              </TabsList>

              <TabsContent value="messaging" className="space-y-6">
                <InternalChat />
              </TabsContent>

              <TabsContent value="tasks" className="space-y-6">
                <TaskManager orderId="sample-order-id" />
              </TabsContent>

              <TabsContent value="calendar" className="space-y-6">
                <CalendarView />
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <ActivityFeed />
              </TabsContent>

              <TabsContent value="social" className="space-y-6">
                <TeamSocialFeed />
              </TabsContent>
            </Tabs>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default TeamCollaboration;

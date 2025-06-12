import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Message, Channel } from '@/types/messaging';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Paperclip, Bell, Users, Volume2, Trash2 } from 'lucide-react';
import { NotificationService } from '@/services/notificationService';
import { playNotificationSound } from '@/hooks/useGlobalChatNotifications';

interface InternalChatProps {
  orderId?: string;
  channelId?: string;
}

const InternalChat = ({ orderId, channelId }: InternalChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeCount, setPurgeCount] = useState<string>('50');
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelSubscriptionRef = useRef<any>(null);
  const messageSubscriptionRef = useRef<any>(null);

  // Test notification sound function
  const testNotificationSound = () => {
    console.log('🧪 MANUAL SOUND TEST: Testing notification sound');
    playNotificationSound();
    toast({
      title: "🔊 Test Sound",
      description: "If you heard a beep, the audio system is working!",
    });
  };

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      console.log('📋 Fetching team members...');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role');
      
      if (error) {
        console.error('❌ Error fetching team members:', error);
        return;
      }

      if (data) {
        const members = data.map(member => ({
          id: member.id,
          name: `${member.first_name} ${member.last_name}`.trim(),
          role: member.role
        }));
        console.log('✅ Team members loaded:', members.length);
        setTeamMembers(members);
      }
    };
    fetchTeamMembers();
  }, []);

  // Fetch channels and setup real-time channel subscription
  useEffect(() => {
    const fetchChannels = async () => {
      console.log('📺 Fetching channels...');
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching channels:', error);
        return;
      }

      console.log('✅ Channels loaded:', data?.length || 0);
      setChannels(data || []);
      
      // Set active channel
      if (channelId) {
        setActiveChannel(channelId);
      } else if (data && data.length > 0) {
        setActiveChannel(data[0].id);
      }
    };

    fetchChannels();

    // Clean up existing subscription
    if (channelSubscriptionRef.current) {
      console.log('🧹 Cleaning up existing channel subscription');
      supabase.removeChannel(channelSubscriptionRef.current);
    }

    // Subscribe to real-time updates for channels
    console.log('🔔 Setting up channel real-time subscription');
    const channelSubscription = supabase
      .channel('channels-realtime-v4')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'channels'
      }, (payload) => {
        console.log('🆕 New channel added:', payload.new);
        const newChannel = payload.new as Channel;
        setChannels(prev => {
          const exists = prev.find(ch => ch.id === newChannel.id);
          if (exists) return prev;
          return [...prev, newChannel];
        });
        
        toast({
          title: "New Channel",
          description: `Channel "${newChannel.name}" has been created`,
        });
      })
      .subscribe((status) => {
        console.log('📺 Channel subscription status:', status);
      });

    channelSubscriptionRef.current = channelSubscription;

    return () => {
      console.log('🧹 Cleaning up channel subscription');
      if (channelSubscriptionRef.current) {
        supabase.removeChannel(channelSubscriptionRef.current);
        channelSubscriptionRef.current = null;
      }
    };
  }, [channelId]);

  // Create notifications for ALL team members when ANY message is sent
  const createMessageNotifications = async (message: Message, channelName: string) => {
    if (!user) return;

    console.log('📬 Creating notifications for message:', message.id);

    try {
      // Get all team members except the sender
      const { data: allUsers, error } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', user.id);

      if (error) {
        console.error('❌ Error fetching users for notifications:', error);
        return;
      }

      if (allUsers && allUsers.length > 0) {
        console.log(`📤 Creating notifications for ${allUsers.length} users`);
        
        // Create notifications for all other users
        const notificationPromises = allUsers.map(member => {
          console.log(`📨 Creating notification for user: ${member.id}`);
          return NotificationService.createNotification({
            user_id: member.id,
            title: `New message in ${channelName}`,
            message: `${message.sender_name}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
            type: 'info' as const,
            action_url: '/team-collaboration'
          });
        });

        await Promise.all(notificationPromises);
        console.log('✅ All notifications created successfully');
      }
    } catch (error) {
      console.error('❌ Error creating message notifications:', error);
    }
  };

  // Fetch messages for active channel and setup real-time subscription
  useEffect(() => {
    if (!activeChannel) {
      console.log('⏭️ REALTIME: No active channel, skipping message setup');
      return;
    }

    console.log('💬 REALTIME: Setting up enhanced message subscription for channel:', activeChannel);

    const fetchMessages = async () => {
      console.log('📨 REALTIME: Fetching initial messages for channel:', activeChannel);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', activeChannel)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ REALTIME: Error fetching messages:', error);
        return;
      }

      console.log('✅ REALTIME: Initial messages loaded:', data?.length || 0);
      setMessages(data || []);
    };

    fetchMessages();

    // Clear existing subscription
    if (messageSubscriptionRef.current) {
      console.log('🧹 REALTIME: Cleaning up existing message subscription');
      supabase.removeChannel(messageSubscriptionRef.current);
    }

    // Create enhanced subscription with unique channel name
    const subscriptionChannelName = `messages-realtime-enhanced-${activeChannel}-${Date.now()}`;
    console.log('🔔 REALTIME: Creating subscription:', subscriptionChannelName);
    
    const messagesSubscription = supabase
      .channel(subscriptionChannelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${activeChannel}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        console.log('🆕 REALTIME: New message received in local chat:', {
          id: newMessage.id,
          content: newMessage.content.substring(0, 50) + (newMessage.content.length > 50 ? '...' : ''),
          sender: newMessage.sender_name,
          channel: newMessage.channel_id,
          isCurrentUser: newMessage.sender_id === user?.id,
          timestamp: new Date().toISOString()
        });
        
        // Update local state immediately - avoid duplicates
        setMessages(prevMessages => {
          const exists = prevMessages.some(msg => msg.id === newMessage.id);
          if (exists) {
            console.log('⏭️ REALTIME: Message already exists locally, skipping');
            return prevMessages;
          }
          
          console.log('✅ REALTIME: Adding new message to local state');
          return [...prevMessages, newMessage];
        });

        // Show toast for messages from other users (global sound is handled by global hook)
        if (newMessage.sender_id !== user?.id) {
          console.log('💬 REALTIME: Showing local toast for incoming message');
          toast({
            title: `💬 ${newMessage.sender_name}`,
            description: newMessage.content.substring(0, 80) + (newMessage.content.length > 80 ? '...' : ''),
            duration: 3000,
          });
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${activeChannel}`
      }, (payload) => {
        console.log('🗑️ REALTIME: DELETE event received:', {
          payload: payload,
          old: payload.old,
          channel: activeChannel,
          timestamp: new Date().toISOString()
        });
        
        const deletedMessage = payload.old as Message;
        if (deletedMessage?.id) {
          console.log('🗑️ REALTIME: Processing message deletion:', deletedMessage.id);
          
          setMessages(prevMessages => {
            const beforeCount = prevMessages.length;
            const updated = prevMessages.filter(msg => msg.id !== deletedMessage.id);
            console.log(`✅ REALTIME: Removed message from local state. ${beforeCount} -> ${updated.length}`);
            return updated;
          });
        }
      })
      .subscribe((status) => {
        console.log('💬 REALTIME: Local subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ REALTIME: Successfully subscribed to local message updates');
        } else if (status === 'CLOSED') {
          console.log('❌ REALTIME: Local subscription closed');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ REALTIME: Local subscription error');
        }
      });

    messageSubscriptionRef.current = messagesSubscription;

    return () => {
      console.log('🧹 REALTIME: Cleaning up local message subscription');
      if (messageSubscriptionRef.current) {
        supabase.removeChannel(messageSubscriptionRef.current);
        messageSubscriptionRef.current = null;
      }
    };
  }, [activeChannel, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('team-files')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('team-files')
      .getPublicUrl(fileName);

    return {
      url: publicUrl,
      name: file.name,
      type: file.type
    };
  };

  // Enhanced purge function
  const purgeMessages = async (messageCount: number) => {
    if (!activeChannel || !user || isPurging) return;

    setIsPurging(true);
    
    console.log('🚀 PURGE ENHANCED: Starting purge process', {
      channel: activeChannel,
      requestedCount: messageCount,
      currentMessages: messages.length,
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    try {
      // Get messages to delete
      const { data: messagesToDelete, error: fetchError } = await supabase
        .from('messages')
        .select('id, created_at, content')
        .eq('channel_id', activeChannel)
        .order('created_at', { ascending: false })
        .limit(messageCount);

      if (fetchError) {
        console.error('❌ PURGE: Error fetching messages:', fetchError);
        throw fetchError;
      }

      if (!messagesToDelete || messagesToDelete.length === 0) {
        console.log('⚠️ PURGE: No messages to delete');
        toast({
          title: "No messages to purge",
          description: "There are no messages in this channel",
        });
        return;
      }

      console.log('📊 PURGE: Found messages to delete:', messagesToDelete.length);

      // Delete messages one by one for better reliability
      let deletedCount = 0;
      const messageIds = messagesToDelete.map(msg => msg.id);

      for (const messageId of messageIds) {
        try {
          const { error: deleteError } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

          if (deleteError) {
            console.error(`❌ PURGE: Failed to delete message ${messageId}:`, deleteError);
          } else {
            console.log(`✅ PURGE: Deleted message ${messageId}`);
            deletedCount++;
            
            // Remove from local state immediately
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
          }
        } catch (error) {
          console.error(`❌ PURGE: Exception deleting message ${messageId}:`, error);
        }
      }

      console.log('📈 PURGE: Deletion results:', {
        requested: messageCount,
        found: messagesToDelete.length,
        deleted: deletedCount
      });

      // Verify database state
      const { data: remainingMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('channel_id', activeChannel);

      console.log('🔍 PURGE: Database verification - remaining messages:', remainingMessages?.length || 0);

      // Force refresh local state
      const { data: freshMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', activeChannel)
        .order('created_at', { ascending: true });

      if (freshMessages) {
        console.log('🔄 PURGE: Force refreshed local state:', freshMessages.length);
        setMessages(freshMessages);
      }

      toast({
        title: "Purge completed",
        description: `Successfully deleted ${deletedCount} messages`,
      });

    } catch (error) {
      console.error('❌ PURGE: Process failed:', error);
      toast({
        title: "Purge failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsPurging(false);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !fileUpload) || !user || !activeChannel || isSending) return;

    setIsSending(true);
    console.log('📤 SEND: Starting to send message...');

    try {
      let fileData = null;
      if (fileUpload) {
        console.log('📎 SEND: Uploading file...');
        fileData = await uploadFile(fileUpload);
        if (!fileData) {
          toast({
            title: "Error",
            description: "Failed to upload file",
            variant: "destructive"
          });
          return;
        }
      }

      const messageContent = newMessage || `Shared file: ${fileData?.name}`;
      const activeChannelData = channels.find(ch => ch.id === activeChannel);

      console.log('📤 SEND: Sending message to database');

      const messageData = {
        sender_id: user.id,
        sender_name: user.full_name,
        sender_role: user.role,
        content: messageContent,
        channel_id: activeChannel,
        order_id: orderId,
        file_url: fileData?.url,
        file_name: fileData?.name,
        file_type: fileData?.type
      };

      const { data: insertedMessage, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('❌ SEND: Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ SEND: Message sent successfully:', insertedMessage.id);

      // Create notifications for team members
      if (insertedMessage && activeChannelData) {
        await createMessageNotifications(insertedMessage, activeChannelData.name);
      }

      // Clear form
      setNewMessage('');
      setFileUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Message sent",
        description: "Your message has been sent to the team.",
      });

    } catch (error) {
      console.error('❌ SEND: Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const createChannel = async () => {
    if (!newChannelName.trim() || !user) return;

    console.log('🆕 Creating new channel:', newChannelName);

    const { data, error } = await supabase
      .from('channels')
      .insert({
        name: newChannelName,
        type: selectedParticipants.length > 0 ? 'private' : 'general',
        created_by: user.id,
        participants: selectedParticipants,
        order_id: orderId
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating channel:', error);
      toast({
        title: "Error",
        description: "Failed to create channel",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ Channel created successfully:', data.id);

    setNewChannelName('');
    setSelectedParticipants([]);
    setIsCreateChannelOpen(false);
    setActiveChannel(data.id);
    
    toast({
      title: "Channel created",
      description: `Channel "${newChannelName}" has been created`,
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'agent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeChannelData = channels.find(ch => ch.id === activeChannel);

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Team Chat</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={testNotificationSound}
              title="Test notification sound"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={soundEnabled ? "default" : "outline"}
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              <Bell className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline"
                  disabled={!activeChannel || isPurging}
                  title="Purge chat messages"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isPurging ? 'Purging...' : 'Purge Chat'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Purge Chat Messages</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>How many recent messages would you like to delete from this channel?</p>
                    <p className="text-sm text-muted-foreground">
                      This action cannot be undone and will permanently remove the selected messages for all users.
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Delete last</span>
                      <Select value={purgeCount} onValueChange={setPurgeCount}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                          <SelectItem value="500">500</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm">messages</span>
                    </div>
                    <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                      Current messages in channel: {messages.length}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => purgeMessages(parseInt(purgeCount))}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isPurging}
                  >
                    {isPurging ? 'Purging...' : `Purge ${purgeCount} Messages`}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Channel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Channel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Channel name"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                  />
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Add participants (optional - leave empty for public channel)
                    </label>
                    <Select onValueChange={(value) => {
                      if (!selectedParticipants.includes(value)) {
                        setSelectedParticipants([...selectedParticipants, value]);
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team members..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.filter(member => member.id !== user?.id).map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} ({member.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedParticipants.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedParticipants.map(participantId => {
                          const member = teamMembers.find(m => m.id === participantId);
                          return (
                            <Badge key={participantId} variant="secondary" className="cursor-pointer" 
                              onClick={() => setSelectedParticipants(prev => prev.filter(id => id !== participantId))}>
                              {member?.name} ×
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <Button onClick={createChannel} className="w-full">
                    Create Channel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <div className="flex gap-1">
              {channels.map(channel => (
                <Button
                  key={channel.id}
                  variant={activeChannel === channel.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveChannel(channel.id)}
                  className="relative"
                >
                  {channel.type === 'private' && <Users className="h-3 w-3 mr-1" />}
                  {channel.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
        {activeChannelData && (
          <p className="text-sm text-muted-foreground">
            {activeChannelData.description} 
            {activeChannelData.type === 'private' && ` • ${activeChannelData.participants?.length || 0} participants`}
            {soundEnabled && <span className="ml-2">🔊 Notifications On</span>}
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              🔔 Real-time active
            </span>
            {isSending && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              📤 Sending...
            </span>}
            {isPurging && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
              🗑️ Purging...
            </span>}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{message.sender_name}</span>
                  <Badge className={`text-xs ${getRoleBadgeColor(message.sender_role)}`}>
                    {message.sender_role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.created_at)}
                  </span>
                </div>
                <div className="text-sm bg-muted p-2 rounded-lg max-w-[80%]">
                  {message.content}
                  {message.file_url && (
                    <div className="mt-2 p-2 bg-background rounded border">
                      {message.file_type?.startsWith('image/') ? (
                        <img 
                          src={message.file_url} 
                          alt={message.file_name} 
                          className="max-w-full h-auto rounded cursor-pointer"
                          onClick={() => window.open(message.file_url, '_blank')}
                        />
                      ) : (
                        <a 
                          href={message.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-2"
                        >
                          <Paperclip className="h-4 w-4" />
                          {message.file_name}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <Separator />
        
        <div className="p-4">
          {fileUpload && (
            <div className="mb-2 p-2 bg-muted rounded flex items-center justify-between">
              <span className="text-sm">{fileUpload.name}</span>
              <Button size="sm" variant="ghost" onClick={() => setFileUpload(null)}>×</Button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setFileUpload(file);
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              className="flex-1"
              disabled={isSending}
            />
            <Button 
              onClick={sendMessage} 
              disabled={(!newMessage.trim() && !fileUpload) || isSending}
            >
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InternalChat;

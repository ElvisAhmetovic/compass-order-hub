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
    console.log('🧪 Testing notification sound manually');
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
      
      console.log('✅ Test sound played');
      toast({
        title: "🔊 Test Sound",
        description: "If you heard a beep, the audio system is working!",
      });
    } catch (error) {
      console.error('❌ Test sound failed:', error);
      toast({
        title: "❌ Audio Test Failed",
        description: "There might be an issue with audio permissions.",
        variant: "destructive"
      });
    }
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
      console.log('⏭️ No active channel, skipping message setup');
      return;
    }

    console.log('💬 Setting up messages for channel:', activeChannel);

    const fetchMessages = async () => {
      console.log('📨 Fetching messages for channel:', activeChannel);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', activeChannel)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching messages:', error);
        return;
      }

      console.log('✅ Messages loaded:', data?.length || 0);
      setMessages(data || []);
    };

    fetchMessages();

    // Clean up existing message subscription
    if (messageSubscriptionRef.current) {
      console.log('🧹 Cleaning up existing message subscription');
      supabase.removeChannel(messageSubscriptionRef.current);
    }

    // Subscribe to real-time updates for messages in this channel
    console.log('🔔 Setting up message real-time subscription for channel:', activeChannel);
    const messagesSubscription = supabase
      .channel(`messages-realtime-${activeChannel}-v9`) // Updated version for purge support
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${activeChannel}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        console.log('🆕 LOCAL CHAT: New message received:', {
          id: newMessage.id,
          content: newMessage.content.substring(0, 50),
          sender: newMessage.sender_name,
          channel: newMessage.channel_id,
          isCurrentUser: newMessage.sender_id === user?.id,
          timestamp: new Date().toISOString()
        });
        
        // Add message to local state immediately
        setMessages(prevMessages => {
          // Check if message already exists by ID
          const messageExists = prevMessages.some(msg => msg.id === newMessage.id);
          if (messageExists) {
            console.log('⏭️ Message already exists in local state, skipping');
            return prevMessages;
          }
          
          console.log('✅ Adding new message to local state');
          return [...prevMessages, newMessage];
        });

        // Show local toast for messages from other users (but don't play sound here - global hook handles that)
        if (newMessage.sender_id !== user?.id) {
          console.log('💬 LOCAL CHAT: Showing toast for incoming message');
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
        const deletedMessage = payload.old as Message;
        console.log('🗑️ LOCAL CHAT: Message deleted:', deletedMessage.id);
        
        // Remove message from local state immediately
        setMessages(prevMessages => {
          const updatedMessages = prevMessages.filter(msg => msg.id !== deletedMessage.id);
          console.log(`✅ Removed message ${deletedMessage.id} from local state. ${prevMessages.length} -> ${updatedMessages.length}`);
          return updatedMessages;
        });
      })
      .subscribe((status) => {
        console.log('💬 Local message subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to message updates for channel:', activeChannel);
        } else if (status === 'CLOSED') {
          console.log('❌ Message subscription closed for channel:', activeChannel);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Message subscription error for channel:', activeChannel);
        }
      });

    messageSubscriptionRef.current = messagesSubscription;

    return () => {
      console.log('🧹 Cleaning up message subscription');
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

  // Fixed purge chat messages function
  const purgeMessages = async (messageCount: number) => {
    if (!activeChannel || !user || isPurging) return;

    setIsPurging(true);
    console.log(`🗑️ Starting purge of last ${messageCount} messages from channel:`, activeChannel);

    try {
      // Get the last N messages from the current channel, ordered by creation time (newest first)
      const { data: messagesToDelete, error: fetchError } = await supabase
        .from('messages')
        .select('id, created_at')
        .eq('channel_id', activeChannel)
        .order('created_at', { ascending: false })
        .limit(messageCount);

      if (fetchError) {
        console.error('❌ Error fetching messages to delete:', fetchError);
        toast({
          title: "Error",
          description: "Failed to fetch messages for deletion",
          variant: "destructive"
        });
        return;
      }

      if (!messagesToDelete || messagesToDelete.length === 0) {
        toast({
          title: "No messages to purge",
          description: "There are no messages to delete in this channel",
        });
        return;
      }

      const messageIds = messagesToDelete.map(msg => msg.id);
      console.log(`🗑️ About to delete ${messageIds.length} messages:`, messageIds);

      // Delete the messages from Supabase - this will trigger real-time DELETE events
      const { error: deleteError, count } = await supabase
        .from('messages')
        .delete({ count: 'exact' })
        .in('id', messageIds);

      if (deleteError) {
        console.error('❌ Error deleting messages from database:', deleteError);
        toast({
          title: "Error",
          description: `Failed to purge messages: ${deleteError.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log(`✅ Successfully deleted ${count} messages from database`);

      // Get channel name for notification
      const activeChannelData = channels.find(ch => ch.id === activeChannel);
      const channelName = activeChannelData?.name || 'Unknown Channel';

      // Create notifications for all team members about the purge
      if (teamMembers.length > 0) {
        console.log('📬 Creating purge notifications for all team members...');
        
        const notificationPromises = teamMembers
          .filter(member => member.id !== user.id)
          .map(member => {
            console.log(`📨 Creating purge notification for user: ${member.id}`);
            return NotificationService.createNotification({
              user_id: member.id,
              title: `💬 Chat purged in ${channelName}`,
              message: `${user.full_name} purged ${count || messageIds.length} messages from ${channelName}`,
              type: 'info' as const,
              action_url: '/team-collaboration'
            });
          });

        await Promise.all(notificationPromises);
        console.log('✅ All purge notifications created successfully');
      }
      
      toast({
        title: "Messages purged",
        description: `Successfully deleted ${count || messageIds.length} messages from the chat`,
      });

    } catch (error) {
      console.error('❌ Unexpected error during purge:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while purging messages",
        variant: "destructive"
      });
    } finally {
      setIsPurging(false);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !fileUpload) || !user || !activeChannel || isSending) return;

    setIsSending(true);
    console.log('📤 Starting to send message...');

    try {
      let fileData = null;
      if (fileUpload) {
        console.log('📎 Uploading file...');
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

      console.log('📤 Sending message to database:', messageContent);

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

      console.log('📨 Message data being sent:', messageData);

      const { data: insertedMessage, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Message sent successfully:', insertedMessage);

      // Create notifications for ALL team members
      if (insertedMessage && activeChannelData) {
        console.log('📬 Creating notifications for all team members...');
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
      console.error('❌ Unexpected error sending message:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while sending your message",
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

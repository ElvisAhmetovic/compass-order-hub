
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Message, Channel } from '@/types/messaging';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Paperclip, Image, Users } from 'lucide-react';

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
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role');
      
      if (data) {
        setTeamMembers(data.map(member => ({
          id: member.id,
          name: `${member.first_name} ${member.last_name}`.trim(),
          role: member.role
        })));
      }
    };
    fetchTeamMembers();
  }, []);

  // Fetch channels
  useEffect(() => {
    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching channels:', error);
        return;
      }

      setChannels(data || []);
      
      // Set active channel
      if (channelId) {
        setActiveChannel(channelId);
      } else if (data && data.length > 0) {
        setActiveChannel(data[0].id);
      }
    };

    fetchChannels();
  }, [channelId]);

  // Fetch messages for active channel
  useEffect(() => {
    if (!activeChannel) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', activeChannel)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`messages-${activeChannel}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${activeChannel}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const sendMessage = async () => {
    if ((!newMessage.trim() && !fileUpload) || !user || !activeChannel) return;

    let fileData = null;
    if (fileUpload) {
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

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        sender_name: user.full_name,
        sender_role: user.role,
        content: newMessage || `Shared file: ${fileData?.name}`,
        channel_id: activeChannel,
        order_id: orderId,
        file_url: fileData?.url,
        file_name: fileData?.name,
        file_type: fileData?.type
      });

    if (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      return;
    }

    setNewMessage('');
    setFileUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast({
      title: "Message sent",
      description: "Your message has been sent to the team.",
    });
  };

  const createChannel = async () => {
    if (!newChannelName.trim() || !user) return;

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
      console.error('Error creating channel:', error);
      toast({
        title: "Error",
        description: "Failed to create channel",
        variant: "destructive"
      });
      return;
    }

    setChannels(prev => [...prev, data]);
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
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                fileInputRef.current?.setAttribute('accept', 'image/*');
                fileInputRef.current?.click();
              }}
            >
              <Image className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim() && !fileUpload}>
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InternalChat;

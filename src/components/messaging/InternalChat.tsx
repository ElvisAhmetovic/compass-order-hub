
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Message, Channel } from '@/types/messaging';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface InternalChatProps {
  orderId?: string;
  channelId?: string;
}

const InternalChat = ({ orderId, channelId }: InternalChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockChannels: Channel[] = [
      { id: 'general', name: 'General', type: 'general', created_by: 'system', created_at: new Date().toISOString() },
      { id: 'order-123', name: 'Order Discussion', type: 'order', created_by: 'admin', created_at: new Date().toISOString(), order_id: orderId }
    ];
    
    const mockMessages: Message[] = [
      {
        id: '1',
        sender_id: 'user1',
        sender_name: 'John Doe',
        sender_role: 'admin',
        content: 'Welcome to the team chat!',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        channel_id: 'general'
      },
      {
        id: '2',
        sender_id: 'user2',
        sender_name: 'Jane Smith',
        sender_role: 'agent',
        content: 'Thanks! Excited to collaborate.',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        channel_id: 'general'
      }
    ];

    setChannels(mockChannels);
    setMessages(mockMessages);
  }, [orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const message: Message = {
      id: Date.now().toString(),
      sender_id: user.id,
      sender_name: user.full_name,
      sender_role: user.role,
      content: newMessage,
      created_at: new Date().toISOString(),
      channel_id: activeChannel
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    toast({
      title: "Message sent",
      description: "Your message has been sent to the team.",
    });
  };

  const filteredMessages = messages.filter(msg => msg.channel_id === activeChannel);

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

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Team Chat</CardTitle>
          <div className="flex gap-2">
            {channels.map(channel => (
              <Button
                key={channel.id}
                variant={activeChannel === channel.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveChannel(channel.id)}
              >
                {channel.name}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4">
            {filteredMessages.map((message) => (
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
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <Separator />
        
        <div className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim()}>
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InternalChat;

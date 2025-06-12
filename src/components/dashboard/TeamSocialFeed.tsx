
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Heart, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface SocialPost {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  content: string;
  type: 'announcement' | 'achievement' | 'update' | 'celebration';
  likes: string[]; // array of user IDs who liked
  comments: SocialComment[];
  created_at: string;
  tags?: string[];
}

interface SocialComment {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

const TeamSocialFeed = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState<SocialPost['type']>('update');
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // For demo, create some sample posts
    const samplePosts: SocialPost[] = [
      {
        id: '1',
        author_id: user.id,
        author_name: user.full_name || 'Team Member',
        author_role: user.role || 'user',
        content: '🎉 Just completed a major order for our biggest client! Great teamwork everyone!',
        type: 'achievement',
        likes: [],
        comments: [],
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        tags: ['milestone', 'teamwork']
      },
      {
        id: '2',
        author_id: 'system',
        author_name: 'System',
        author_role: 'admin',
        content: '📢 New feature: Smart Alerts are now live! Check your notifications for context-aware updates.',
        type: 'announcement',
        likes: [],
        comments: [],
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        tags: ['feature', 'announcement']
      }
    ];

    setPosts(samplePosts);
  }, [user]);

  const createPost = async () => {
    if (!newPost.trim() || !user) return;

    const post: SocialPost = {
      id: Date.now().toString(),
      author_id: user.id,
      author_name: user.full_name || 'Team Member',
      author_role: user.role || 'user',
      content: newPost,
      type: postType,
      likes: [],
      comments: [],
      created_at: new Date().toISOString(),
      tags: []
    };

    setPosts(prev => [post, ...prev]);
    setNewPost('');
  };

  const toggleLike = (postId: string) => {
    if (!user) return;

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const likes = post.likes.includes(user.id)
          ? post.likes.filter(id => id !== user.id)
          : [...post.likes, user.id];
        return { ...post, likes };
      }
      return post;
    }));
  };

  const addComment = (postId: string) => {
    if (!user || !commentInputs[postId]?.trim()) return;

    const comment: SocialComment = {
      id: Date.now().toString(),
      author_id: user.id,
      author_name: user.full_name || 'Team Member',
      content: commentInputs[postId],
      created_at: new Date().toISOString()
    };

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, comments: [...post.comments, comment] };
      }
      return post;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const getTypeColor = (type: SocialPost['type']) => {
    switch (type) {
      case 'announcement': return 'bg-blue-100 text-blue-800';
      case 'achievement': return 'bg-green-100 text-green-800';
      case 'celebration': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeEmoji = (type: SocialPost['type']) => {
    switch (type) {
      case 'announcement': return '📢';
      case 'achievement': return '🏆';
      case 'celebration': return '🎉';
      default: return '💬';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'agent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Social Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Post */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
          <div className="flex gap-2">
            <select 
              value={postType} 
              onChange={(e) => setPostType(e.target.value as SocialPost['type'])}
              className="px-3 py-1 rounded border text-sm"
            >
              <option value="update">Update</option>
              <option value="announcement">Announcement</option>
              <option value="achievement">Achievement</option>
              <option value="celebration">Celebration</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Share an update with your team..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createPost()}
            />
            <Button onClick={createPost} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Posts Feed */}
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="p-4 border rounded-lg bg-background">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTypeEmoji(post.type)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{post.author_name}</span>
                        <Badge className={`text-xs ${getRoleBadgeColor(post.author_role)}`}>
                          {post.author_role}
                        </Badge>
                        <Badge className={`text-xs ${getTypeColor(post.type)}`}>
                          {post.type}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm mb-3 whitespace-pre-wrap">{post.content}</p>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(post.id)}
                    className={post.likes.includes(user?.id || '') ? 'text-red-500' : ''}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${post.likes.includes(user?.id || '') ? 'fill-current' : ''}`} />
                    {post.likes.length}
                  </Button>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {post.comments.length}
                  </span>
                </div>

                {post.comments.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <Separator />
                    {post.comments.map(comment => (
                      <div key={comment.id} className="text-sm">
                        <span className="font-medium">{comment.author_name}:</span>
                        <span className="ml-2">{comment.content}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={() => addComment(post.id)}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TeamSocialFeed;

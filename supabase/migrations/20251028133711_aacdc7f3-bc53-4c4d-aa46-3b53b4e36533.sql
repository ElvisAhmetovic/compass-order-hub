-- Create reactions table
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('order', 'ticket')),
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, user_id, emoji)
);

-- Create indexes for better query performance
CREATE INDEX idx_reactions_entity ON reactions(entity_type, entity_id);
CREATE INDEX idx_reactions_user ON reactions(user_id);

-- Enable Row Level Security
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all reactions" 
  ON reactions FOR SELECT 
  USING (true);

CREATE POLICY "Users can add reactions" 
  ON reactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions" 
  ON reactions FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable Real-time
ALTER TABLE reactions REPLICA IDENTITY FULL;
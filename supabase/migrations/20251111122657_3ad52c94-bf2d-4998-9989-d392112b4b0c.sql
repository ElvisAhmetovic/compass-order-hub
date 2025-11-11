-- Create team_activities table for live activity feed
CREATE TABLE team_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'achievement_unlocked', 'streak_milestone', 'rank_change', 'milestone_reached', 'order_created'
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_team_activities_created_at ON team_activities(created_at DESC);
CREATE INDEX idx_team_activities_user_id ON team_activities(user_id);
CREATE INDEX idx_team_activities_type ON team_activities(activity_type);

-- RLS Policies for team_activities
ALTER TABLE team_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all team activities"
  ON team_activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own activities"
  ON team_activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
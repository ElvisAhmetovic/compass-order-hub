-- Create team_challenges table
CREATE TABLE team_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  target INTEGER NOT NULL,
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_team_challenges_active ON team_challenges(is_active, end_date DESC);
CREATE INDEX idx_team_challenges_period ON team_challenges(period, is_active);

-- RLS Policies for team_challenges
ALTER TABLE team_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team challenges"
  ON team_challenges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage team challenges"
  ON team_challenges FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
-- Create achievement_definitions table
CREATE TABLE achievement_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  criteria JSONB NOT NULL,
  tier TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievement_definitions(id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 100,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);

-- Create user_streaks table
CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_order_date DATE,
  streak_freezes_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_streaks_current_streak ON user_streaks(current_streak DESC);

-- RLS Policies for achievement_definitions
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievement definitions"
  ON achievement_definitions FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for user_streaks
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all streaks"
  ON user_streaks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own streak"
  ON user_streaks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Seed achievement definitions
INSERT INTO achievement_definitions (id, name, description, icon, category, criteria, tier, points) VALUES
-- Milestone Achievements
('first_order', 'First Steps', 'Create your first order', '🎯', 'milestone', '{"type": "order_count", "value": 1}', 'bronze', 10),
('novice_10', 'Novice', 'Create 10 orders', '📝', 'milestone', '{"type": "order_count", "value": 10}', 'bronze', 25),
('intermediate_25', 'Getting Started', 'Create 25 orders', '📈', 'milestone', '{"type": "order_count", "value": 25}', 'silver', 50),
('advanced_50', 'Professional', 'Create 50 orders', '💼', 'milestone', '{"type": "order_count", "value": 50}', 'silver', 100),
('expert_100', 'Expert', 'Create 100 orders', '⭐', 'milestone', '{"type": "order_count", "value": 100}', 'gold', 200),
('master_250', 'Master', 'Create 250 orders', '🏆', 'milestone', '{"type": "order_count", "value": 250}', 'gold', 500),
('legend_500', 'Legend', 'Create 500 orders', '👑', 'milestone', '{"type": "order_count", "value": 500}', 'platinum', 1000),

-- Streak Achievements
('streak_3', 'On Fire', '3 day order streak', '🔥', 'streak', '{"type": "streak", "value": 3}', 'bronze', 15),
('streak_7', 'Week Warrior', '7 day order streak', '⚡', 'streak', '{"type": "streak", "value": 7}', 'silver', 50),
('streak_14', 'Two Week Wonder', '14 day order streak', '💥', 'streak', '{"type": "streak", "value": 14}', 'silver', 100),
('streak_30', 'Monthly Machine', '30 day order streak', '🌟', 'streak', '{"type": "streak", "value": 30}', 'gold', 250),
('streak_100', 'Unstoppable', '100 day order streak', '🚀', 'streak', '{"type": "streak", "value": 100}', 'platinum', 1000),

-- Daily Performance
('daily_5', 'Speed Demon', 'Create 5 orders in one day', '⚡', 'speed', '{"type": "daily_orders", "value": 5}', 'bronze', 20),
('daily_10', 'Productivity King', 'Create 10 orders in one day', '👑', 'speed', '{"type": "daily_orders", "value": 10}', 'silver', 75),
('daily_20', 'Superhuman', 'Create 20 orders in one day', '💪', 'speed', '{"type": "daily_orders", "value": 20}', 'gold', 200),

-- Rank Achievements
('rank_1', 'Champion', 'Reach #1 in rankings', '🥇', 'milestone', '{"type": "rank", "value": 1}', 'gold', 100),
('rank_top3', 'Podium Finisher', 'Finish in top 3', '🥉', 'milestone', '{"type": "rank", "value": 3}', 'silver', 50);
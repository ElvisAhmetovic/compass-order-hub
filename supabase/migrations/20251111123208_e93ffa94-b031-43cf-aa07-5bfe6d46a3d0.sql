-- Enable realtime for team_activities table
ALTER TABLE team_activities REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE team_activities;
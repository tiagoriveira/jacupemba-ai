-- Migration: Add likes system for reports and comments
-- Created: 2026-02-07

-- Create report_likes table
CREATE TABLE IF NOT EXISTS report_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES anonymous_reports(id) ON DELETE CASCADE,
  user_fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES report_comments(id) ON DELETE CASCADE,
  user_fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_report_likes_report_id ON report_likes(report_id);
CREATE INDEX IF NOT EXISTS idx_report_likes_fingerprint ON report_likes(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_report_likes_report_fingerprint ON report_likes(report_id, user_fingerprint);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_fingerprint ON comment_likes(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_fingerprint ON comment_likes(comment_id, user_fingerprint);

-- Add unique constraint to prevent duplicate likes
ALTER TABLE report_likes ADD CONSTRAINT unique_report_like 
  UNIQUE (report_id, user_fingerprint);

ALTER TABLE comment_likes ADD CONSTRAINT unique_comment_like 
  UNIQUE (comment_id, user_fingerprint);

-- Enable RLS (Row Level Security)
ALTER TABLE report_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for report_likes
CREATE POLICY "Anyone can view report likes" ON report_likes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert report likes" ON report_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own report likes" ON report_likes
  FOR DELETE USING (true);

-- Create policies for comment_likes
CREATE POLICY "Anyone can view comment likes" ON comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert comment likes" ON comment_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own comment likes" ON comment_likes
  FOR DELETE USING (true);

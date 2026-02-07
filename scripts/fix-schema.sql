-- =============================================================
-- Jacupemba AI - Complete Schema Fix Migration
-- Fixes all column name mismatches and creates missing tables
-- =============================================================

-- 1. Fix anonymous_reports table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS anonymous_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure status column exists with correct values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'anonymous_reports' AND column_name = 'status'
  ) THEN
    ALTER TABLE anonymous_reports ADD COLUMN status TEXT NOT NULL DEFAULT 'pendente';
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_reports_category ON anonymous_reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON anonymous_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON anonymous_reports(status);

-- 2. Fix local_businesses table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS local_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  hours TEXT,
  verified BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ BEGIN
  -- Add 'hours' column (code uses 'hours', some scripts used 'opening_hours' or 'business_hours')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'local_businesses' AND column_name = 'hours'
  ) THEN
    -- Check if opening_hours or business_hours exists and rename
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'local_businesses' AND column_name = 'opening_hours'
    ) THEN
      ALTER TABLE local_businesses RENAME COLUMN opening_hours TO hours;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'local_businesses' AND column_name = 'business_hours'
    ) THEN
      ALTER TABLE local_businesses RENAME COLUMN business_hours TO hours;
    ELSE
      ALTER TABLE local_businesses ADD COLUMN hours TEXT;
    END IF;
  END IF;

  -- Add 'verified' column (code uses 'verified', some scripts used 'is_verified')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'local_businesses' AND column_name = 'verified'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'local_businesses' AND column_name = 'is_verified'
    ) THEN
      ALTER TABLE local_businesses RENAME COLUMN is_verified TO verified;
    ELSE
      ALTER TABLE local_businesses ADD COLUMN verified BOOLEAN DEFAULT false;
    END IF;
  END IF;

  -- Add 'status' column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'local_businesses' AND column_name = 'status'
  ) THEN
    ALTER TABLE local_businesses ADD COLUMN status TEXT NOT NULL DEFAULT 'pendente';
  END IF;

  -- Add 'description' column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'local_businesses' AND column_name = 'description'
  ) THEN
    ALTER TABLE local_businesses ADD COLUMN description TEXT;
  END IF;

  -- Add 'whatsapp' column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'local_businesses' AND column_name = 'whatsapp'
  ) THEN
    ALTER TABLE local_businesses ADD COLUMN whatsapp TEXT;
  END IF;

  -- Add 'updated_at' column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'local_businesses' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE local_businesses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_businesses_category ON local_businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON local_businesses(status);

-- 3. Fix vitrine_posts table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vitrine_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_name TEXT NOT NULL,
  seller_phone TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2),
  category TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  expires_at TIMESTAMPTZ NOT NULL,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vitrine_posts' AND column_name = 'status'
  ) THEN
    ALTER TABLE vitrine_posts ADD COLUMN status TEXT NOT NULL DEFAULT 'pendente';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vitrine_posts' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE vitrine_posts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vitrine_expires ON vitrine_posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_vitrine_created ON vitrine_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vitrine_status ON vitrine_posts(status);

-- 4. Create report_comments table (MISSING - referenced by code but never created)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES anonymous_reports(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_report_id ON report_comments(report_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON report_comments(created_at);

-- 5. Create report_likes table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES anonymous_reports(id) ON DELETE CASCADE,
  user_fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_likes_report_id ON report_likes(report_id);
CREATE INDEX IF NOT EXISTS idx_report_likes_fingerprint ON report_likes(user_fingerprint);

-- Add unique constraint if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_report_like'
  ) THEN
    ALTER TABLE report_likes ADD CONSTRAINT unique_report_like UNIQUE (report_id, user_fingerprint);
  END IF;
END $$;

-- 6. Create comment_likes table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES report_comments(id) ON DELETE CASCADE,
  user_fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_fingerprint ON comment_likes(user_fingerprint);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_comment_like'
  ) THEN
    ALTER TABLE comment_likes ADD CONSTRAINT unique_comment_like UNIQUE (comment_id, user_fingerprint);
  END IF;
END $$;

-- 7. RLS Policies (permissive for anonymous app)
-- ---------------------------------------------------------------
ALTER TABLE anonymous_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitrine_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts, then recreate
DO $$ BEGIN
  -- anonymous_reports
  DROP POLICY IF EXISTS "Anyone can view reports" ON anonymous_reports;
  DROP POLICY IF EXISTS "Anyone can insert reports" ON anonymous_reports;
  DROP POLICY IF EXISTS "Anyone can update reports" ON anonymous_reports;
  DROP POLICY IF EXISTS "Anyone can delete reports" ON anonymous_reports;
  
  CREATE POLICY "Anyone can view reports" ON anonymous_reports FOR SELECT USING (true);
  CREATE POLICY "Anyone can insert reports" ON anonymous_reports FOR INSERT WITH CHECK (true);
  CREATE POLICY "Anyone can update reports" ON anonymous_reports FOR UPDATE USING (true);
  CREATE POLICY "Anyone can delete reports" ON anonymous_reports FOR DELETE USING (true);

  -- report_comments
  DROP POLICY IF EXISTS "Anyone can view comments" ON report_comments;
  DROP POLICY IF EXISTS "Anyone can insert comments" ON report_comments;
  DROP POLICY IF EXISTS "Anyone can delete comments" ON report_comments;
  
  CREATE POLICY "Anyone can view comments" ON report_comments FOR SELECT USING (true);
  CREATE POLICY "Anyone can insert comments" ON report_comments FOR INSERT WITH CHECK (true);
  CREATE POLICY "Anyone can delete comments" ON report_comments FOR DELETE USING (true);

  -- report_likes
  DROP POLICY IF EXISTS "Anyone can view report likes" ON report_likes;
  DROP POLICY IF EXISTS "Anyone can insert report likes" ON report_likes;
  DROP POLICY IF EXISTS "Anyone can delete report likes" ON report_likes;
  
  CREATE POLICY "Anyone can view report likes" ON report_likes FOR SELECT USING (true);
  CREATE POLICY "Anyone can insert report likes" ON report_likes FOR INSERT WITH CHECK (true);
  CREATE POLICY "Anyone can delete report likes" ON report_likes FOR DELETE USING (true);

  -- comment_likes
  DROP POLICY IF EXISTS "Anyone can view comment likes" ON comment_likes;
  DROP POLICY IF EXISTS "Anyone can insert comment likes" ON comment_likes;
  DROP POLICY IF EXISTS "Anyone can delete comment likes" ON comment_likes;
  
  CREATE POLICY "Anyone can view comment likes" ON comment_likes FOR SELECT USING (true);
  CREATE POLICY "Anyone can insert comment likes" ON comment_likes FOR INSERT WITH CHECK (true);
  CREATE POLICY "Anyone can delete comment likes" ON comment_likes FOR DELETE USING (true);

  -- local_businesses
  DROP POLICY IF EXISTS "Anyone can view businesses" ON local_businesses;
  DROP POLICY IF EXISTS "Anyone can insert businesses" ON local_businesses;
  DROP POLICY IF EXISTS "Anyone can update businesses" ON local_businesses;
  DROP POLICY IF EXISTS "Anyone can delete businesses" ON local_businesses;
  
  CREATE POLICY "Anyone can view businesses" ON local_businesses FOR SELECT USING (true);
  CREATE POLICY "Anyone can insert businesses" ON local_businesses FOR INSERT WITH CHECK (true);
  CREATE POLICY "Anyone can update businesses" ON local_businesses FOR UPDATE USING (true);
  CREATE POLICY "Anyone can delete businesses" ON local_businesses FOR DELETE USING (true);

  -- vitrine_posts
  DROP POLICY IF EXISTS "Anyone can view vitrine" ON vitrine_posts;
  DROP POLICY IF EXISTS "Anyone can insert vitrine" ON vitrine_posts;
  DROP POLICY IF EXISTS "Anyone can update vitrine" ON vitrine_posts;
  DROP POLICY IF EXISTS "Anyone can delete vitrine" ON vitrine_posts;
  
  CREATE POLICY "Anyone can view vitrine" ON vitrine_posts FOR SELECT USING (true);
  CREATE POLICY "Anyone can insert vitrine" ON vitrine_posts FOR INSERT WITH CHECK (true);
  CREATE POLICY "Anyone can update vitrine" ON vitrine_posts FOR UPDATE USING (true);
  CREATE POLICY "Anyone can delete vitrine" ON vitrine_posts FOR DELETE USING (true);
END $$;

-- 8. Updated_at trigger function
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS update_reports_updated_at ON anonymous_reports;
DROP TRIGGER IF EXISTS update_businesses_updated_at ON local_businesses;
DROP TRIGGER IF EXISTS update_vitrine_updated_at ON vitrine_posts;

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON anonymous_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON local_businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vitrine_updated_at
  BEFORE UPDATE ON vitrine_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add preferred language to profiles (nullable)
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS language VARCHAR(10);
@@

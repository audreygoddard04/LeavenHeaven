-- Allow users to insert their own profile (for OAuth users when trigger hasn't run or fails)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

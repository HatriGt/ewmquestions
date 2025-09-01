-- Create table for storing question modifications
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS question_modifications (
    id BIGSERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL,
    correct_answers TEXT[] NOT NULL,
    options JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index on question_id to ensure one modification per question
CREATE UNIQUE INDEX IF NOT EXISTS idx_question_modifications_question_id 
ON question_modifications(question_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_question_modifications_modtime 
    BEFORE UPDATE ON question_modifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security (RLS)
ALTER TABLE question_modifications ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access" ON question_modifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON question_modifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON question_modifications FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON question_modifications FOR DELETE USING (true);
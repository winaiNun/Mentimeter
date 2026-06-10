-- Add slide_started_at column to presentations table
ALTER TABLE public.presentations
ADD COLUMN slide_started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

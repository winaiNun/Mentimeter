-- Create participants table
CREATE TABLE public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES public.presentations(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    nickname TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(presentation_id, session_id)
);

-- Enable RLS
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read participants (to display on presenter screen)
CREATE POLICY "Allow public read access to participants"
    ON public.participants FOR SELECT
    USING (true);

-- Allow anyone to join/insert themselves as a participant
CREATE POLICY "Allow public insert access to participants"
    ON public.participants FOR INSERT
    WITH CHECK (true);

-- Allow participants to update their nickname/emoji if they want to
CREATE POLICY "Allow public update access to participants"
    ON public.participants FOR UPDATE
    USING (true);

-- Allow creators to delete/reset participants
CREATE POLICY "Allow creators to delete participants of their presentations"
    ON public.participants FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.presentations
            WHERE public.presentations.id = public.participants.presentation_id
            AND public.presentations.user_id = auth.uid()
        )
    );

-- Enable Realtime
alter publication supabase_realtime add table public.participants;

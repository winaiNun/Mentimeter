-- Create presentations table
CREATE TABLE public.presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    join_code VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    current_slide_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create slides table
CREATE TABLE public.slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES public.presentations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'multiple_choice', 'word_cloud', 'scales', 'quiz', 'q_and_a'
    question TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb, -- list of options: [{id: 1, text: "Yes"}, {id: 2, text: "No"}]
    position INT NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create responses table
CREATE TABLE public.responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slide_id UUID REFERENCES public.slides(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    response_value JSONB NOT NULL, -- { "selected_option_id": 1 } or { "text": "great" }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Create Policies for Presentations
CREATE POLICY "Allow public read-only access to presentations"
    ON public.presentations FOR SELECT
    USING (true);

CREATE POLICY "Allow creators all operations on presentations"
    ON public.presentations FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create Policies for Slides
CREATE POLICY "Allow public read-only access to slides"
    ON public.slides FOR SELECT
    USING (true);

CREATE POLICY "Allow creators all operations on slides of their presentations"
    ON public.slides FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.presentations
            WHERE public.presentations.id = public.slides.presentation_id
            AND public.presentations.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.presentations
            WHERE public.presentations.id = public.slides.presentation_id
            AND public.presentations.user_id = auth.uid()
        )
    );

-- Create Policies for Responses
CREATE POLICY "Allow public select access to responses"
    ON public.responses FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert access to responses"
    ON public.responses FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow creators to delete responses on their slides"
    ON public.responses FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.slides
            JOIN public.presentations ON public.presentations.id = public.slides.presentation_id
            WHERE public.slides.id = public.responses.slide_id
            AND public.presentations.user_id = auth.uid()
        )
    );

-- Enable Realtime for all tables
alter publication supabase_realtime add table public.presentations;
alter publication supabase_realtime add table public.slides;
alter publication supabase_realtime add table public.responses;

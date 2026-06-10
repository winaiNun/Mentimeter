-- =============================================================================
-- Mentimeter Clone — Full Production Schema
-- Run this entire file in your Supabase SQL Editor (new project → SQL Editor)
-- =============================================================================

-- ─── TABLES ──────────────────────────────────────────────────────────────────

CREATE TABLE public.presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    join_code VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    current_slide_index INT DEFAULT 0,
    slide_started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    quiz_reveal_slide_id UUID DEFAULT NULL,  -- FK to slides added below after slides table
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES public.presentations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    -- 'multiple_choice' | 'word_cloud' | 'quiz' | 'q_and_a'
    question TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    -- MC/Quiz: [{id, text, isCorrect?}]
    -- word_cloud: [{id, text}]  (suggested tags)
    position INT NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    -- { timer_limit: 0, allow_multiple_submissions: true }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add FK from presentations.quiz_reveal_slide_id → slides.id (circular dep, added after slides)
ALTER TABLE public.presentations
  ADD CONSTRAINT presentations_quiz_reveal_slide_id_fkey
  FOREIGN KEY (quiz_reveal_slide_id) REFERENCES public.slides(id) ON DELETE SET NULL;

CREATE TABLE public.responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slide_id UUID REFERENCES public.slides(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    response_value JSONB NOT NULL,
    -- MC/Quiz:      { selected_option_id: "..." }
    -- word_cloud:   { text: "..." }
    -- Q&A question: { type: "qa", id: "q_...", text: "...", isAnswered: false }
    -- Q&A upvote:   { type: "qa_upvote", question_id: "q_..." }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES public.presentations(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    nickname TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(presentation_id, session_id)
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants  ENABLE ROW LEVEL SECURITY;

-- Presentations
CREATE POLICY "presentations_public_read"
    ON public.presentations FOR SELECT USING (true);

CREATE POLICY "presentations_owner_all"
    ON public.presentations FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Slides
CREATE POLICY "slides_public_read"
    ON public.slides FOR SELECT USING (true);

CREATE POLICY "slides_owner_all"
    ON public.slides FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.presentations p
            WHERE p.id = public.slides.presentation_id
            AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.presentations p
            WHERE p.id = public.slides.presentation_id
            AND p.user_id = auth.uid()
        )
    );

-- Responses
CREATE POLICY "responses_public_read"
    ON public.responses FOR SELECT USING (true);

CREATE POLICY "responses_public_insert"
    ON public.responses FOR INSERT WITH CHECK (true);

CREATE POLICY "responses_owner_delete"
    ON public.responses FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.slides s
            JOIN public.presentations p ON p.id = s.presentation_id
            WHERE s.id = public.responses.slide_id
            AND p.user_id = auth.uid()
        )
    );

-- Participants
CREATE POLICY "participants_public_read"
    ON public.participants FOR SELECT USING (true);

CREATE POLICY "participants_public_insert"
    ON public.participants FOR INSERT WITH CHECK (true);

CREATE POLICY "participants_public_update"
    ON public.participants FOR UPDATE USING (true);

CREATE POLICY "participants_owner_delete"
    ON public.participants FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.presentations p
            WHERE p.id = public.participants.presentation_id
            AND p.user_id = auth.uid()
        )
    );

-- ─── REALTIME ────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.presentations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.slides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;

-- ─── DONE ────────────────────────────────────────────────────────────────────
-- After running this file:
-- 1. Go to Authentication → Settings → disable "Enable email confirmations" (for dev)
--    or configure your email provider for production
-- 2. Update .env (or Netlify env vars):
--    SUPABASE_URL=https://<project-ref>.supabase.co
--    SUPABASE_KEY=<your-anon-public-key>
-- 3. Create your admin account: Authentication → Users → Invite user
-- =============================================================================

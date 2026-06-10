-- Add quiz_reveal_slide_id to broadcast answer reveal to participants in real-time
ALTER TABLE public.presentations
ADD COLUMN quiz_reveal_slide_id UUID REFERENCES public.slides(id) ON DELETE SET NULL DEFAULT NULL;

-- Allow public UPDATE on responses so participants can upvote Q&A questions
-- (scoped to only updating qa_upvote-style responses — enforced at app layer via INSERT-only)
-- No extra policy needed: participants use INSERT, not UPDATE, for upvotes.

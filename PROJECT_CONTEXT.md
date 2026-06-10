# Project Context — Mentimeter Clone (Nuxt + Supabase)

> Read this file in full before starting any work here. After finishing
> meaningful work, append a dated entry to **Session log** and update
> **Open / Pending** — that's what lets the next session (yours, Gemini's,
> anyone's) pick up instantly without re-deriving everything from scratch.

## What this is
A Thai-language Mentimeter clone — live audience-interaction presentations
(word clouds, quizzes, polls) built with Nuxt 4 + Vue 3 + Supabase.
Presenters build/edit decks in a dashboard, run them live, and audience
members join from their phones via a short code / QR / link and respond
in real time.

## Stack
- Nuxt ^4.4.7, Vue ^3.5.35, vue-router ^5
- @nuxtjs/supabase ^2.0.9 (auth + Postgres + Realtime)
- canvas-confetti (celebration effects), sweetalert2 (dialogs)
- Dev: Nuxt at http://localhost:3000, local Supabase at 127.0.0.1:54321

## Source map (app/)
- `pages/index.vue` — landing page
- `pages/login.vue`, `pages/register.vue` — Supabase auth
- `pages/dashboard.vue` — presenter's deck list/management
- `pages/presentation/[id]/edit.vue` — slide editor
- `pages/presentation/[id]/present.vue` — **the big one** (~2200 lines):
  live presentation runner — lobby/QR join screen, slide canvas, word cloud,
  quiz, polls, bottom control bar, music player, results, winner-reveal animation
- `pages/p/[code].vue` — audience join page (enter via short code/QR)
- `middleware/auth.js` — route guard for authenticated pages
- `types/database.types.ts` — generated Supabase table types

## Conventions & gotchas (learned the hard way — don't relearn these)
- **Vue `<style scoped>` does NOT leak across components.** A class like
  `.modal-overlay` defined in `dashboard.vue` does nothing in `present.vue`.
  Every component that renders a modal needs its own `.modal-overlay` rule
  (fixed position, flex-center, backdrop blur). This was the root cause of
  a "QR modal not centered" bug — there was simply no overlay CSS at all
  in `present.vue`.
- A CSS `!important` rule in a stylesheet CAN override an inline `style`
  binding that has no `!important` of its own — used this to cap
  word-cloud font sizes with `clamp(...)` regardless of the inline
  `font-size` computed in JS (`Math.max(1.4, Math.min(6.5, ...))rem`).
- Mobile breakpoints already established in `present.vue`:
  `@media (max-width: 768px)` and `@media (max-width: 1024px)`. Add new
  responsive rules inside these rather than inventing new breakpoints.
- `display: contents` is a handy trick to "unwrap" a grouping `<div>` so
  its children become direct flex items of the parent — used to merge 3
  separately-centered button-group rows into one cohesive wrapping
  cluster on the mobile control bar.
- `position: fixed` centers an element relative to the **viewport** as
  long as no ancestor has `transform`/`filter`/`will-change` (checked —
  none of `.present-container` / `.slide-canvas` / `.results-container`
  do). Used this to make the word-cloud winner truly float to dead-center
  of the screen.
- RLS policies on `presentations` / `slides` / `responses` / `participants`
  grant public read-only access by design — join/lobby/live pages work for
  unauthenticated visitors. Confirmed the QR/join-URL flow will work on a
  real production deploy as long as `.env` points at a real public Supabase
  project and the app is served from a public domain (the join URL is built
  dynamically from `window.location.origin`).

## Local dev
- `npm run dev` → http://localhost:3000
- Local Supabase via the Supabase CLI in `supabase/` (Studio at 127.0.0.1:54321)
- `.env` holds `SUPABASE_URL` / `SUPABASE_KEY`, currently pointed at the local instance

## Production Supabase project
- Project ref: `jjveafzrdnmxkpowagut` — linked via `supabase link` (CLI access
  token + DB password ได้จากผู้ใช้โดยตรง ไม่ได้เก็บไว้ในไฟล์ใดๆ)
- ดู URL/anon key จริงได้ที่ Supabase Dashboard → Project Settings → API
  (ใช้ค่าพวกนี้สำหรับ Netlify env vars และ GitHub Action secrets ด้านล่าง)

## Open / Pending
- **Keep-Supabase-alive Action**: เพิ่ม secrets `SUPABASE_URL`/`SUPABASE_KEY`
  แล้วรันครั้งแรก #1 fail ด้วย curl exit 22 (HTTP error, ไม่รู้โค้ดที่แท้จริง)
  → แก้ workflow ให้ query table `presentations` จริง + print HTTP status/body
  เพื่อ debug (commit `6195e7d`, push แล้ว) — **ยังไม่ได้รันทดสอบซ้ำ** รอผลรอบหน้า
  ว่า status code คืออะไร (401=key ผิด, 404=URL ผิด, 42501=RLS)
- **Netlify env vars**: ยังไม่ยืนยันว่าตั้ง `SUPABASE_URL` / `SUPABASE_KEY` ของ
  production project ครบหรือยัง (deploy ผ่านแล้วหลังแก้ NODE_VERSION + publish dir
  เป็น `dist` — แต่ยังไม่ได้ทดสอบว่า login/dashboard ทำงานจริงบน production)
- **Admin account**: ยังไม่ได้สร้างผ่าน Supabase Dashboard → Authentication → Users
  (deployment checklist ข้อ 3)
- **ผู้ใช้กำลังจะไปทดสอบจริง** (production site + keep-alive Action) แล้วจะกลับมา
  ปรับต่อ — เซสชันนี้จบด้วยการ `supabase stop` + หยุด `npm run dev` ตามที่ขอ

## Deployment checklist (Netlify)
1. ✅ Schema พร้อมแล้ว — push migrations ทั้ง 4 ไฟล์ขึ้น project `jjveafzrdnmxkpowagut`
   ผ่าน `supabase db push` เรียบร้อย (2026-06-10), ครอบคลุมทุกอย่างใน
   `supabase/deploy_to_production.sql` รวม RLS + Realtime publication แล้ว —
   ไม่ต้องรัน SQL ไฟล์นั้นซ้ำอีก
2. ตั้งค่า env vars ใน Netlify: `SUPABASE_URL`, `SUPABASE_KEY` (ของ project
   `jjveafzrdnmxkpowagut`)
3. สร้าง admin account ผ่าน Supabase Dashboard → Authentication → Users
4. `npm run generate` (หรือ Netlify จะรันให้อัตโนมัติจาก `netlify.toml`)

## Session log (most recent first)
- **2026-06-10** — Session wrap-up: Netlify deploy fixed end-to-end (Node
  version + publish dir), DB schema live on production, local music wired up,
  keep-alive Action added but first run failed (exit 22) — improved workflow
  diagnostics and pushed, not yet re-tested. User going to test production
  site live and will come back to iterate. Stopped local Supabase + Nuxt dev
  server at end of session.
- **2026-06-10** — Fix Netlify build failure (prerender `/` → 500):
  - **Root cause**: `netlify.toml` had `NODE_VERSION = "20"`, but Nuxt 4.4.7 /
    Nitro / Vite 7 require Node `^22.12.0 || ^24.11.0 || >=26.0.0` (npm
    EBADENGINE warnings on every dep). Node 20 prerendered `/200.html` /
    `/404.html` fine but crashed on the first real Vue SSR render (`/`) with
    an unhandled `[500] Server Error`, failing `nuxt generate`.
  - Local build with Node v24.11.1 succeeds (reproduced + ruled out bad/missing
    `SUPABASE_URL`/`SUPABASE_KEY` as the cause — tried with prod URL + dummy key,
    still built fine locally).
  - **Fix**: `netlify.toml` → `NODE_VERSION = "22"`
  - **Follow-up**: build then succeeded (9 routes prerendered) but deploy
    failed — Nitro on Netlify CI emits to `dist/` (not `.output/public/` like
    local runs), while `netlify.toml` had `publish = ".output/public"`.
    Fixed: `publish = "dist"`
- **2026-06-10** — Push DB schema to production Supabase:
  - `supabase login --token <PAT>` (บัญชีเจ้าของ project จริง, คนละบัญชีกับที่
    CLI login ไว้ก่อนหน้า) → `supabase link --project-ref jjveafzrdnmxkpowagut`
  - `supabase db push`: apply ทั้ง 4 migrations (init_schema, add_participants,
    add_slide_started_at, add_quiz_reveal) สำเร็จ — `supabase migration list`
    ยืนยัน Local/Remote ตรงกันครบ
  - ตรวจสอบแล้วว่า migrations ครอบคลุม `deploy_to_production.sql` ทั้งหมด
    (รวม `alter publication supabase_realtime add table ...` ครบ 4 ตาราง)
    ไม่ต้องรันไฟล์นั้นซ้ำ
- **2026-06-10** — Background music: switch from soundhelix.com to local MP3s:
  - พบไฟล์เพลงที่ Winai สร้างเสร็จใน `C:\Users\Lenovo\Downloads\` (4 ไฟล์,
    9-10 มิ.ย.) → copy เข้า `public/music/` เป็น `chasing-the-golden-hour.mp3`,
    `the-final-second.mp3`, `the-last-ridge.mp3`, `the-long-ascent-home.mp3`
  - `present.vue` บรรทัด 486-491: `musicTracks` array เปลี่ยนจาก
    soundhelix URL เป็น `/music/*.mp3` ทั้งหมด, เพิ่ม track4 (เดิมมีแค่ 3)
- **2026-06-10** — Add "keep Supabase alive" GitHub Action:
  - `.github/workflows/keep-supabase-alive.yml`: cron `0 0 */3 * *` (ทุก 3 วัน)
    + `workflow_dispatch` ping `${SUPABASE_URL}/rest/v1/` ด้วย header `apikey`
    เพื่อกัน production Supabase project free-tier ถูก pause หลัง inactivity
    ~7 วัน — ใช้ GitHub secrets `SUPABASE_URL` / `SUPABASE_KEY` ของ
    production project (ดู Open/Pending สำหรับขั้นตอนตั้งค่า)
- **2026-06-10** — Remove leftover public-signup link on landing page:
  - `index.vue`: ลบ `<NuxtLink to="/register" class="link-text">สมัครบัญชีใหม่สำหรับผู้ควบคุม</NuxtLink>`
    และ CSS `.link-text` ที่ใช้คู่กัน — เป็นจุดที่ตกค้างจากการตัดสินใจ
    "ไม่ต้องการ public signup" เมื่อ 2026-06-09 (ตอนนั้นแก้แค่ `login.vue`)
    `/register` page ยังอยู่ เข้าได้ผ่าน URL ตรงสำหรับ admin เท่านั้น
- **2026-06-09** — Footer + 3D PWA icons:
  - **Footer** (`app/app.vue`): เพิ่ม `<footer class="dev-credit">` — `position: fixed; bottom-right`, opacity 28% → 60% on hover, font 0.62rem, pointer-events none ยกเว้น hover, ข้อความ "© 2026 Developed by Winai Nunkratok"
  - **3D PWA Icons** (`scripts/generate-icons.mjs`, `public/icon-*.png`, `public/apple-touch-icon.png`, `public/icon-512-maskable.png`): สร้าง 14 ไฟล์ครอบคลุมทุกอุปกรณ์ (48→512px + apple-touch-icon 180 + maskable 512). Design: Saturn-style purple planet, 3D Phong shading (diffuse+specular+rim), squircle transparent corners, tilted ring 25° พร้อม back/front pass, starfield, atmospheric glow, specular glint. ใช้ Node.js built-ins เท่านั้น (no deps)
  - `nuxt.config.ts`: เพิ่ม manifest icons ครบ 13 entries + apple-touch-icon/iOS meta tags
- **2026-06-09** — UX polish + PWA + Netlify deploy prep:
  - **Word cloud single/multi submit toggle** (`edit.vue`, `p/[code].vue`): เพิ่ม toggle switch "อนุญาตให้ส่งซ้ำ" ใน settings panel ของ word_cloud slide → เก็บใน `slide.settings.allow_multiple_submissions` (default `true`). ฝั่ง participant: ถ้า `false` → `markAsVoted()` หลังส่งครั้งแรก → จะเห็น "voted-state" เหมือน multiple_choice
  - **Game over screen** (`p/[code].vue`): เพิ่ม `isGameOver` computed (ดู `presentation.is_active === false`); realtime callback อัพเดต `is_active` ด้วย; แสดง card 🎉 พร้อมปุ่ม "เข้าร่วมห้องถัดไป" → navigate ไป `/`
  - **Login page**: ลบ footer-links "ยังไม่มีบัญชี / สมัครสมาชิก" ออก — ไม่ต้องการ public signup
  - **Name placeholder**: เปลี่ยนจาก `เช่น สมชาย, มุก` เป็น `ชื่อเล่นของคุณ...`
  - **Production SQL** (`supabase/deploy_to_production.sql`): ไฟล์รวมทุก migration พร้อม RLS, Realtime สำหรับรัน 1 ครั้งบน Supabase project จริง
  - **PWA** (`nuxt.config.ts`, `netlify.toml`, `public/icon-192.png`, `public/icon-512.png`, `scripts/generate-icons.mjs`): ติดตั้ง `@vite-pwa/nuxt`, generate `sw.js`+`workbox`, manifest ภาษาไทย, รองรับ install prompt, offline cache strategy (NetworkFirst สำหรับ Supabase API, CacheFirst สำหรับ fonts); build ผ่านสมบูรณ์
- **2026-06-09** — Quiz stale-vote bug fix (`p/[code].vue`, `present.vue`):
  - **Root cause**: localStorage เก็บ `voted_${slideId} = 'true'` แบบ plain string ไม่มี timestamp → หลัง host กด Reset หรือ test รอบใหม่ ผู้เล่นยังติด "รอผู้ควบคุมเฉลย..." โหวตใหม่ไม่ได้
  - **`resetVotes` (present.vue)**: เพิ่ม `slide_started_at: NOW` ใน DB update เพื่อเป็น reset signal
  - **`markAsVoted`**: เปลี่ยนเป็น JSON `{ voted: true, at: Date.now() }` เก็บ timestamp
  - **`checkIfVoted`**: เปรียบเทียบ `voteAt` กับ `slide_started_at` — ถ้า `slide_started_at > voteAt` = stale → clear localStorage, `hasVoted = false`; รองรับ legacy format (plain 'true') โดยไม่ทำ stale check
  - **Realtime callback**: เพิ่ม `checkIfVoted()` หลัง update `slide_started_at` → trigger ทันทีที่ host reset โดยไม่ต้องรอ slide change
  - **`watch(currentSlideIndex)`**: ย้าย `checkIfVoted()` ไว้หลังสุด ลบ `myQuizAnswerId = null` ที่เคย override (ป้องกัน quiz reveal ไม่รู้ว่าตอบข้อไหน)
  - **`submitMCVote`**: เพิ่ม DB check (`maybeSingle()`) ก่อน insert เพื่อป้องกัน double-vote กรณี navigate กลับมา slide เดิมแล้ว stale-check clear localStorage
- **2026-06-09** — Import slides feature (`edit.vue`):
  - ปุ่ม "↑ นำเข้า" ใน sidebar ซ้ายข้างปุ่ม "+ เพิ่ม"
  - Modal 2-step: (1) input → (2) preview table → batch INSERT
  - รองรับ 2 format: Paste text (`Q:` / `A) B) *` syntax) และ CSV file upload
  - Paste parser (`parsePasteText`): แบ่งด้วยบรรทัดว่าง, รองรับ prefix หลายแบบ (`Q:`, `1.`, ฯลฯ), `*` ท้าย option = Quiz, ไม่มี = Poll, ตัดเกิน 4 อัตโนมัติ
  - CSV parser (`parseCSV`): รองรับ column `ประเภท,คำถาม,opt1-4,คำตอบ(A/B/C/D),เวลา` หรือ auto-detect ไม่มี column ประเภท, strip BOM สำหรับ Excel
  - ดาวน์โหลด template CSV พร้อม BOM สำหรับ Excel ภาษาไทย
  - Preview table: แสดง type badge (Quiz/Poll), คำถาม, ตัวเลือกพร้อม highlight correct (สีเขียว)
  - `doImport()`: single batch INSERT ทีเดียว, select slide แรกที่นำเข้า, Swal success notification
- **2026-06-09** — Quiz + Q&A full overhaul:
  - **DB migration** `20260609000000_add_quiz_reveal.sql`: เพิ่ม `quiz_reveal_slide_id UUID` ใน `presentations` table เพื่อ broadcast การเฉลยไปหา participants ผ่าน Supabase realtime
  - **Quiz — Host (`present.vue`)**:
    - `toggleQuizAnswer` ตอนนี้ UPDATE `quiz_reveal_slide_id` ใน DB (reveal = ใส่ slide id, ซ่อน = null) + flash overlay animation + ยิง confetti 3 ชุด
    - เพิ่ม `quizRevealFlash` ref + `.quiz-reveal-flash` keyframe overlay สีเขียวบาง fade ออก 0.7s
    - Bar ถูกต้อง = สีเขียว + `correct-pop` animation; Bar ผิด = สีแดงจาง + `wrong-label`
    - `nextSlide`/`prevSlide`/`resetVotes` ทุก path clear `quiz_reveal_slide_id = null` ใน DB + reset local state
    - เพิ่ม `quizLeaderboard` computed: filter responses ที่เลือก correct option, sort by `created_at` (เร็วสุดขึ้นก่อน), join กับ `participants` เพื่อดึง nickname/emoji, แสดง top 5
    - Leaderboard overlay: กด trophy button (🏆) ใน control bar → modal แสดง rank 🥇🥈🥉 พร้อม speed (วินาที)
  - **Quiz — Audience (`p/[code].vue`)**:
    - ปุ่มตอบเปลี่ยนเป็น Kahoot-style 2×2 grid สี red/blue/yellow/green มี shape icon ▲◆●■
    - หลังส่งคำตอบ + ยังไม่เฉลย → "waiting" state พร้อม bouncing dots animation
    - เมื่อ host เฉลย → realtime pick up `quiz_reveal_slide_id` → แสดง ✅ "ถูกต้อง!" หรือ ❌ "ผิด..." + บอกคำตอบที่ถูก (pop-in animation)
    - `myQuizAnswerId` เก็บใน localStorage ข้าม page reload ได้
  - **Q&A — Host (`present.vue`)**:
    - `qaUpvoteCounts` computed: นับ responses ที่ `type === 'qa_upvote'` per question_id
    - `qaQuestions` computed: sort by upvotes descending (คำถามที่โหวตมากขึ้นก่อน)
    - Badge 👍 count แสดงบน card ทุกใบ + border glow สี purple
    - Spotlight button 🔍 บน card → modal แบบ fullscreen สีเหลืองโชว์คำถามขนาดใหญ่ + upvote count
    - `spotlightQuestion` cleared เมื่อเปลี่ยนสไลด์/reset
  - **Q&A — Audience (`p/[code].vue`)**:
    - `fetchAndSubscribeQa()`: fetch + realtime subscribe responses ของ slide นั้น เมื่อเข้าสไลด์ q_and_a
    - `allQaQuestions` computed: รวม questions + นับ upvotes, sort by upvotes
    - แสดง list คำถามทั้งหมดพร้อมปุ่ม 👍 โหวต (เฉพาะคำถามคนอื่น, ป้องกันโหวตซ้ำด้วย localStorage + session_id)
    - Upvote = INSERT response `{ type: 'qa_upvote', question_id }` ไม่ต้องการ UPDATE RLS
- **2026-06-09** — Mobile UX pass on `present.vue`:
  - QR join modal: added the missing `.modal-overlay` CSS (the actual root
    cause), centered the QR code above the link, added a copy-to-clipboard
    SVG button next to the join URL (`fullJoinLink` computed +
    `copyToClipboard('qrlink')`).
  - Fixed severe `<768px` overlap in the live header and word cloud:
    `.present-header { flex-direction: column }`, `order: -1` on the
    question wrapper, `clamp()` cap on `.cloud-word` font-size.
  - Redesigned the bottom control bar for `<1024px`: replaced the old
    "3 separately-centered full-width rows" layout (looked scattered) with
    `display: contents` on `.control-left/center/right` so every button
    becomes one cohesive wrapping cluster, with `.music-controller` forced
    onto its own dedicated full-width row via `flex-basis: 100%` and
    `.reset-btn`/`.qr-btn` reordered to stay with the icon cluster.
  - Redesigned the word-cloud "random-pick winner" reveal: replaced the
    chaotic `word-spin-storm` (rotate + blur + jitter, all words in
    lockstep) with a staggered `word-shimmer-wave` (scale/glow ripple with
    `nth-child` delays). The winning word now detaches from the cloud and
    floats to dead-center of the viewport via
    `position: fixed; top/left: 50%; transform: translate(-50%,-50%)`,
    entering with a springy `winner-center-appear` pop-in (cubic-bezier
    overshoot) then settling into a `winner-center-pulse` glow loop.
    Verified centering with Playwright: measured offset from viewport
    center was exactly `dx = 0.0, dy = 0.0`.

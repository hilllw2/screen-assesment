# Screening App — Technical Documentation

This document describes the **screening app** (`my-app`): APIs, app structure, database usage, and how the candidate test flow works.

---

## 1. Overview

- **Stack:** Next.js 16 (App Router), React 19, Supabase (auth + Postgres), AWS S3 (uploads).
- **Roles:** `admin`, `recruiter`. Candidates take tests via shareable links (no login).
- **Test types:** `screening` (full flow: guidelines → writing → breaks → intelligence → personality → verbal → finish) and `upwork` (shorter flow with video).

---

## 2. App Structure (`my-app`)

### 2.1 Directory layout

```
my-app/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes (see §3)
│   │   ├── test/[token]/           # Candidate test flow (public, by token)
│   │   ├── recruiter/              # Recruiter dashboard (auth)
│   │   ├── admin/                  # Admin dashboard (auth)
│   │   ├── login/
│   │   ├── page.tsx                # Landing
│   │   └── layout.tsx
│   ├── components/                 # UI and test-specific components
│   ├── lib/                        # Supabase clients, S3, security, validation
│   ├── hooks/                      # e.g. useAntiCheat, useToast
│   ├── types/                      # database.ts (Question, etc.)
│   └── config/                     # e.g. video-urls
├── scripts/                        # seed-questions, upload-instruction-videos
└── public/                         # Static assets (videos served via /api/videos/...)
```

### 2.2 Candidate test flow (phases)

Stored in `submissions.current_phase` and advanced via **POST /api/test/[token]/update-phase**:

| Phase        | Route (screening)              | Description                          |
|-------------|---------------------------------|--------------------------------------|
| `guidelines`| `/test/[token]/guidelines`      | Instructions and rules               |
| `writing`   | `/test/[token]/writing`         | Written tasks (e.g. part 1)           |
| `break_1`   | (break)                         | Rest                                 |
| `intelligence` | `/test/[token]/intelligence` | MCQ intelligence questions           |
| `break_2`   | (break)                         | Rest                                 |
| `personality`  | `/test/[token]/personality`  | MCQ personality questions             |
| `verbal`    | `/test/[token]/verbal`          | Audio recording                       |
| `finish`    | `/test/[token]/finish`          | Thank you; submission marked submitted|

**Upwork flow:** starts at `/test/[token]/upwork` (candidate info), then can differ (e.g. video upload, then finish).

- **Start:** **POST** `/test/[token]/start` (form: name, email or upwork_profile_url) → creates candidate + submission, redirects to guidelines or upwork.
- **Landing:** `/test/[token]` → **GET** `/api/test/[token]` to validate link and show start form.

---

## 3. API Reference

All routes under `src/app/api/`. Path params use Next.js 15+ `params: Promise<{ ... }>`.

---

### 3.1 Test (candidate-facing, token in path)

No auth; identified by `token` (test link) and `submissionId` (query/body).

| Method | Path | Purpose |
|--------|------|---------|
| **GET**  | `/api/test/[token]` | Get test link and test details (id, type, title, candidate_info_type). 404 if invalid. |
| **POST** | `/test/[token]/start` | **Form POST.** Start test: create/find candidate, create submission + initial scores/notes, redirect to guidelines or upwork. Body: name, email or upwork_profile_url. 409 if duplicate submission. |
| **POST** | `/api/test/[token]/update-phase` | Set submission phase. Body: `{ submissionId, phase }`. If `phase === "finish"`, sets status to `submitted` and `submitted_at`. |
| **GET**  | `/api/test/[token]/intelligence?submissionId=...` | List up to 30 shuffled **intelligence** questions (id, prompt, option_a–d). From DB `questions` where category = intelligence, is_active = true. |
| **POST** | `/api/test/[token]/intelligence` | Submit intelligence answers. Body: `{ submissionId, answers: { [questionId]: "a"|"b"|"c"|"d" } }`. Saves to `submission_answers`, scores by `score_option_*`, updates `submission_scores.intelligence_score`. |
| **GET**  | `/api/test/[token]/personality?submissionId=...` | List up to 20 shuffled **personality** questions (id, prompt, option_a–d). From DB `questions` where category = personality. |
| **POST** | `/api/test/[token]/personality` | Submit personality answers. Body: same shape as intelligence. Saves answers, sums `score_option_*`, updates `submission_scores.personality_score`. |
| **POST** | `/api/test/[token]/writing` | Save writing response. Body: `{ submissionId, taskNumber, text }`. Currently always writes to `writing_part_1_text`. |
| **POST** | `/api/test/[token]/verbal` | Save verbal audio URL. Body: `{ submissionId, audioUrl }`. Updates `submissions.audio_recording_url`. |
| **POST** | `/api/test/[token]/upwork` | Save Upwork video and mark submitted. Body: `{ submissionId, videoUrl }`. Sets `video_recording_url`, status = submitted, submitted_at. |
| **POST** | `/api/test/[token]/violation` | Log anti-cheat violation (no auto-disqualify). Body: `{ submissionId, violationType, metadata? }`. Inserts into `submission_violations`. |
| **POST** | `/api/test/[token]/screen-recording` | Save screen recording URL. Body: `{ submissionId, screenRecordingUrl, isChunk?, chunkNumber? }`. Can append chunks as array; verifies token. |

---

### 3.2 Recruiter (authenticated, role recruiter or admin)

Uses Supabase auth; checks `users.role` (recruiter/admin). Recruiter sees only own tests/links/submissions.

| Method | Path | Purpose |
|--------|------|---------|
| **GET**  | `/api/recruiter/tests` | List tests for current user with test_links and submissions. |
| **POST** | `/api/recruiter/tests` | Create test. Body: `{ type: "screening"|"upwork", title? }`. Creates one test link by default. |
| **GET**  | `/api/recruiter/tests/[testId]/links` | Get test and its links (with submission counts). Test must belong to user. |
| **POST** | `/api/recruiter/tests/[testId]/links` | Create test link (default expiry +7 days). |
| **PATCH** | `/api/recruiter/tests/links/[linkId]` | Update link: `{ is_active?, expires_at? }`. |
| **DELETE** | `/api/recruiter/tests/links/[linkId]` | Delete test link. |
| **GET**  | `/api/recruiter/submissions` | List submissions. Query: testId, status, search, startDate, endDate. Recruiter filtered by tests they created. |
| **GET**  | `/api/recruiter/submissions/[id]` | Submission detail with candidate, test, scores, notes, answers (with questions), violations. Recruiter: test must be theirs. |
| **PATCH** | `/api/recruiter/submissions/[id]/scores` | Set human scores. Body: `{ written_test_score_by_human?, audio_score_by_human? }` (0–10). |
| **PATCH** | `/api/recruiter/submissions/[id]/status` | Set status. Body: `{ status: "in_progress"|"submitted"|"passed"|"failed" }`. |
| **PATCH** | `/api/recruiter/submissions/[id]/notes` | Set notes. Body: `{ written_test_review_notes_by_human?, audio_review_notes_by_human? }`. |

---

### 3.3 Admin (authenticated, role admin only)

| Method | Path | Purpose |
|--------|------|---------|
| **GET**  | `/api/admin/recruiters` | List recruiters with stats (tests, links, submissions counts). |
| **GET**  | `/api/admin/tests` | List all tests with links and submissions. |
| **POST** | `/api/admin/tests` | Create test. Body: `{ type, title?, candidate_info_type: "email"|"upwork" }`. Creates first test link. |
| **GET**  | `/api/admin/tests/[testId]/links` | Same as recruiter links; admin can see any test. |
| **POST** | `/api/admin/tests/[testId]/links` | Create test link. |
| **PATCH** | `/api/admin/tests/links/[linkId]` | Update link. |
| **DELETE** | `/api/admin/tests/links/[linkId]` | Delete link. |
| **GET**  | `/api/admin/submissions` | List all submissions with candidate, test, test_link, scores, violations. |
| **PATCH** | `/api/admin/submissions` | Bulk actions. Body: `{ action, submissionId?, status?, ids? }`. Actions: `export`, `updateStatus` (passed/failed), `exportAll` (optional ids). On `updateStatus` = passed, sends webhook if test has webhook_url. |
| **GET**  | `/api/admin/submissions/[id]` | Full submission with candidate, test, scores, notes, answers+questions, violations. Can delete from S3. |
| **PATCH** | `/api/admin/submissions/[id]` | Update submission (e.g. status, disqualified, disqualification_reason). |

Admin **questions** are handled via Server Actions in `src/app/admin/questions/actions.ts` (getQuestions, createQuestion, updateQuestion, deleteQuestion, etc.), not REST routes.

---

### 3.4 Media and uploads

| Method | Path | Purpose |
|--------|------|---------|
| **POST** | `/api/presigned-url` | **Auth required.** Body: `{ s3Url }`. Returns presigned GET URL for that S3 key (e.g. 1h). Used to view private S3 recordings. |
| **POST** | `/api/upload` | Upload file to S3. FormData: `file`, `type` (audio|video|screen), `submissionId`, `questionNumber?`. Returns `{ url }`. |
| **GET**  | `/api/videos/[...path]` | Serve video from `public/` by path. Used for instruction videos. |

---

## 4. Database (Supabase) — Tables and usage

| Table | Purpose |
|-------|---------|
| **users** | Auth-linked users. Columns: id (uuid), email, name, role (admin/recruiter), default_webhook_url, created_at, updated_at. |
| **tests** | Test definition. type (screening/upwork), title, candidate_info_type (email/upwork), webhook_url, created_by_user_id. |
| **test_links** | Shareable link per test. token (uuid), is_active, expires_at, created_by_user_id. |
| **candidates** | Candidate identity. name, email or upwork_profile_url. |
| **submissions** | One per candidate per test. test_id, test_link_id, candidate_id, status (in_progress, submitted, passed, failed, disqualified), current_phase, phase_started_at, writing_part_1_text…5, verbal_question_1_url…3, audio_recording_url, screen_recording_url, video_recording_url, written_test_submission_text, ai_scored, exported, etc. |
| **submission_answers** | Per-question answer. submission_id, question_id, selected_option (a/b/c/d), is_correct (nullable), score_awarded, answered_at. |
| **submission_scores** | One row per submission. intelligence_score, personality_score, audio_score_by_ai, written_test_score_by_ai, audio_score_by_human, written_test_score_by_human, updated_at. |
| **submission_notes** | AI/human notes. submission_id, audio_notes_by_ai, written_test_review_notes_by_ai, audio_review_notes_by_human, written_test_review_notes_by_human. |
| **submission_violations** | Anti-cheat log. submission_id, violation_type (e.g. tab_switch, devtools_attempted), detected_at, metadata. |
| **questions** | Question bank. category (intelligence/personality), prompt, option_a–d, correct_option (optional), score_option_a–d, difficulty, is_active. |

- **Intelligence scoring:** Sum of `score_awarded` from submission_answers (from questions’ `score_option_*`). Stored as raw in `submission_scores.intelligence_score` (e.g. max 155 in comments).
- **Personality scoring:** Same model: sum of `score_option_*` for selected option, stored in `submission_scores.personality_score` (e.g. max 180 in webhook scaling).
- **Webhook (admin):** On status → passed, POST to test’s webhook_url with candidate, test, scores (intelligence/personality normalized to 0–5 scale), verbal/writing, total out of 20, percentage.

---

## 5. App Pages (shaping) — Quick map

| Route | Who | Description |
|-------|-----|-------------|
| `/` | Public | Landing. |
| `/login` | Public | Auth (Supabase). |
| `/test/[token]` | Candidate | Test landing: validate link, form to start (name + email or Upwork URL). |
| `/test/[token]/start` | Candidate | Form POST target; redirects to guidelines or upwork. |
| `/test/[token]/guidelines` | Candidate | Instructions. |
| `/test/[token]/writing` | Candidate | Writing task(s). |
| `/test/[token]/intelligence` | Candidate | Intelligence MCQs. |
| `/test/[token]/personality` | Candidate | Personality MCQs. |
| `/test/[token]/verbal` | Candidate | Verbal/audio step. |
| `/test/[token]/upwork` | Candidate | Upwork flow (e.g. video). |
| `/test/[token]/finish` | Candidate | Thank you / completed. |
| `/test/[token]/disqualified` | Candidate | Shown if disqualified. |
| `/recruiter/*` | Recruiter/Admin | Dashboard, tests, links, submissions, analytics. |
| `/admin/*` | Admin | Recruiters, tests, links, submissions, questions CRUD, violations. |
| `/admin/questions`, `/admin/questions/new`, `/admin/questions/[id]/edit` | Admin | Question bank (intelligence/personality). |

---

## 6. Security and infra

- **Auth:** Supabase (session). Middleware in `src/lib/supabase/middleware.ts`; API uses `createClient()` (server) or admin `createServiceRoleClient()` for server-only ops.
- **Test routes:** No auth; validation by `token` and optional `submissionId`; anti-cheat logged via `/api/test/[token]/violation` and optional AntiCheatLayer in test layout.
- **Uploads:** S3 via `@/lib/s3`; presigned URLs via `@/lib/security/presigned-urls.ts` (authenticated).
- **Env:** Supabase URL/keys, S3 bucket/region/keys; see `src/lib/env-config.ts` and `.env*`.

---

## 7. Notes and possible bugs

- **Writing API:** Accepts `taskNumber` but always writes to `writing_part_1_text`; other writing columns (e.g. part 2–5) are not written by this route.
- **Recruiter submissions filter:** In `api/recruiter/submissions/route.ts` and `api/recruiter/submissions/[id]/route.ts` the code uses `created_by` on `tests`; the DB column is `created_by_user_id`. Fix by using `created_by_user_id` and `test?.created_by_user_id` so recruiter filtering and single-submission access work correctly.
- **Personality / Intelligence:** Question set sizes and max scores (155, 180) are mentioned in code comments and webhook scaling; changing question bank or scoring should align these constants and any docs.

---

*Generated for the screening app in `my-app`. For DB schema details, use Supabase MCP `list_tables` or run migrations.*

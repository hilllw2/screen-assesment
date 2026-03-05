# Screening App - Complete System Summary

## Overview
A screening platform for recruiters and admins to assess candidates through multi-phase tests (writing, intelligence, personality, verbal).

---

## 1. Tech Stack
- **Framework**: Next.js 16.1.6 (uses `proxy.ts` instead of `middleware.ts`)
- **React**: 19.2.3
- **Database**: Supabase (PostgreSQL + Auth)
- **Storage**: AWS S3 (for audio/video uploads)
- **Styling**: Tailwind CSS + Radix UI

---

## 2. User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access: manage recruiters, tests, questions, all submissions |
| **Recruiter** | Limited: create tests/links, view own submissions |
| **Candidate** | No login required: access test via unique link token |

---

## 3. Authentication Flow

### Admin/Recruiter Login
1. User visits `/login`
2. Signs in with email/password via Supabase Auth
3. App fetches role from `users` table
4. Redirects to `/admin/dashboard` or `/recruiter/dashboard`

### Candidate Access (NO LOGIN)
1. Candidate receives link: `https://domain.com/test/{token}`
2. Enters name + email
3. System creates candidate record + submission
4. Proceeds through test phases

---

## 4. Database Schema

### Core Tables
```
users           - Admin/recruiter accounts (id, email, name, role)
candidates      - Test takers (id, name, email)
tests           - Test definitions (id, created_by_user_id, type, title)
test_links      - Shareable tokens (id, test_id, token, is_active, expires_at)
submissions     - Test attempts with all responses and recordings
submission_answers - MCQ answers
submission_scores  - Intelligence/personality scores
submission_notes   - AI/human notes
submission_violations - Cheating violations
questions       - Question bank (intelligence + personality)
```

---

## 5. Candidate Test Flow

```
┌─────────────────┐
│  /test/{token}  │  Landing page - name/email form
└────────┬────────┘
         │ POST /api/test/{token}/start
         ▼
┌─────────────────┐
│   /guidelines   │  Watch overview video (must complete)
└────────┬────────┘
         │ POST /api/test/{token}/update-phase → writing
         ▼
┌─────────────────┐
│    /writing     │  Random task video → 7 min timed writing
└────────┬────────┘
         │ POST /api/test/{token}/writing
         │ POST /api/test/{token}/update-phase → intelligence
         ▼
┌─────────────────┐
│  /intelligence  │  20 MCQ questions, 12 min timer
└────────┬────────┘
         │ POST /api/test/{token}/intelligence
         │ POST /api/test/{token}/update-phase → personality
         ▼
┌─────────────────┐
│  /personality   │  20 MCQ questions, 15 min timer
└────────┬────────┘
         │ POST /api/test/{token}/personality
         │ POST /api/test/{token}/update-phase → verbal
         ▼
┌─────────────────┐
│    /verbal      │  3 video questions with audio recording
└────────┬────────┘
         │ POST /api/upload (audio)
         │ POST /api/test/{token}/verbal
         │ POST /api/test/{token}/update-phase → finish
         ▼
┌─────────────────┐
│    /finish      │  Completion message
└─────────────────┘
```

---

## 6. Video Files in `/public/`

### Written Assessment Videos
| File | Used In |
|------|---------|
| `Writing-Assessment-Instructions.mp4` | - |
| `Writing-Assessment-Task.mp4` | `/writing` (random) |
| `Writing-Assessment-Task-2.mp4` | `/writing` (random) |
| `Writing-Assessment-Task-3.mp4` | `/writing` (random) |
| `Writing-Assessment-Task-4.mp4` | `/writing` (random) |
| `Writing-Assessment-Task-5.mp4` | `/writing` (random) |

### Verbal Assessment Videos
| File | Used In |
|------|---------|
| `Verbal-Assessment-Overview.mp4` | `/guidelines` |
| `Verbal-Assessment-Video-7-Start-Instructions.mp4` | `/verbal` |
| `Verbal-Assessment-Video-8-Question-1-Preparation.mp4` | `/verbal` |
| `Verbal-Assessment-Video-9-Question-1.mp4` | `/verbal` |
| `Verbal-Assessment-Video-10-Question-2-Preparation.mp4` | `/verbal` |
| `Verbal-Assessment-Video-11-Question-2.mp4` | `/verbal` |
| `Verbal-Assessment-Video-14-Question-3-Preparation.mp4` | `/verbal` |
| `Verbal-Assessment-Video-15-Question-3.mp4` | `/verbal` |
| `Verbal-Assessment-Video-16-Ending.mp4` | `/verbal` |

---

## 7. API Endpoints

### Test Flow (No Auth Required)
```
POST /api/test/{token}/start        - Create candidate + submission
POST /api/test/{token}/update-phase - Update current_phase
POST /api/test/{token}/writing      - Save writing response
GET  /api/test/{token}/intelligence - Get questions
POST /api/test/{token}/intelligence - Submit answers
GET  /api/test/{token}/personality  - Get questions
POST /api/test/{token}/personality  - Submit answers
POST /api/test/{token}/verbal       - Save verbal recording URL
POST /api/test/{token}/violation    - Log violation
POST /api/upload                    - Upload audio/video to S3
```

### Admin APIs (Auth Required)
```
/api/admin/recruiters/*
/api/admin/tests/*
/api/admin/submissions/*
/api/admin/questions/*
```

### Recruiter APIs (Auth Required)
```
/api/recruiter/tests/*
/api/recruiter/submissions/*
```

---

## 8. Anti-Cheat Features

### Currently Active (in AntiCheatLayer)
- ✅ Disable right-click context menu
- ✅ Disable copy/cut/paste
- ✅ Block PrintScreen + Ctrl/Cmd+C/V/X (blur screen briefly)

### Defined but NOT Wired (in `/lib/security/anti-cheat.ts`)
- ❌ Tab switch detection
- ❌ Page unload detection
- ❌ Screen share monitoring
- ❌ Multi-monitor detection
- ❌ Dev tools detection
- ❌ Network monitoring

### Violation API
- `POST /api/test/{token}/violation` exists
- Inserts into `submission_violations`
- Sets `disqualified: true`
- **But no client code calls it**

---

## 9. Current Auth/Proxy Setup

### File: `src/proxy.ts`
Next.js 16 uses `proxy.ts` (not `middleware.ts`).

**Current Logic:**
1. Public assets → bypass (videos, images, _next, favicon)
2. Test flow paths → bypass (`/test/*`, `/api/test/*`, `/api/upload`)
3. Login page → bypass
4. Everything else → require auth, check roles

### Known Issue
Videos work when signed in but NOT in incognito because:
- The proxy logic is correct
- But something on Vercel may be caching/redirecting incorrectly
- Or the `config.matcher` isn't being respected

---

## 10. Route Structure

```
src/app/
├── page.tsx                    # Home (redirects based on auth)
├── login/page.tsx              # Login form
├── globals.css                 # Global styles
├── layout.tsx                  # Root layout
│
├── admin/
│   ├── layout.tsx              # Admin layout (auth check)
│   ├── dashboard/page.tsx
│   ├── recruiters/page.tsx
│   ├── tests/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [testId]/links/page.tsx
│   ├── submissions/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── questions/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/edit/page.tsx
│   └── violations/page.tsx
│
├── recruiter/
│   ├── layout.tsx              # Recruiter layout (auth check)
│   ├── dashboard/page.tsx
│   ├── tests/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [testId]/links/page.tsx
│   ├── links/page.tsx
│   ├── submissions/[id]/page.tsx
│   └── analytics/page.tsx
│
├── test/[token]/
│   ├── layout.tsx              # AntiCheatLayer wrapper
│   ├── page.tsx                # Landing (name/email form)
│   ├── guidelines/page.tsx     # Overview video
│   ├── writing/page.tsx        # Writing assessment
│   ├── intelligence/page.tsx   # MCQ test
│   ├── personality/page.tsx    # MCQ test
│   ├── verbal/page.tsx         # Audio recording
│   ├── finish/page.tsx         # Completion
│   ├── disqualified/page.tsx   # Violation page
│   └── upwork/page.tsx         # Upwork video intro
│
└── api/
    ├── upload/route.ts         # S3 upload
    ├── videos/[...path]/route.ts # Video serving fallback
    ├── test/[token]/
    │   ├── start/route.ts
    │   ├── update-phase/route.ts
    │   ├── writing/route.ts
    │   ├── intelligence/route.ts
    │   ├── personality/route.ts
    │   ├── verbal/route.ts
    │   ├── violation/route.ts
    │   └── screen-recording/route.ts
    ├── admin/...
    └── recruiter/...
```

---

## 11. Key Components

| Component | Purpose |
|-----------|---------|
| `AppShell` | Shared layout with sidebar + navbar |
| `AdminSidebar` | Admin navigation |
| `RecruiterSidebar` | Recruiter navigation |
| `Navbar` | Top bar with user menu |
| `AntiCheatLayer` | Wraps test pages, blocks shortcuts |

---

## 12. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
```

---

## Summary of Issues to Fix

1. **Video Loading**: Proxy bypasses look correct, but Vercel deployment may need cache purge or different approach
2. **Anti-Cheat**: Advanced features defined but not connected to violation API
3. **Screen Recording**: API exists but no client implementation

---

## 13. Deployment Checklist

### To fix video loading in incognito:

1. **Push latest changes to git**
2. **Trigger fresh Vercel deployment** (not just redeploy - push new commit)
3. **Purge Vercel Edge Cache** (Vercel Dashboard → Project → Settings → Edge Network → Purge Cache)
4. **Test in fresh incognito window** (not just new tab)

### Test URLs to verify:
```
# Should load WITHOUT login redirect:
https://your-domain.vercel.app/Verbal-Assessment-Videos/Verbal-Assessment-Overview.mp4
https://your-domain.vercel.app/test/{any-valid-token}
https://your-domain.vercel.app/test/{token}/guidelines?sid={submission-id}

# Should redirect to login:
https://your-domain.vercel.app/admin/dashboard
https://your-domain.vercel.app/recruiter/dashboard
```

---

## 14. Quick Reference

### Start a test (as candidate):
1. Get test link from recruiter/admin
2. Open link → enter name/email → click Start
3. Watch guidelines video → proceed through phases

### Create a test link (as recruiter):
1. Login → Tests → Create Test
2. Generate link → share with candidate

### View submissions (as admin):
1. Login → Submissions → click any submission
2. View all responses, scores, recordings

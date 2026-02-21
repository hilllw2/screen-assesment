This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Candidate flow (no login required)

Candidates **do not sign up or log in**. They use a link (e.g. `/test/<token>`) and enter only name and email to start. The app is set up so that:

- **Test pages** (`/test/...`) and **test APIs** (`/api/test/...`) are allowed in middleware for unauthenticated users.
- **Uploads** (`POST /api/upload`) are allowed so candidates can upload audio/video/screen recordings to **AWS S3**.
- All candidate-facing API routes and the test landing/start flow use the **Supabase service role key** on the **server only** (in API routes and server components). The key is never sent to the browser, so the database is not exposed. This bypasses RLS for these routes so candidates can read questions and save submissions and recordings without an account.

Recruiter and admin routes still require login and use the normal Supabase client with RLS.

## Environment variables

The app uses **Supabase** (packages are in `package.json`: `@supabase/supabase-js`, `@supabase/ssr`). For local development, create `.env.local` in the `my-app` folder with:

- `NEXT_PUBLIC_SUPABASE_URL` – your Supabase project URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – anon/public key  
- `SUPABASE_SERVICE_ROLE_KEY` – **required** for test APIs (intelligence/personality questions, etc.). Get it from Supabase Dashboard → Settings → API → `service_role` (secret). Without this, questions won’t load and some data may not save for candidates.

Add any other keys your app needs (e.g. S3, etc.).

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

**Important:** After deploying, set the same environment variables in Vercel:

- **Project → Settings → Environment Variables**
- Add **Supabase** keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and **`SUPABASE_SERVICE_ROLE_KEY`** (same value as in `.env.local`).
- Add **AWS S3** keys: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME` so that recordings (audio/video/screen) can be uploaded.
- Redeploy after adding or changing variables.

If these are missing in production:

- The Supabase SDK is still installed but **calls will fail or return no data** (e.g. no questions, data not saving).
- **Recordings will fail to upload** — verbal/upwork assessments won't work because audio and video uploads go to S3.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

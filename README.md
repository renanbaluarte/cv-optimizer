# CV Optimizer

Analyzes how well a resume matches a job posting using Gemini. It returns a score from 0 to 100, strengths, improvements and missing keywords, and it can rewrite the professional summary to focus on the job. Analyses are saved to a history.

**Stack:** Next.js 16 (App Router, Server Actions, Cache Components) · React 19 · Bulma 1 · Google Gemini (`@google/genai`) · Zod 4 · PostgreSQL + Prisma 7 · Vitest

## Features

- **Match score:** a 0–100 bar with ranges (low, medium and high).
- **Structured feedback:** summary, strengths, improvements and missing keywords.
- **Summary rewrite:** generates a new professional summary using only facts from the resume, with a copy button.
- **History:** lists the last 50 analyses and lets you open or delete each one.
- **File import:** loads `.txt`/`.md` files directly in the browser.
- **English and Portuguese:** English by default (`/` redirects to `/en`) and an EN/PT switch that keeps the current page. AI feedback is written in the interface language. The rewritten summary is written in the resume's language, since it goes into the resume.

## Internationalization

Routes live under `app/[lang]`, and `proxy.ts` redirects paths without a language prefix. Texts are in `lib/i18n.ts`, where the Portuguese dictionary is typed from the English one, so a missing key breaks the build. Server Actions return error codes (`ErrorCode`) instead of sentences, and the interface translates them.

## Technical highlights

### Reliable structured output
The same Zod schema (`lib/schemas.ts`) does two jobs:
1. It is converted to JSON Schema (`z.toJSONSchema`) and sent to Gemini via `responseJsonSchema`, which constrains the model's output.
2. It validates the response in `parseModelJson`. Invalid JSON, a score outside 0–100 or oversized lists become a typed error (`AiError("invalid_output")`) with a friendly message. Nothing outside the contract reaches the database or the screen.

Stored JSON is also revalidated on read, and the database has a `CHECK` constraint enforcing `score BETWEEN 0 AND 100`.

### Security
- **Signed anonymous session:** an `HttpOnly` + `SameSite=Lax` cookie (`Secure` in production) holding a UUID signed with HMAC-SHA256 and compared with `timingSafeEqual`. History is isolated per session and every query filters by `sessionId`, so an analysis id alone does not grant access to it (IDOR protection).
- **Rate limiting persisted in Postgres:** works across serverless instances. Limits per session (3/h), per IP (3/h, with the IP stored only as an HMAC) and a global daily cap (500) to control cost. All values are configurable through environment variables.
- **Server-side validation:** every Server Action validates its input with Zod and caps text length. Origin-based CSRF protection comes built into Server Actions.
- **Prompt injection:** the resume and job posting are delimited as data, and the model is instructed not to follow instructions inside them. Output is restricted to the schema and rendered as text (React escapes it).
- **Privacy:** resume text never goes to the logs. The Gemini key exists only on the server, and users can delete their analyses.
- **Security headers:** `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` and HSTS.

## Running locally

Requirements: Node 20+ and PostgreSQL.

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, GEMINI_API_KEY and SESSION_SECRET
npm run db:migrate
npm run dev
```

- `GEMINI_API_KEY`: create one in [Google AI Studio](https://aistudio.google.com/apikey).
- `SESSION_SECRET`: `openssl rand -base64 32`.
- `GEMINI_MODEL`: defaults to `gemini-flash-latest`.

## Tests

```bash
npm test
```

They cover the LLM contract (invalid JSON, out-of-range score, missing fields), input validation, error-code mapping and the session signature (wrong secret, swapped id, malformed tokens).

## Deploy

1. Create a Postgres database on Neon, Supabase or Render.
2. Import the repository into Vercel and set the variables from `.env.example`.
3. Run migrations with `npm run db:deploy`, which can be part of the build command (`npm run db:deploy && next build`).

`postinstall` runs `prisma generate`.

## Known limitations

- The rate limiter counts and records events in two steps, so simultaneous bursts can exceed the limit by 1–2 calls. For exact control, use Redis (Upstash).
- The anonymous session is lost when cookies are cleared. User accounts (Auth.js) would be the next step.
- There is no PDF import and no response streaming.
- There is no automatic retention policy: analyses stay saved until the user deletes them.

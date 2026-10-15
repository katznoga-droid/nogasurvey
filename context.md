# NogaSurvey — Project Context

This is the source of truth for what we're building and why. Update it when a decision changes.

## 1. What it is

NogaSurvey is a customer feedback (NPS) app:

1. An admin sends a customer an **invite email** with a unique survey link.
2. The customer fills in the **survey page**.
3. They see a **thank-you page**.
4. They get a **follow-up email**. Which one depends on their NPS score.
5. Admins log in to a **dashboard** with charts and a list. New responses show up in real time.

## 2. User flows and screens (from the sketch)

### 2.1 Customer invite email
- Copy: **"We would love your opinion. Click here to submit your feedback."**
- "Click here" links to `/survey/{token}`. The token is unique to each invite.
- Sent through Resend when an admin submits the "Send invite" form on the dashboard.

### 2.2 Customer survey page: `/survey/[token]`
| Field | Control | Rules |
|---|---|---|
| Overall NPS | 1–10 scale (row of clickable number buttons) | Required, integer 1–10 |
| Happy? | Radio buttons, Yes / No | Required |
| General feedback | Large textarea | Optional, max 2,000 chars |
| Type of customer | Select with 4 options (see §4) | Required |

- If the token is invalid: show a friendly "link not found" page.
- If the token was already used: show a "you've already responded, thank you" page. Each invite can be submitted **once**.
- On submit, the server validates the input, saves the response, sends the follow-up email, broadcasts a real-time event, and redirects to the thank-you page.

### 2.3 Survey thank-you page: `/survey/[token]/thank-you`
- Copy: **"Thank you! We care about you!"**

### 2.4 Follow-up emails (sent right after submission)
| Condition | Copy | Image |
|---|---|---|
| NPS **> 5** (6–10) | **"We love that you love us! Here are cookies!"** | Photo of cookies |
| NPS **≤ 5** (1–5) | **"We are sad to hear that. Here is a cake!"** | Photo of a cake |

- Images live in `/public/email/` and are referenced by absolute URL (`NEXT_PUBLIC_SITE_URL`), so email clients can load them.
- "Total NPS" in the brief means the respondent's own Overall NPS score.

### 2.5 Admin login: `/admin/login`
- Heading: "Welcome to NogaSurvey Admin Login".
- Username + Password + Submit, as in the sketch.
- Credentials: username **`admin`**, password **`login123`**. Both come from env vars (`ADMIN_USERNAME`, `ADMIN_PASSWORD`), not hard-coded.
- A successful login sets a signed httpOnly session cookie (HMAC with `SESSION_SECRET`, expires after 7 days). Middleware protects every `/admin/*` route except the login page. There's a logout button.

### 2.6 Admin dashboard: `/admin`
Layout follows the sketch:
- **Top:** "Filter by customer type" select (All + the 4 types). The filter applies to the KPIs, the charts and the list.
- **KPI row** (an addition to the sketch): Total responses · Average NPS · NPS score (% promoters − % detractors) · % Happy.
- **Charts (2×2 grid, left):**
  1. NPS score distribution (bars for 1–10, colored by detractor, passive or promoter)
  2. Happy vs. not happy (donut)
  3. Responses and average NPS over time (line/area, by day)
  4. Average NPS by customer type (bars)
- **List (right):** latest responses, newest first. Shows date, customer name/email, type, NPS badge, happy, and a feedback snippet. Click a row to see the full feedback. New rows flash or highlight when they arrive live.
- **Send invite** panel: name + email. Creates an invite and emails the link.

Promoter, passive and detractor buckets are adapted to the 1–10 scale: **9–10 promoter, 7–8 passive, 1–6 detractor**.

## 3. Real-time updates
- The dashboard subscribes to a Supabase Realtime **Broadcast** channel (`survey-responses`).
- After a response is saved, the server broadcasts a lightweight `new_response` event with no personal data in it.
- When the dashboard gets the event, it refetches data through an authenticated server action and updates the charts and list without a page reload.
- Why Broadcast and not `postgres_changes`: listening to table changes from the browser would need a public read policy on the responses table, which would expose customer data to anyone holding the anon key. With Broadcast, all data reads stay on the server.

## 4. Customer types (decided)
Business size:
1. **Small Business**
2. **Mid-Market**
3. **Enterprise**
4. **Agency / Partner**

Stored as a Postgres enum: `small_business`, `mid_market`, `enterprise`, `agency_partner`.

## 5. Data model (Supabase / Postgres)

```sql
create type customer_type as enum ('small_business','mid_market','enterprise','agency_partner');

create table invites (
  id           uuid primary key default gen_random_uuid(),
  token        text unique not null,          -- random, URL-safe, unguessable
  name         text not null,
  email        text not null,
  created_at   timestamptz not null default now(),
  responded_at timestamptz
);

create table responses (
  id               uuid primary key default gen_random_uuid(),
  invite_id        uuid unique references invites(id) on delete cascade,  -- one response per invite
  nps              smallint not null check (nps between 1 and 10),
  happy            boolean not null,
  feedback         text check (char_length(feedback) <= 2000),
  customer_type    customer_type not null,
  follow_up_sent_at timestamptz,
  created_at       timestamptz not null default now()
);
```

- **RLS is enabled on both tables, with no public policies.** All reads and writes go through Next.js server code using the Supabase **service-role key**, which stays on the server and is never sent to the browser.
- **Sample data:** a seed script creates about 60 invites with matching responses, spread across the last 60 days and all 4 customer types. NPS values follow a realistic mix, and the feedback text is realistic. It also adds a few unused invites, so the survey link can be tested.

## 6. Tech stack
| Concern | Choice |
|---|---|
| Framework | **Next.js** (App Router, TypeScript, Server Actions) |
| Styling | **Tailwind CSS** |
| Charts | Recharts |
| DB + realtime | **Supabase** (Postgres + Realtime Broadcast) |
| Email | **Resend** + React Email templates |
| Validation | Zod |
| Hosting | **Vercel** (auto-deploys from GitHub `main`) |
| Source control | **GitHub**: new repo `nogasurvey` |

### Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # browser: realtime subscription only
SUPABASE_SERVICE_ROLE_KEY=          # server only
RESEND_API_KEY=
EMAIL_FROM="NogaSurvey <onboarding@resend.dev>"
NEXT_PUBLIC_SITE_URL=               # e.g. https://nogasurvey.vercel.app
ADMIN_USERNAME=admin
ADMIN_PASSWORD=login123
SESSION_SECRET=                     # long random string
```
`.env.local` is gitignored. `.env.example` is committed. On Vercel, env vars are set in the project settings.

## 7. Visual style: HubSpot-inspired
We copy HubSpot's general look and feel, but **not** its logo, name or trademarked assets.
- **Colors:** primary coral/orange `#FF5C35` (hover `#E04A26`), dark navy text `#213343` / `#2D3E50`, teal accent `#00BDA5`, page background `#F5F8FA`, borders `#CBD6E2`, white cards.
- **Type:** *Lexend Deca* (Google Fonts) for headings and body. Generous size and spacing.
- **Components:** white rounded cards (`rounded-lg`) with soft shadows and plenty of whitespace. Solid orange primary buttons with medium rounding, and outlined secondary buttons. Clean form fields with focus rings. Friendly, upbeat copy.
- **Charts:** brand palette, with orange as the lead color. Detractor / passive / promoter use red / amber / teal.
- **Responsive:** the survey works well on mobile. On narrow screens the dashboard stacks the charts above the list.
- The emails use the same palette and font fallbacks, in a simple centered card layout.

## 8. Routes
```
/                              Minimal landing → link to admin login
/survey/[token]                Survey form
/survey/[token]/thank-you      Thank-you page
/admin/login                   Admin login
/admin                         Dashboard (protected)
```
Server Actions: `submitSurvey`, `login`, `logout`, `sendInvite`, `getDashboardData(filter)`.

## 9. Decisions and assumptions
- Resend runs in **test mode** with `onboarding@resend.dev`. Until a domain is verified, emails are **only delivered to the email address on Noga's Resend account**. Sending to anyone else fails with a clear error in the dashboard. To fix this later, verify a domain in Resend and change `EMAIL_FROM`.
- Invites are sent **from the admin dashboard**, one at a time.
- Infra is **new**: a new Supabase project, a new GitHub repo, and a new Vercel project. Noga confirms before anything that costs money.
- One response per invite link. Customers can't edit a response after submitting.
- If the follow-up email fails, the survey submission still succeeds. The failure is logged and `follow_up_sent_at` stays null.
- No multi-admin accounts or roles: a single shared admin login, as specified.
- `gh` CLI isn't installed on this machine. The GitHub repo is created either by installing `gh` or by Noga creating an empty repo on github.com.

## 10. Open items
- [ ] Cookie and cake photos: use free-license photos (e.g. from Unsplash) saved in `/public/email/`. They need to be picked and downloaded (requires Noga's OK).
- [ ] Noga's Resend API key (and the account email that test sends go to).
- [ ] GitHub account/username to create the repo under.

## 11. Build plan
1. Scaffold Next.js + Tailwind + TypeScript, brand theme, fonts, git init.
2. Supabase project, schema migration, RLS, seed sample data.
3. Survey page, validation, thank-you page, submit action.
4. Resend email templates (invite and both follow-ups) and sending logic.
5. Admin auth (login/logout, middleware).
6. Dashboard: filter, KPIs, 4 charts, list, send-invite form.
7. Realtime broadcast and live dashboard refresh.
8. GitHub repo, Vercel project, env vars, deploy, end-to-end test on production.

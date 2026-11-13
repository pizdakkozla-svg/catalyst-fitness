# Catalyst Fitness Backend + Dashboards Implementation Plan

## 1. Current status and scope

Supabase is connected to the Vercel project, but the integration status check currently returns a database-schema inspection error. Before implementing data-dependent code, re-check the Supabase MCP schema connection and confirm the available project tables. The current app is a frontend prototype with no authentication, database clients, API routes, or persistent state.

This plan adds Supabase Auth, PostgreSQL data storage, RLS, server/client Supabase helpers, public schedule browsing, client booking management, and a single-owner admin area. Online payments are explicitly out of scope; bookings will record an on-premise payment status for future Stripe compatibility.

Confirmed product decisions:

- Guests can view the schedule without registering.
- Booking requires authentication.
- There is one owner/admin rather than an in-app multi-admin system.
- A client can make multiple bookings.
- Track audit log, role changes, and attendance in addition to login, session, and booking history.
- Prefer dedicated slug-based pages; use dialogs only for confirmations and small edits.
- Toast notifications appear at the top-left.

## 2. Recommended route architecture

### Public routes

- `/` — existing Catalyst landing page.
- `/schedule` — public session calendar and filters.
- `/sessions/[slug]` — public session detail page with availability and sign-in/book CTA.
- `/login` — email/password login.
- `/signup` — email/password registration.
- `/auth/callback` — Supabase email confirmation callback.
- `/auth/error` — safe authentication error state.

### Authenticated client routes

- `/app` — client dashboard with upcoming bookings and quick actions.
- `/app/profile` — profile and account settings.
- `/app/bookings` — all upcoming and historical bookings.
- `/app/bookings/[id]` — booking detail, cancellation, and attendance/payment status.

### Owner/admin routes

- `/admin` — dashboard overview, upcoming capacity, recent bookings, and alerts.
- `/admin/sessions` — session list, filters, and CRUD entry point.
- `/admin/sessions/new` — create session.
- `/admin/sessions/[id]` — edit session, availability rules, exceptions, attendance.
- `/admin/session-types` — CRUD session types.
- `/admin/bookings` — booking management, status changes, cancellations, attendance.
- `/admin/clients` — client list, profile, role/status controls, booking history.
- `/admin/reports` — attendance, utilization, bookings, and revenue recorded on premises.
- `/admin/settings` — owner settings and business defaults.

## 3. Data model

All application tables live in `public`, reference `auth.users` where applicable, have timestamps, and enable RLS.

### `profiles`

- `id uuid primary key references auth.users(id) on delete cascade`
- `first_name`, `last_name`, `display_name`
- `phone`, `avatar_path`
- `role text check in ('user', 'client', 'admin') default 'user'`
- `account_status text check in ('active', 'rejected', 'banned') default 'active'`
- `created_at`, `updated_at`

Role authorization must use a trusted app-metadata/custom-claims strategy or a server-side owner check, never editable `user_metadata`.

### `session_types`

- `id`, `slug`, `name`, `description`
- `default_duration_minutes`, `default_price_cents`
- `is_active`, timestamps

### `sessions`

- `id`, `slug`, `session_type_id`
- `title`, `description`, `starts_at`, `ends_at`
- `location`, `max_slots`, `price_cents`
- `status` (`draft`, `published`, `cancelled`, `completed`)
- `cancel_reason`, `cancelled_at`
- `created_by`, timestamps

Add indexes for `starts_at`, `status`, `session_type_id`, and slug.

### `availability_rules`

- `id`, optional `session_type_id`
- `starts_on`, optional `ends_on`
- `weekday`, `start_time`, `end_time`, timezone
- `is_ongoing`, `is_active`, timestamps

### `availability_exceptions`

- `id`, optional `session_id` or rule id
- `exception_date`, optional replacement start/end times
- `exception_type` (`blocked`, `rescheduled`, `capacity_override`)
- `reason`, timestamps

### `bookings`

- `id`, `session_id`, `user_id`
- `status` (`confirmed`, `cancelled`, `waitlisted`, `attended`, `no_show`)
- `booked_at`, `cancelled_at`, `cancel_reason`
- `payment_status` (`unpaid_on_site`, `paid_on_site`, `waived`)
- `notes`, timestamps

Enforce one active booking per user/session with a partial unique index. Capacity must be enforced transactionally on the server/RPC, not only in the UI.

### History and audit tables

- `login_events`: user id, event type, success, IP/user-agent metadata where legally appropriate, created timestamp.
- `session_history`: session id, action, actor id, before/after JSON snapshots, created timestamp.
- `booking_history`: booking id, action, actor id, before/after JSON snapshots, created timestamp.
- `audit_logs`: actor id, action, entity type/id, before/after JSON, request metadata, created timestamp.
- `role_history`: user id, old role, new role, actor id, reason, created timestamp.
- `attendance_records`: booking id, attendance status, marked by, marked at, notes.

Use database triggers for immutable audit/history capture where practical, and restrict writes to trusted server operations.

## 4. Authentication and authorization

1. Add `@supabase/ssr` and `@supabase/supabase-js` using the project package manager and update the lockfile.
2. Add `lib/supabase/client.ts`, `lib/supabase/server.ts`, and Next.js 16 `lib/supabase/proxy.ts` plus root proxy wiring.
3. Add `/auth/callback` and route email confirmation through `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` with the required fallback.
4. Use email/password only for the first release.
5. Create a profile trigger on signup with default `user` role.
6. The single owner/admin identity is established through a controlled seed/setup path, not an open client-side role field.
7. Protect `/app/*` and `/admin/*` server-side. Admin checks must verify trusted role data and account status.
8. Rejected/banned users can sign in only enough to receive a safe status message, not access protected data.
9. Never expose service-role credentials to browser code and never render raw auth errors that reveal account existence.

## 5. Booking and availability behavior

- Public schedule shows only published, active, non-expired sessions.
- Guests can filter by date, type, location, and availability.
- Authenticated users can book multiple different sessions.
- Duplicate active bookings for the same session are rejected at the database level.
- Booking creation checks account status, session status, capacity, and time validity in one server-side transaction.
- Cancellation records reason and actor in booking history/audit log.
- When a session is cancelled, all affected bookings receive a safe status update and history event.
- Owner can override status, capacity, attendance, and on-site payment state.
- Attendance is marked after the session and feeds reports.
- Waitlist is not part of the confirmed first release unless product scope expands; the schema can support it through `waitlisted`.

## 6. RLS and database security

- Enable RLS on every exposed table.
- Public schedule SELECT policies expose only published session data and safe session-type fields.
- Users can SELECT/UPDATE only their own profile.
- Users can SELECT only their own bookings and history.
- Users can INSERT bookings only for themselves through a validated server action/RPC; direct table inserts should not bypass capacity or status checks.
- Only the owner/admin can manage sessions, session types, availability, bookings, reports, roles, and audit views.
- Audit/history tables are append-only to trusted functions and readable only by the owner/admin unless a client-specific view is explicitly required.
- Use `TO authenticated` with explicit ownership predicates; do not rely on `auth.role()`.
- Avoid security-definer functions unless strictly necessary; if used, pin `search_path` and fully qualify names.
- After schema creation, run Supabase advisors and a test query through the Supabase MCP.

## 7. UI and branding guide

Preserve the existing Catalyst direction:

- Palette: charcoal/near-black background, warm off-white text, muted gray surfaces, and one orange action accent.
- Typography: use the existing sans display/body treatment and mono labels for metadata; keep to two font families maximum.
- Layout: mobile-first, flexbox-first, bounded content widths, strong editorial spacing, restrained borders, and purposeful imagery.
- Components: use shadcn patterns for buttons, inputs, select, tabs, table, badge, card, calendar, sheet, alert dialog, and toast.
- Use full pages for dashboards, details, editing, and booking management.
- Use dialogs only for delete/cancel confirmations, attendance toggles, and small inline edits.
- Toasts are fixed top-left, accessible with `aria-live`, and use success/warning/error variants.
- Every route gets descriptive metadata and clear loading, empty, and error states.
- Maintain keyboard navigation, visible focus, readable contrast, reduced-motion behavior, and no horizontal overflow.

## 8. Implementation phases

### Phase 1 — foundation

- Confirm Supabase MCP schema access and inspect existing schema.
- Install pinned Supabase packages.
- Add clients, proxy, callback, auth pages, shared form validation, and toast provider.
- Add baseline security headers without breaking preview embedding.

### Phase 2 — schema and policies

- Create tables, indexes, constraints, triggers, audit/history tables, and RLS.
- Seed the single owner/admin identity through a controlled setup operation.
- Run advisor checks and test public/guest/authenticated/admin query paths.

### Phase 3 — public schedule and auth UX

- Build `/schedule` and `/sessions/[slug]`.
- Build signup/login/logout and safe auth error handling.
- Add booking CTA that routes unauthenticated visitors to login, then back to the session.

### Phase 4 — client dashboard

- Build `/app`, `/app/profile`, `/app/bookings`, and booking detail pages.
- Add booking creation/cancellation and status display.
- Add attendance and on-site payment display where relevant.

### Phase 5 — owner dashboard

- Build session/session-type CRUD and availability management.
- Build bookings, clients, attendance, role/status management, and reports.
- Add audit/history views and owner settings.

### Phase 6 — verification

- Run typecheck/build/lint checks available in the repo.
- Browser-test guest schedule, signup, login, booking, cancellation, admin CRUD, attendance, role changes, and banned/rejected flows.
- Verify RLS with guest, user, client, and admin sessions.
- Test mobile widths, keyboard navigation, reduced motion, empty states, errors, and toast behavior.

## 9. Open implementation safeguards

- Do not write application queries until the Supabase schema/MCP connection error is resolved or the available schema is confirmed.
- Do not add Stripe in this release; retain `payment_status` as on-premise bookkeeping only.
- Do not allow self-service admin role changes.
- Do not rely on client-side route hiding as authorization.
- Keep schema changes reproducible in a committed migration once the MCP schema is stable.

## 10. Acceptance criteria

- A guest can view the public schedule without an account.
- A new user starts with role `user` and can become `client` only after a confirmed booking.
- A client can create multiple valid bookings and manage their own bookings.
- The single owner can manage sessions, availability, clients, bookings, attendance, and reports.
- Capacity, duplicate bookings, cancellation, role changes, bans, and audit/history records are enforced server-side.
- RLS prevents cross-user access and admin-only data exposure.
- No online payment is processed.
- The existing Catalyst visual language remains consistent across all new routes.

## Suggested next step

Resolve the Supabase schema inspection error, then implement Phase 1 and Phase 2 before building dashboard UI. This keeps the frontend aligned with real tables, RLS policies, and booking constraints instead of introducing mock persistence.

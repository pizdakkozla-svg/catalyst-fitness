# Phase 1 — Auth & Profiles

Status: **Delivered** (auth/roles foundation ready for testing)

This document records what was actually built for Phase 1 of the Catalyst
Fitness backend. It is the counterpart to `IMPLEMENTATION_PLAN.md`, which
describes the full multi-phase vision. Phase 1 intentionally covers only the
authentication, role, and mock-dashboard foundation needed to test the
signup / login / role flow.

## Goal

Set up Supabase (all tables), build signup and login pages, handle user roles,
create the admin user manually in Supabase, and provide a mock admin dashboard
and user dashboard so signup, login, and roles can be tested end to end.

## Database (Supabase project `gdbuhdvfyqtthpujiwlk`)

All tables live in `public` with Row Level Security enabled.

| Table | Purpose |
| --- | --- |
| `profiles` | One row per `auth.users` id. Holds `role` (`user` / `admin`) and `status` (`active` / `suspended`). |
| `sessions` | Training sessions shown on the public schedule. |
| `bookings` | User bookings, unique per `(session_id, user_id)`, supports multiple bookings per user. |
| `attendance` | Attendance / no-show per booking, admin-written. |
| `audit_logs` | Append-only record of booking changes and role/status changes. |

Supporting objects:

- `handle_new_user()` trigger auto-creates a `profiles` row on signup.
- `is_admin()` `security definer` helper (pinned `search_path`) used by RLS.
- Booking and role-change audit triggers write to `audit_logs`.
- Indexes on session date, user bookings, and audit timestamps.

## Row Level Security summary

- `sessions` — public `select` (guests can view the schedule); admin-only writes.
- `profiles` — a user reads/updates their own row; admin can read/update all.
- `bookings` — a user reads/writes their own bookings; admin can read/update all.
- `attendance` — user reads own; admin writes.
- `audit_logs` — admin read; inserts limited to the acting user or admin.

## Application code

| Path | Role |
| --- | --- |
| `lib/supabase/client.ts` | Browser Supabase client. |
| `lib/supabase/server.ts` | Server Supabase client. |
| `lib/supabase/proxy.ts` + `proxy.ts` | Session refresh on every request (Next.js 16). |
| `app/signup/page.tsx` | Email/password registration. |
| `app/login/page.tsx` | Email/password login. |
| `app/auth/callback/route.ts` | Exchanges the auth code for a session. |
| `app/dashboard/page.tsx` | Mock client dashboard (schedule + bookings). |
| `app/admin/page.tsx` | Mock admin dashboard, server-side role gate → `/not-authorized`. |
| `app/not-authorized/page.tsx` | Access-denied page shown to non-admins. |
| `app/profile/page.tsx` | Profile page for any role (server-loaded). |
| `components/auth/auth-form.tsx` | Shared signup/login form. |
| `components/auth/user-menu.tsx` | Header avatar button + dropdown (Profile, Log out). |
| `components/profile/profile-form.tsx` | Editable profile UI (name, avatar URL). |
| `components/dashboard/dashboard-shell.tsx` | Client dashboard UI + booking actions. |

## Manual admin assignment

The single owner/admin is assigned manually in Supabase, by design:

1. Register the owner account through `/signup`.
2. In Supabase, set that profile's role to admin:
   `update public.profiles set role = 'admin' where id = '<auth-user-id>';`
3. The account now passes the server-side `/admin` gate and admin RLS checks.

There is no self-service admin promotion in the app.

## How to test

1. Sign up a normal user at `/signup`, confirm email, and log in.
2. Confirm the user lands on `/dashboard` and can see the public schedule.
3. Confirm `/admin` is blocked for the normal user.
4. Promote that user to admin in Supabase, then confirm `/admin` is now allowed.
5. Confirm a guest (logged out) can still view the schedule but cannot book.

## User profile & header account menu

Any signed-in user, regardless of role, has a profile they can view and edit.
The root page header shows a standard account button (avatar image when
available, initials placeholder otherwise) that opens a dropdown with **Profile**
and **Log out**. When signed out, the same slot shows Log in / Sign up.

- `profiles.avatar_url` (nullable `text`) stores an optional avatar image URL.
- The avatar falls back to the user's initials when no `avatar_url` is set.
- Profile edits (name, avatar URL) are saved under the existing per-user RLS
  update policy — a user can only update their own row.
- Log out behaviour is unchanged (existing `supabase.auth.signOut()` flow).

### Checklist

- [x] Add nullable `avatar_url` column to `profiles`.
- [x] Header account button with avatar/initials placeholder and dropdown.
- [x] Dropdown links to Profile and keeps existing Log out working.
- [x] Show Log in / Sign up in the same slot when signed out.
- [x] `/profile` page available to any role (user / client / admin).
- [x] Profile page lets the user edit name and avatar and view role/status.

## Known follow-ups (not part of Phase 1)

- Booking **capacity is not yet enforced server-side** — sessions can currently
  be overbooked. Enforce via an RLS-aware `security definer` RPC before real
  booking use.
- No cancel / re-book UI yet; the `unique (session_id, user_id)` constraint plus
  the `cancelled` status need a cancel flow to avoid a misleading duplicate error.
- Past sessions are not filtered out of the schedule query.

See `IMPLEMENTATION_PLAN.md` for the full roadmap beyond Phase 1.

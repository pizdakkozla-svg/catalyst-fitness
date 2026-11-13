# Catalyst Fitness

Catalyst Fitness is a Next.js marketing site for **Transform 90**, a private fitness coaching program. The site presents the coaching offer, explains the training method, introduces the coach, and provides contact/enrollment entry points.

The current repository is the frontend foundation for the broader fitness coaching portal. It includes the polished public-facing experience and reusable UI patterns; the Supabase-backed authentication, booking, client dashboard, and owner dashboard are planned for the next implementation phase.

## Product surface

- Landing page with hero messaging, coaching value proposition, method overview, and CTAs.
- Contact page with contact details, coach section, CTA block, footer, and modal interactions.
- Join Program modal for enrollment intent.
- Learn More modal with reasons to choose Catalyst.
- Responsive layouts for desktop and mobile.
- Reduced-motion support for animated hero behavior.
- Analytics and Vercel Speed Insights integration.

## Tech stack

- **Framework:** Next.js 16.3 with the App Router
- **Language:** TypeScript 5.7
- **UI:** React 19
- **Styling:** Tailwind CSS 4 with PostCSS and `tw-animate-css`
- **Components:** shadcn/ui project conventions with Base UI primitives
- **Icons:** Lucide React
- **Class utilities:** `clsx`, `tailwind-merge`, and `class-variance-authority`
- **Hosting:** Vercel
- **Analytics:** `@vercel/analytics`
- **Performance monitoring:** `@vercel/speed-insights`
- **Planned backend:** Supabase for email/password auth, PostgreSQL data, Row Level Security, bookings, attendance, audit logs, and owner administration

## Project structure

```text
app/
  page.tsx                    # Landing page route
  contact/page.tsx            # Contact page route
  globals.css                 # Global styles, tokens, and animations
  layout.tsx                  # Root layout and metadata
components/
  sections/
    landing-page.tsx          # Landing page composition and interactions
    contact-page.tsx          # Contact page composition and modals
    interactive-shell.tsx     # Shared interactive shell/modal patterns
  ui/
    button.tsx                # Shared button component
lib/
  data.ts                     # Content and site data
  utils.ts                    # Shared utility helpers
public/
  images/                     # Local hero, training, and coach imagery
Implementation/
  IMPLEMENTATION_PLAN.md      # Backend and portal implementation plan
  implementation_kickstart.md # Product implementation notes
```

## Local development

This project uses pnpm and requires Node.js compatible with the installed Next.js version.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

```bash
pnpm dev      # Start the development server
pnpm build    # Create a production build
pnpm start    # Serve the production build
pnpm lint     # Run ESLint
```

## Environment variables

The project is connected to Supabase through the Vercel environment. The Supabase variables are available in the Vercel project configuration and should not be committed to source control.

Expected Supabase configuration for the planned backend includes:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`
- Server-only Supabase secret/service-role variables where privileged operations are required

Never expose a Supabase secret or service-role key in client components or variables prefixed with `NEXT_PUBLIC_`.

## Development conventions

- Use the Next.js App Router and server components by default.
- Keep interactive behavior in focused client components rather than large page files.
- Use semantic HTML and accessible labels for interactive controls.
- Use themed design tokens from `app/globals.css` instead of hardcoded color utilities.
- Keep the visual system limited to the existing dark, neutral, and amber accent palette.
- Respect `prefers-reduced-motion` for animations and parallax effects.
- Keep generated assets local under `public/` and reference them with root-relative paths.

## Continuing development

The next major workstream is the Supabase-backed coaching portal described in [`Implementation/IMPLEMENTATION_PLAN.md`](Implementation/IMPLEMENTATION_PLAN.md). That work should begin with the database schema and RLS policies, followed by authentication, public schedule browsing, booking flows, the owner dashboard, and client dashboard experiences.

This repository is linked to the v0 project for continued development:

[Continue working in v0](https://v0.app/chat/projects/prj_EkOerYMenFKsxUyc8phwOfucrOcH)

## License

Private project. All rights reserved.

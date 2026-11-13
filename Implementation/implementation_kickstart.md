# Catalyst Fitness Prototype — Implementation Kickstart

## Architecture
- Next.js App Router with server-rendered routes and small client islands for navigation, modal, FAQ, and scroll controls.
- Shared content lives in `lib/data.ts`; visual sections remain focused and under roughly 600 lines.
- No backend, authentication, email capture, payments, analytics, or state-management library in this prototype.

## Responsive strategy
- Mobile-first single-column layouts at phone widths.
- Tablet compositions begin at `md` with two-column content where it improves scanning.
- Desktop navigation and expanded grids begin at `lg`; all sections remain full width with bounded inner content.
- Verify at 320, 390, 768, 1024, and wide desktop widths.

## Interaction map
- Primary Transform 90 CTAs open the same accessible prototype dialog.
- Header navigation uses an accessible hamburger menu on smaller screens.
- Contact Marcus routes to `/contact` and does not collect email.
- FAQ rows use keyboard-accessible disclosure controls.
- Back-to-top appears after scrolling and returns to the page header smoothly.
- Anchor navigation uses smooth scrolling.

## Accessibility and contrast checklist
- Use semantic landmarks and one clear page heading.
- Every image has useful alt text; decorative imagery uses empty alt where appropriate.
- Dialog has a labelled title, close control, escape handling, backdrop handling, and visible focus styles.
- Navigation exposes `aria-expanded` and `aria-controls`.
- Accent orange is reserved for action and active states; pair with readable text.
- Test muted text and borders on glass surfaces before production use.
- Respect `prefers-reduced-motion` by removing nonessential transforms and transitions.

## SEO checklist
- Descriptive route titles and descriptions.
- Semantic headings, metadata, viewport, and theme color.
- Local images with stable paths and meaningful alt text.
- Clear internal `/contact` route and crawlable anchor structure.

## Verification
- Run lint/build checks available in the project.
- Browser-test desktop, tablet, and mobile screenshots.
- Exercise menu, CTA dialog, escape/backdrop close, FAQ, Contact Marcus route, and back-to-top.
- Check horizontal overflow, hydration errors, keyboard focus, and reduced-motion behavior.

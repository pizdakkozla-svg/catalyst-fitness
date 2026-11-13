# Catalyst Fitness Design Tokens

## Color roles
- `background`: near-black canvas for the dark prototype.
- `foreground`: warm white for primary copy.
- `card`: graphite-black glass surface.
- `muted-foreground`: desaturated warm gray for supporting copy.
- `primary`: ignition orange used for CTAs, active indicators, and key proof details.
- `border`: low-opacity warm-gray line visible against glass.

The palette intentionally stays within a dark neutral system plus one accent. Glass uses low-opacity card surfaces and backdrop blur, with borders retained so cards do not disappear into the canvas. Contrast is a prototype target and should be rechecked with final imagery and content.

## Typography
- Geist Sans for all UI and marketing copy.
- Geist Mono for utility labels, eyebrow copy, and data-like details.
- Headlines use tight tracking and strong weight rather than a separate display family.

## Shape and depth
- Medium rounded corners for cards and controls.
- Glass cards: translucent graphite, `backdrop-filter: blur(18px)`, and a subtle border.
- Shadows stay soft and neutral; no gradients or decorative blobs.

## Motion
- Short opacity/translate reveals and border/color transitions.
- Smooth scrolling for intentional anchor navigation.
- Nonessential animation is disabled under `prefers-reduced-motion`.

## Responsive intent
- Comfortable mobile gutters, stacked cards, thumb-reachable sticky action.
- Tablet uses balanced two-column compositions.
- Desktop adds navigation density and wider proof/pricing grids without changing content hierarchy.

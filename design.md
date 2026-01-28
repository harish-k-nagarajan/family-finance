# Family Finance Design Guide

The goal is simple. Make the product feel light, modern, animated, and intentional in both dark and light mode.

---

## Design Principles

1. Glass first
   Everything sits on frosted surfaces. Backgrounds create depth, cards float, content breathes.

2. Motion over borders
   Use movement and opacity instead of thick lines and boxes.

3. Fewer colors, smarter usage
   Accents guide attention. They do not decorate empty space.

4. Light and dark are equals
   Light mode is not an afterthought. Both modes must feel native.

5. If it feels boring, it is wrong
   Finance does not need to feel sterile.

---

## Visual Direction

### Overall Feel

Soft glass cards layered over rich gradient backgrounds. Subtle grain. Floating highlights. Smooth transitions everywhere. Nothing snaps. Nothing jumps.

Think premium consumer app, not internal dashboard.

---

## Color System

### Background Gradients

Dark mode background

Radial gradient anchored top left with deep navy and indigo tones. Secondary gradient bottom right to add depth.

Light mode background

Soft pastel gradient using cool blue and warm pink tones. Very low saturation. The background should feel airy, not white.

Backgrounds must never be flat colors.

---

### Glass Cards

All content lives inside glass cards.

Dark mode cards

Translucent dark surface with blur applied. Soft inner highlight. Thin border with low opacity white.

Light mode cards

Milky white surface with higher opacity. Stronger shadow for separation. No harsh borders.

Cards float above the background. They never blend into it.

---

### Accent Colors

Primary accent
Teal leaning slightly blue. Used for totals, active states, and primary actions.

Secondary accent
Purple for charts, highlights, and emphasis.

Tertiary accent
Electric blue for motion, focus rings, and progress indicators.

Accents are used sparingly. If everything is colorful, nothing stands out.

---

## Typography

### Fonts

Headers
Clash Display or Plus Jakarta Sans. Bold and confident.

Body
Inter. Clean and readable.

No system fonts. This is not a prototype.

---

### Type Scale

Page titles are large and expressive.

Card titles are clear and calm.

Numbers are the hero. They should be larger than surrounding text.

Never let labels compete with values.

---

## Layout System

### Page Structure

Each page follows the same rhythm.

Top summary section with key numbers.

Middle section with charts or grouped cards.

Bottom section for lists and details.

Whitespace is intentional. Empty space is allowed.

---

### Grid

Use a twelve column grid on desktop.

Cards snap to grid but do not feel boxed.

Mobile collapses into a single column with generous spacing.

---

## Navigation

### Sidebar

Glass sidebar with blur and transparency.

Icons first, labels second.

Active item glows slightly using accent color.

Collapsed mode keeps icons visible with hover tooltips.

Sidebar should feel like it floats above the page.

---

### Top Actions

Primary actions like Add Investment are visually elevated.

Gradient button. Soft glow on hover. Slight lift animation.

Secondary actions are ghost buttons. Never filled.

---

## Components

### Cards

Every card follows the same rules.

Rounded corners, large radius.

Soft shadow in light mode. Subtle glow in dark mode.

Hover causes slight upward movement and shadow increase.

Cards never feel static.

---

### Tables and Lists

No harsh table borders.

Use row separation through spacing and subtle background shifts.

Hover highlights rows with translucency, not color blocks.

---

### Forms

Inputs live inside glass surfaces.

Focused input glows slightly using accent color.

Labels float or sit above fields. Never inside as placeholders only.

Errors are calm. Red is muted, not aggressive.

---

### Empty States

Empty states are opportunities.

Use friendly copy.

Add subtle illustration or icon with motion.

Primary action button is obvious and inviting.

Never leave a blank gray box.

---

## Charts

Charts must feel alive.

Use gradients, never flat strokes.

Lines animate in on load.

Axes are subtle. Labels are readable.

Dark mode charts glow softly. Light mode charts cast faint shadows.

No chart should appear without animation.

---

## Motion System

Motion is not decoration. It explains state changes.

### Page Transitions

Fade and slight vertical movement when navigating.

Duration around three hundred milliseconds.

---

### Hover Interactions

Cards lift slightly.

Buttons glow and compress on click.

Icons rotate or shift subtly.

---

### Numbers

All financial numbers animate between values.

Use easing that feels natural.

Never snap from one value to another.

---

## Theme Switching

Theme switching must feel intentional.

Fade between themes.

Background gradient morphs smoothly.

Icons rotate or crossfade.

No flash. No jump. No reflow.

Theme preference is loaded before first render. If there is flicker, it is a bug.

---

## Dark and Light Mode Rules

Design in dark and light simultaneously.

If a component looks good in one and bad in the other, it is unfinished.

Contrast is mandatory. Glass does not mean unreadable.

Shadows get stronger in light mode. Glows get stronger in dark mode.

---

## Tone and Copy

Friendly. Direct. Human.

No corporate language.

No filler text.

If something failed, say it failed.

If something updated, say it updated.

---

## Final Quality Bar

If the screen feels empty, add depth.

If it feels heavy, remove borders.

If it feels boring, add motion.

If it feels flashy, remove color.

This app should feel like something you would pay for.

If it does not, keep iterating.


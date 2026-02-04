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

### Advanced Component Patterns

**Profile Picture Upload**

Drag-and-drop zone with visual feedback.

Dashed border on hover. Icon and helper text centered.

File validation shows inline (5MB max, images only).

Preview renders immediately after selection.

Circular crop indicator on hover over existing photo.

**Country Select**

Searchable dropdown with flag emoji prefixes.

Search input filters by country name.

Scroll list shows flags first, then country name.

Selected value displays flag + name in collapsed state.

Keyboard navigation supported (arrow keys, enter to select).

**Loan Type Icons**

Visual indicators using Lucide React icons.

Home icon for mortgages. Car icon for auto loans.

Graduation cap for student loans. Credit card for personal loans.

Document icon for "other" loan types.

Icons appear in tabs, cards, and lists for quick identification.

**Avatar Component**

Circular profile display with border.

Shows profile picture if uploaded.

Falls back to user initials if no photo (first letter of display name).

Gradient background generated from user ID for consistency.

Hover state shows subtle scale effect.

**Toggle Switch**

Smooth animated switch with theme-aware colors.

Track changes from gray to accent color on enable.

Knob slides with spring animation (not linear).

Label positioned to left or right of switch.

Disabled state shows reduced opacity.

---

### Modal Design Patterns

**Confirmation Modal**

Centered overlay with glassmorphic backdrop blur.

Modal card floats above with shadow (light) or glow (dark).

Title in bold, description in regular weight.

Two-button layout: Cancel (secondary) on left, Confirm (primary/destructive) on right.

Close icon in top-right corner (optional).

Overlay click dismisses modal (unless destructive action).

**Form Modals**

Structured layout with clear sections.

Title at top, form fields in middle, actions at bottom.

Input labels always visible above fields.

Error messages appear below respective inputs.

Primary action button disabled until valid input.

**Modal Actions**

Primary buttons use gradient fill with glow.

Destructive actions use red accent (not bright red, muted).

Secondary actions are ghost buttons (transparent with border).

Button order: Cancel/Back on left, Primary/Destructive on right.

---

### Enhanced Form Components

**SearchableSelect**

Dropdown with integrated search input at top.

List filters in real-time as user types.

Keyboard navigation: arrow keys to move, enter to select, escape to close.

Selected value shown in collapsed state with chevron icon.

No results state shows friendly message ("No matches found").

**File Upload (Drag-and-Drop)**

Dashed border zone with hover state change.

Icon (upload cloud) centered with helper text below.

Drag over changes border to accent color with scale effect.

File name displays after selection with remove button.

Error state shows red border with message below.

**Input States**

Focus: glow effect using accent color (subtle, not harsh).

Error: red border with error message below (calm red, not aggressive).

Disabled: reduced opacity with cursor not-allowed.

Success: optional green checkmark icon on right (used sparingly).

---

### Loading States

**Skeleton Loaders**

Animated gray shimmer blocks for content placeholders.

Match shape of actual content (rectangles for text, circles for avatars).

Shimmer animation moves left to right with gradient.

Duration: continuous loop until content loads.

Used during initial page load and data fetches.

**Empty States**

Specific patterns for "No data yet" scenarios.

Icon centered (relevant to content type).

Friendly message explaining what's missing.

Call-to-action button prominent and inviting.

Example: "No accounts yet" shows bank icon, friendly copy, "Add Account" button.

Never show empty gray space without explanation.

---

### Button Variants

**Primary**

Gradient fill with glow on hover.

Used for main actions (Add Account, Save, etc.).

Scale effect on hover (1.02x).

Active state shows slight compression.

**Hero**

Large buttons for main actions on page load.

Gradient fill with stronger glow.

Icon + text layout (icon on left).

Used for: Add Investment, Add Bank Account, Add Loan.

Prominent size draws attention.

**Destructive**

Red accent for delete/remove actions.

Not bright red—muted red that fits theme.

Hover strengthens red slightly.

Always paired with confirmation modal.

**Secondary**

Ghost/outline style for less prominent actions.

Transparent background with border.

Hover adds subtle background fill.

Used for: Cancel, Go Back, Skip.

---

### Notification Patterns

**Toast Notifications**

Bottom-right floating toasts with glassmorphic styling.

Success: green accent with checkmark icon.

Error: red accent with X icon.

Info: blue accent with info icon.

Auto-dismiss after 3-4 seconds (or user can dismiss).

Slide-in animation from bottom.

Multiple toasts stack vertically.

**Inline Feedback**

Subtle messages within cards after actions.

Used for immediate feedback (e.g., "Saving...").

Appears below action button or at top of card.

Fades out after 2 seconds.

Less intrusive than toasts for minor updates.

---

### Special Card Designs

**Wealth Radar Card**

Distinct styling for AI insights.

"Powered by Perplexity" badge at bottom with logo.

Content formatted as bulleted list (5 key points).

Refresh button in top-right corner.

Last updated timestamp at bottom.

Loading state shows skeleton with shimmer.

**Payment History Card**

Table/list hybrid with summary statistics at top.

Summary shows: Total Paid, Total Principal, Total Interest.

List below shows individual payments with date, amount, P&I breakdown.

Delete button appears on hover (destructive action).

Alternating row colors for readability (subtle).

**Category Cards (Dashboard)**

Summary cards with icons and trend indicators.

Large number at center (animated on change).

Icon in top-left corner (bank, investment, home).

Trend arrow and percentage in top-right (green up, red down).

Hover lifts card slightly with increased shadow.

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


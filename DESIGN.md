---
name: La Ragazza Web
description: Bilingual restaurant website centered on warm hospitality and artisanal craft.
colors:
  house-bordeaux: "#662a2a"
  cellar-brown: "#331717"
  olive-leaf: "#749f62"
  linen-surface: "#f8f7f6"
  porcelain-white: "#ffffff"
typography:
  display:
    fontFamily: "Cinzel, serif"
    fontSize: "clamp(2.25rem, 6vw, 5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.04em"
  headline:
    fontFamily: "Cinzel, serif"
    fontSize: "clamp(1.75rem, 4vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
  title:
    fontFamily: "Cinzel, serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.02em"
  body:
    fontFamily: "Lora, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0em"
  label:
    fontFamily: "Cinzel, serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  sm: "0.375rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  pill: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.house-bordeaux}"
    textColor: "{colors.porcelain-white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.cellar-brown}"
    textColor: "{colors.porcelain-white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.5rem"
  button-outline:
    backgroundColor: "{colors.porcelain-white}"
    textColor: "{colors.house-bordeaux}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.5rem"
  card-menu:
    backgroundColor: "{colors.porcelain-white}"
    textColor: "{colors.cellar-brown}"
    rounded: "{rounded.xl}"
    padding: "1.5rem 1rem"
---

# Design System: La Ragazza Web

## Overview
**Creative North Star: "The Family Table"**

This system is warm and welcoming with handcrafted details. It should feel like stepping into a trusted neighborhood dining room, where every surface carries care and familiarity.

Visual language combines deep bordeaux anchors, soft cream breathing room, and olive accents used as punctuation. Typography pairs ceremonial display moments with readable editorial body copy so menus and contact actions stay clear while brand character remains present.

The system must project authenticity over costume. It explicitly rejects visuals that feel theatrical, generic, or emotionally cold.

**Key Characteristics:**
- Strong hospitality tone, never transactional-first.
- High readability with elegant serif hierarchy.
- Accent color used with intent, not constant saturation.
- Motion and hover feedback that feel tactile and welcoming.
- Bilingual parity in rhythm, spacing, and hierarchy.

## Colors
Palette character is culinary and warm, with one deep anchor, one structural dark, and one herb accent.

### Primary
- **House Bordeaux** (`#662a2a`): Principal brand color for headlines, key text emphasis, and primary interactive states.

### Secondary
- **Cellar Brown** (`#331717`): Structural dark for header/footer backgrounds, hero fields, and high-contrast text contexts.

### Tertiary
- **Olive Leaf** (`#749f62`): Accent for separators, highlighted labels, and selective affordances.

### Neutral
- **Linen Surface** (`#f8f7f6`): Main background wash for long-scroll reading comfort.
- **Porcelain White** (`#ffffff`): Card and section contrast layer on top of linen surface.

### Named Rules
**The House Accent Rule.** Olive Leaf appears as punctuation, not as the dominant field, so emphasis remains legible and intentional.
**The Hospitality Contrast Rule.** Body and supporting text stays in deep ink-adjacent tones over light surfaces to preserve WCAG AA readability.

## Typography
**Display Font:** Cinzel (`serif`)
**Body Font:** Lora (`serif`)
**Label/Mono Font:** Cinzel (`serif`) for micro-labels and uppercase navigation cues.

**Character:** Display typography carries heritage and ceremony, while body typography carries warmth and narrative clarity.

### Hierarchy
- **Display** (`700`, `clamp(2.25rem, 6vw, 5rem)`, `1.1`): Hero and marquee moments.
- **Headline** (`700`, `clamp(1.75rem, 4vw, 3.5rem)`, `1.2`): Section-level anchors.
- **Title** (`700`, `1.25rem`, `1.3`): Card titles, FAQ triggers, and subsection identifiers.
- **Body** (`400`, `1rem`, `1.65`): Descriptions and long-form copy, keep line length around `65-75ch` where possible.
- **Label** (`700`, `0.75rem`, `0.12em` letter-spacing): Navigation and filter controls, uppercase only for short UI labels.

### Named Rules
**The Two-Voice Rule.** Cinzel speaks for structure and emphasis, Lora speaks for narrative and comfort.
**The Legibility-First Rule.** Decorative hierarchy never lowers body contrast or reading pace.

## Elevation
This system is mostly flat at rest, with elevation used as response feedback. Depth comes from subtle shadow pulses on hover and slight motion shifts, not persistent heavy layering.

### Shadow Vocabulary
- **Interactive Lift** (`0 10px 22px rgba(51, 23, 23, 0.2)`): Buttons and high-intent controls on hover.
- **Card Lift** (`0 14px 28px rgba(51, 23, 23, 0.14)`): Menu cards and content blocks on hover.
- **Press Feedback** (`0 4px 12px rgba(51, 23, 23, 0.15)`): Active state compression.

### Named Rules
**The Flat-Until-Intent Rule.** Surfaces stay quiet until user intent, then elevate briefly to confirm interaction.

## Components
Component philosophy: tactile and welcoming.

### Buttons
- **Shape:** Rounded pill for CTA contexts (`9999px`) and soft rounded controls for utility contexts (`0.75rem`).
- **Primary:** Bordeaux field with white text and uppercase Cinzel labels (`0.75rem 1.5rem` padding baseline).
- **Hover / Focus:** Lift plus color deepening, no harsh glow.
- **Secondary / Outline:** White or transparent surface with bordeaux border and text, inverting on hover.

### Chips
- **Style:** Light olive tint background with olive text for dietary and metadata signals.
- **State:** Chips remain compact and informational, no heavy shadow or loud fill.

### Cards / Containers
- **Corner Style:** Soft large corners (`1rem` to `1.5rem`) for menu and feature blocks.
- **Background:** White cards over linen surface with low-chroma borders.
- **Shadow Strategy:** Hover-only lift aligned with Elevation vocabulary.
- **Internal Padding:** Comfortable, generally `1rem` to `1.5rem` with breathing room around text.

### Inputs / Fields
- **Style:** For FAQ and button-driven interactions, controls use subtle borders and warm background deltas.
- **Focus:** Focus and expanded states rely on color and spacing shifts, never on abrupt effects.
- **Error / Disabled:** Preserve contrast-first text treatment and maintain the same serif voice.

### Navigation
- **Style:** Dark structural background with high-contrast white labels.
- **Typography:** Uppercase Cinzel labels with tracked spacing for wayfinding cadence.
- **States:** Accent underline and color shift on hover; active route uses Olive Leaf for orientation.
- **Mobile Treatment:** Full-height overlay menu with large typographic links and preserved contrast.

## Do's and Don'ts
### Do:
- **Do** keep hospitality tone visible in every primary section through clear hierarchy and warm contrast (`#662a2a`, `#331717`, `#f8f7f6`).
- **Do** use Olive Leaf (`#749f62`) as targeted emphasis on dividers, highlights, and state cues.
- **Do** preserve tactile interaction feedback (lift on hover, press compression on active).
- **Do** keep bilingual screens structurally equivalent so Spanish and English experiences feel equally authored.

### Don't:
- **Don't** use overly rustic or cliché “Italian stereotype” aesthetics that feel theatrical instead of authentic.
- **Don't** use generic SaaS-style marketing composition patterns that flatten local identity.
- **Don't** use cold, minimal monochrome presentation that removes warmth and hospitality.
- **Don't** reduce body contrast into low-ink tints on cream surfaces just to appear elegant.

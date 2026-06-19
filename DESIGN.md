---
name: "Requirements | Bean9"
description: "A calm, dark requirements workbench for traceable software delivery."
colors:
  brand-abyss: "#091413"
  brand-canopy: "#285A48"
  primary-jade: "#408A71"
  brand-mint: "#B0E4CC"
  app-background: "#222222"
  sidebar-background: "#1F1F1F"
  card-surface: "#282828"
  muted-surface: "#2E2E2E"
  accent-surface: "#353535"
  popover-surface: "#2C2C2C"
  foreground: "#E8F1EC"
  muted-foreground: "#9CA8A3"
  border: "#3D3D3D"
  destructive: "#F97373"
typography:
  display:
    fontFamily: "Rubik, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Roboto Condensed, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Roboto Condensed, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.35
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.01em"
rounded:
  sm: "6.6px"
  md: "8.64px"
  lg: "12px"
  xl: "15px"
  2xl: "18.6px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary-jade}"
    textColor: "{colors.brand-abyss}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.app-background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "40px"
  input-default:
    backgroundColor: "{colors.muted-surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "40px"
  badge-default:
    backgroundColor: "{colors.primary-jade}"
    textColor: "{colors.brand-abyss}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
    height: "20px"
  card-default:
    backgroundColor: "{colors.card-surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: Requirements | Bean9

## Overview

**Creative North Star: "The Structured Workbench"**

The interface is a focused workspace for turning ambiguous project input into reviewable, traceable artifacts. Its dark neutral foundation lowers visual fatigue, while jade and mint provide a precise signal for action, selection, and progress.

The system is information-dense but never frantic. Familiar controls, stable navigation, restrained motion, and clear state language create trust. It explicitly rejects playful consumer-app styling, generic neon AI cockpit visuals, decorative glassmorphism, gradient-heavy surfaces, ornamental SaaS dashboards, and interactions that trade clarity for novelty.

**Key Characteristics:**

- Dark neutral work surfaces with a restrained jade signal color.
- Compact, repeatable controls designed for long working sessions.
- Clear hierarchy across organization, project, artifact, and AI-assistant contexts.
- State-driven motion that remains useful with reduced motion enabled.
- Human review and next actions are visible whenever AI participates.

## Colors

The palette combines neutral charcoal work surfaces with a tightly controlled green family that signals brand, action, and state.

### Primary

- **Working Jade** (`primary-jade`): Primary actions, current selection, progress, focus, and high-value state indicators.
- **Review Mint** (`brand-mint`): High-contrast brand detail, selected markers, concise labels, and moments that need gentler emphasis than the primary action.

### Secondary

- **Canopy Green** (`brand-canopy`): Secondary actions, supporting charts, and deeper selected-state surfaces.
- **Abyss Green** (`brand-abyss`): Brand overlay, dark foreground against mint or jade, and deep tinted backdrops; never the default page background.

### Neutral

- **Worktop Charcoal** (`app-background`): The persistent application canvas.
- **Rail Charcoal** (`sidebar-background`): Navigation rails and secondary workspace framing.
- **Tool Surface** (`card-surface`): Cards, controls, and grouped work areas.
- **Muted Tool Surface** (`muted-surface`): Inputs, subdued controls, and secondary containers.
- **Raised Tool Surface** (`popover-surface`): Menus, popovers, and elevated interaction layers.
- **Primary Ink** (`foreground`): Main text and icons.
- **Secondary Ink** (`muted-foreground`): Supporting copy and metadata; it must still meet WCAG 2.2 AA.
- **Structural Line** (`border`): Dividers, control outlines, and surface boundaries.
- **Action Red** (`destructive`): Errors and destructive actions only.

**The Signal Color Rule.** Jade and mint communicate action, selection, progress, or status. They are never scattered as decoration.

**The Neutral Canvas Rule.** The application canvas stays neutral charcoal. Brand abyss is an overlay and brand depth token, not a full-page background.

## Typography

**Display Font:** Rubik with Inter and system sans fallbacks  
**Body Font:** Inter with system sans fallbacks  
**Label/Heading Font:** Roboto Condensed for page, card, and dialog headings

**Character:** The typography is practical and technical without becoming mechanical. Inter carries dense product content, Roboto Condensed adds economical hierarchy, and Rubik is reserved for compact brand moments.

### Hierarchy

- **Display** (600, 24px, 1.1): Brand marks and rare identity moments, never routine interface labels.
- **Headline** (700, 24px, 1.2): Page titles and the highest local hierarchy.
- **Title** (500, 16px, 1.35): Dialog, card, and section titles.
- **Body** (400, 14px, 1.5): Product copy, table content, form help, and descriptions. Long prose stays within 65–75ch.
- **Label** (600, 12px, 1.35): Control labels, metadata, compact navigation, and badges.

**The One Working Voice Rule.** Inter is the default interface voice. Roboto Condensed and Rubik earn their use through hierarchy or brand function; they never appear merely to add variety.

## Elevation

Depth is a hybrid of tonal layering, one-pixel structural boundaries, and compact shadows. Resting surfaces remain quiet. Stronger elevation belongs to transient layers, hover response, or modal focus; blur is functional when it separates an overlay, not a decorative material applied everywhere.

### Shadow Vocabulary

- **Resting Control:** A compact small shadow that separates controls from adjacent charcoal surfaces.
- **Active Action:** A restrained jade-tinted medium shadow for primary buttons and selected high-value actions.
- **Floating Layer:** A stronger large shadow for menus, select popups, sheets, and dialogs.
- **Modal Layer:** The strongest shadow, paired with a dark brand overlay, reserved for modal focus.

**The Flat-Until-Active Rule.** Tonal contrast and borders establish structure at rest. Strong shadows appear only when interaction or layer hierarchy requires them.

**The One Boundary Rule.** Do not combine a decorative wide shadow with a decorative border. Each boundary must have a structural reason.

## Components

Components feel compact, capable, and consistent. Every interactive element includes default, hover, focus, active, disabled, loading, and error behavior where applicable.

### Buttons

- **Shape:** Firmly rounded rectangle using the large radius token; icon-only and extra-dense controls may use the medium radius.
- **Primary:** Working Jade with Abyss Green text, 40px default height, and compact horizontal padding.
- **Hover / Focus:** Slight jade shift, compact elevation increase, and a visible three-pixel focus ring. Active state scales to 97%; reduced motion removes the scale.
- **Secondary / Ghost / Tertiary:** Neutral or canopy surfaces preserve the same shape, type weight, and interaction timing.

### Chips

- **Style:** Full-pill shape, 20px height, compact label typography, and semantic color assignment.
- **State:** Filled jade or canopy indicates selected and semantic states; outline and ghost treatments remain neutral for passive metadata.

### Cards / Containers

- **Corner Style:** Gently rounded work surfaces using the large radius token.
- **Background:** Tool Surface over Worktop Charcoal; muted footer regions use Muted Tool Surface.
- **Shadow Strategy:** Compact resting elevation only; stronger shadow is a response to hover or layer changes.
- **Border:** One-pixel Structural Line with restrained opacity.
- **Internal Padding:** 12px for compact cards and 16px for standard cards.

### Inputs / Fields

- **Style:** Muted Tool Surface, one-pixel border, 40px default height, and the same large radius as buttons.
- **Focus:** Border shifts to Working Jade with a visible three-pixel translucent ring.
- **Error / Disabled:** Action Red owns error treatment; disabled fields reduce opacity and interaction while retaining readable content.

### Navigation

Navigation uses compact Inter labels, Lucide icons, neutral resting states, and one consistent active treatment: a restrained jade-tinted surface or a raised neutral segment. Sidebars collapse structurally on smaller screens; typography does not scale fluidly.

### AI Assistant

The AI surface is a working panel, not a spectacle. It must expose session status, tool or approval requests, generated proposals, errors, and the next human action. Motion communicates generation and state change; it never obscures content or implies certainty the system does not have.

**The Familiar Control Rule.** A save button, filter, select, dialog, or table behaves like the same control everywhere else in the product.

## Do's and Don'ts

### Do:

- **Do** use neutral charcoal surfaces as the dominant canvas and reserve Working Jade for meaningful state.
- **Do** keep controls compact, keyboard accessible, and visually consistent across organizations, projects, artifacts, and AI panels.
- **Do** use 150–250ms state transitions with clear reduced-motion alternatives.
- **Do** show loading, empty, error, approval, and uncertainty states with an obvious next action.
- **Do** preserve readable contrast and non-color cues for every semantic state.

### Don't:

- **Don't** use playful consumer-app styling that makes professional project work feel lightweight.
- **Don't** use generic neon AI cockpit visuals, excessive glow, or technology theater.
- **Don't** use decorative glassmorphism, gradient-heavy surfaces, or ornamental SaaS dashboards.
- **Don't** introduce inconsistent controls or novel interactions that make standard tasks harder to learn.
- **Don't** ship empty states or AI output that hide uncertainty or leave the next action unclear.
- **Don't** use colored side-stripe borders, gradient text, oversized card radii, or decorative motion.

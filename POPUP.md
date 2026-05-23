---
name: Deep Performance Grid
colors:
  surface: '#200f0d'
  surface-dim: '#200f0d'
  surface-bright: '#4a3431'
  surface-container-lowest: '#1a0a08'
  surface-container-low: '#291715'
  surface-container: '#2e1b19'
  surface-container-high: '#392523'
  surface-container-highest: '#452f2d'
  on-surface: '#fddbd7'
  on-surface-variant: '#e7bcb8'
  inverse-surface: '#fddbd7'
  inverse-on-surface: '#402b29'
  outline: '#ae8883'
  outline-variant: '#5e3f3c'
  surface-tint: '#ffb4ab'
  primary: '#ffb4ab'
  on-primary: '#690006'
  primary-container: '#ff544b'
  on-primary-container: '#5c0005'
  inverse-primary: '#c00014'
  secondary: '#adc7ff'
  on-secondary: '#002e68'
  secondary-container: '#4a8eff'
  on-secondary-container: '#00285b'
  tertiary: '#6ad4f4'
  on-tertiary: '#003642'
  tertiary-container: '#229dbc'
  on-tertiary-container: '#002e3a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc7ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004493'
  tertiary-fixed: '#b3ebff'
  tertiary-fixed-dim: '#6ad4f4'
  on-tertiary-fixed: '#001f27'
  on-tertiary-fixed-variant: '#004e5f'
  background: '#200f0d'
  on-background: '#fddbd7'
  surface-variant: '#452f2d'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system is built for high-stakes, data-intensive environments such as sports analytics, fintech, or real-time monitoring. The personality is **authoritative, high-performance, and precise**. It utilizes a **Modern Corporate** style with a dark, cinematic foundation that minimizes eye strain during long sessions while using high-saturation accents to highlight critical data points and actions.

The aesthetic relies on deep obsidian surfaces, sharp contrast ratios, and a strict information hierarchy to ensure that "at-a-glance" readability is never compromised by the complexity of the data.

## Colors

The palette is optimized for a **Dark Mode** first experience.
- **Background**: A deep obsidian (#0a0a0a) provides the canvas for maximum contrast.
- **Surface**: Container elements use a slightly lighter charcoal (#1a1a1a) to establish layering.
- **Accents**: 
  - **Primary (Vibrant Red)**: Used for critical states, "Live" indicators, and primary action buttons.
  - **Secondary (Blue)**: Used for informative metrics, progress bars, and secondary interactive elements.
- **Semantic States**: 
  - **Success**: A crisp emerald green (#28a745) for positive values and "Available" states.
  - **Critical**: Shared with the primary red for urgent alerts or negative thresholds.
- **Typography**: Primary text is high-contrast white or off-white (#e0e0e0), with muted greys for metadata.

## Typography

This design system utilizes **Inter** for its exceptional legibility in data-dense interfaces and high X-height.
- **Headlines**: Use bold weights with tight letter-spacing for a modern, impactful look.
- **Data Numbers**: Large summary cards should use `display-lg` to ensure the most critical numbers are the first thing a user sees.
- **Labels**: Micro-copy and secondary data points use `label-sm` or `label-bold` with uppercase styling to differentiate from body text.
- **Mobile Scaling**: For mobile views, `display-lg` should be capped at `32px` to prevent overflow, while body text remains consistent for readability.

## Layout & Spacing

The layout follows a **4px baseline grid** to maintain strict alignment in data tables and card grids.
- **Grid System**: Use a 12-column fluid grid for desktop with 16px gutters.
- **Card Containers**: Cards should utilize `md` (16px) padding for internal content.
- **Data Density**: In data-heavy tables, vertical cell padding should be reduced to `sm` (8px) to maximize information density.
- **Breakpoints**: 
  - Mobile: < 600px (Single column cards, hidden secondary table columns).
  - Tablet: 600px - 1024px (2-column grid).
  - Desktop: > 1024px (3 or 4-column grid for summary cards).

## Elevation & Depth

This design system avoids traditional soft shadows in favor of **Tonal Layers** and **Subtle Outlines**.
- **Level 0 (Background)**: #0a0a0a.
- **Level 1 (Cards/Sections)**: #1a1a1a with a 1px solid border (#2a2a2a).
- **Level 2 (Modals/Popovers)**: #252525 with a slightly brighter border and a subtle 10% opacity black shadow for physical separation.
- **Interactivity**: Hover states on interactive cards should transition the border color to the primary red (#ff3131) or increase the surface brightness slightly to #222222.

## Shapes

The shape language is **Professional and Precise**, opting for small radii that feel modern but maintain a structured, "engineered" look.
- **Buttons & Inputs**: 0.25rem (4px) corner radius.
- **Cards**: 0.5rem (8px) corner radius.
- **Chips/Status Tags**: 0.25rem (4px) or fully pill-shaped (1rem) depending on the context (e.g., status tags are pill-shaped, but action chips are squared).

## Components

### Buttons
- **Primary**: Solid #ff3131 with white text. High-contrast.
- **Secondary**: Ghost style with #007bff border and text.
- **Minute Controls**: Small (24px height), square-ish buttons with `label-bold` text. Used for incrementing/decrementing values.

### Summary Cards
- Feature a top-aligned label in `label-bold`, a central large number in `display-lg`, and a bottom-aligned trend indicator (green for success, red for critical).

### Data Tables
- Header row: Darker background (#111), uppercase labels, 1px bottom border.
- Rows: Subtle hover state (#222). 
- Columns: Use fixed widths for "Minute" or "Status" columns to maintain vertical scan lines.

### Chips & Badges
- Used for team names or category filters. High contrast background with low-opacity fills (e.g., 15% opacity of the accent color) to keep the UI from feeling too heavy.

### Inputs
- Dark backgrounds (#050505) with #333 borders. Focus state transitions the border to #007bff.
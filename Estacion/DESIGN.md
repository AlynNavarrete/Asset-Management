---
name: Executive Asset Intelligence
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#424656'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#727687'
  outline-variant: '#c2c6d8'
  surface-tint: '#0054d6'
  primary: '#0050cb'
  on-primary: '#ffffff'
  primary-container: '#0066ff'
  on-primary-container: '#f8f7ff'
  inverse-primary: '#b3c5ff'
  secondary: '#4f5f7b'
  on-secondary: '#ffffff'
  secondary-container: '#ccdefe'
  on-secondary-container: '#51617d'
  tertiary: '#4f5a66'
  on-tertiary: '#ffffff'
  tertiary-container: '#67737f'
  on-tertiary-container: '#f4f8ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa4'
  secondary-fixed: '#d5e3ff'
  secondary-fixed-dim: '#b6c7e7'
  on-secondary-fixed: '#091c34'
  on-secondary-fixed-variant: '#374762'
  tertiary-fixed: '#d8e4f2'
  tertiary-fixed-dim: '#bcc8d5'
  on-tertiary-fixed: '#111d26'
  on-tertiary-fixed-variant: '#3d4853'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  gutter: 24px
  margin-page: 32px
  sidebar-width: 260px
  sidebar-collapsed: 72px
---

## Brand & Style

This design system is engineered for high-stakes commercial real estate oversight. The brand personality is authoritative yet technologically forward-leaning, balancing the stability of traditional asset management with the efficiency of a modern SaaS platform.

The visual style is **Corporate Modern**, characterized by a disciplined use of whitespace, high-fidelity data visualization, and a "dashboard-first" hierarchy. It utilizes a structured interface that prioritizes legibility and rapid information retrieval, ensuring that complex lease and negotiation data remain accessible at a glance. The emotional response should be one of total control, precision, and institutional trust.

## Colors

The palette is anchored by a deep navy sidebar to provide a strong structural frame, contrasting with a light, airy workspace.

- **Primary & Active:** Electric Blue is used for primary actions and active states. Sky Blue serves as a high-visibility background for selected items or light-wash containers.
- **Backgrounds:** A neutral "Very Light Gray" prevents eye strain during long sessions and distinguishes the page background from white content cards.
- **Functional Semantics:** Colors are strictly tied to asset status. 
    - **Green:** Active leases/positive revenue.
    - **Yellow:** Upcoming renewals (Near Negotiation).
    - **Orange:** Active discussions (In Negotiation).
    - **Red:** Vacancies or critical expirations.
    - **Dark Gray:** Administrative drafts or archival data.

## Typography

The typography system utilizes **Inter** for its exceptional legibility and neutral, professional character. 

- **Numerical Data:** For financial figures and asset IDs, use the `data-mono` variant or ensure `tnum` (tabular numerals) is enabled to maintain vertical alignment in tables.
- **Hierarchy:** Use `label-md` for table headers and section overviews to provide clear categorizations without overwhelming the primary data.
- **Scale:** On mobile devices, `display-lg` should scale down to `headline-md` (24px) to preserve screen real estate for data tables.

## Layout & Spacing

The design system uses a **Fixed-Fluid Hybrid** layout. The sidebar is a fixed structural element, while the content area utilizes a fluid 12-column grid.

- **Sidebar:** Standard width is 260px for full navigation labels. When collapsed, it reduces to 72px, showing only iconography to maximize the data workspace.
- **Content Rhythm:** A base-4 spacing system is used. Major card containers should be separated by 24px (6 units) to maintain a clean, executive feel.
- **Data Density:** In data-heavy views (Tables), vertical padding is reduced to 12px (3 units) to increase information density, while summary cards use 24px-32px padding for better visual focus.

## Elevation & Depth

This design system uses **Tonal Layering** combined with **Ambient Shadows** to create a structured hierarchy.

- **Level 0 (Background):** The Very Light Gray (#F8F9FA) canvas.
- **Level 1 (Cards/Tables):** White (#FFFFFF) surfaces with a subtle, diffused shadow (Offset: 0px 4px, Blur: 12px, Opacity: 4% Black). This provides enough lift to separate content from the background without feeling "heavy."
- **Level 2 (Modals/Dropdowns):** Use a more pronounced shadow (Offset: 0px 8px, Blur: 24px, Opacity: 8% Black) and a 1px border (#E5E7EB) to ensure these elements sit clearly above the workspace.
- **Interactions:** Avoid heavy hover shadows; instead, use a 1px primary-colored border or a slight shift in background color to signal interactivity.

## Shapes

The shape language is sophisticated and approachable. A `roundedness` level of **2** (0.5rem base) is used for most UI elements, but specific containers follow these rules:

- **Primary Cards:** 16px (1rem) corner radius to create a soft, modern container feel.
- **Buttons & Inputs:** 8px (0.5rem) corner radius for a professional, precise appearance.
- **Status Tags:** Fully pill-shaped (rounded-full) to distinguish them from interactive buttons or data fields.

## Components

### Sidebar
The navigation uses the Deep Navy (#1A2B44) background with light-gray text. Active states use a left-edge Electric Blue indicator (4px width) and a Sky Blue (#E5F1FF) background for the menu item itself.

### Executive Summary Cards
Placed at the top of dashboards. These feature a 16px radius, soft shadow, and a 48px circular icon container in the top right, utilizing a light tint of the status color (e.g., Light Green background for "Active Assets").

### Tables
Clean, borderless rows with a subtle bottom divider (1px #F1F3F5). The header row uses a light gray background (#F8F9FA) and `label-md` typography. Hovering over a row should trigger a very subtle background shift to #F1F3F5.

### Status Tags
Small, high-contrast labels. Text color should be a darker shade of the status color for accessibility against the light-colored tag background. 

### Input Fields & Search
Search bars should feature a 24px left-padding for an icon and a "Search..." placeholder in #9CA3AF. Borders are 1px #D1D5DB, turning Electric Blue on focus with a subtle glow (2px spread).

### Progress Indicators
Thin horizontal bars (4px height). The track is Sky Blue (#E5F1FF) and the indicator is Electric Blue (#0066FF). Used for lease completion or negotiation milestones.
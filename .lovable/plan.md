

# MAKO Live — Build Plan

## Phase 1: Visual Identity Foundation & Landing Page

**Establish the MAKO Live design system across the entire app:**
- Restyle the project with the MAKO Live color system: deep steel black (#0B0D0F) backgrounds, charcoal panels (#14171A), muted steel gray text (#B8BCC2), crimson accent (#8E1116), and electric red glow (#FF2A2A)
- Custom fonts and typography with an engineered, industrial feel
- Subtle CSS animations: slow structural line builds, soft red glow pulses, parallax depth effects

**Build the MAKO Live landing/marketing page with the scroll narrative:**
- Hero section: "Construct the Broadcast" tagline with structural steel wireframe animation
- Blueprint section: wireframe structure visual, introducing the Digital Binder concept
- Assembly section: signal mapping and how data flows into the system
- Reinforcement section: security, reliability, change tracking
- Infrastructure section: enterprise trust, MAKO ecosystem positioning
- Overall feel: dark, industrial, steel scaffolding aesthetic — not SaaS, not startup

## Phase 2: App Shell & Binder Library

**Build the main application layout:**
- Dark sidebar navigation with MAKO Live branding and red accent highlights
- Top header bar with context (current binder name, status)
- Main content area with charcoal panel cards

**Binder Library page (the home screen of the app):**
- Dark steel grid of event cards showing: title, date, status, ISO count, open issue badge, transport badge, last updated
- Subtle red edge glow on hover
- "Create New Binder" action
- Search and filter controls

## Phase 3: Binder Interior — Cover & Core Tabs

**Binder Cover (Overview) page:**
- Header with event title, partner, venue, status pill
- Quick info tiles: Signals count, Encoders (required vs assigned), Transport (primary/backup), Return feed status, Open Issues count
- Next 3 schedule milestones, recent changes, pending confirmations

**Schedule Tab:**
- Minimal timeline view with gray lines and red time markers
- Expandable detail rows for each schedule item

**Contacts Tab:**
- Contacts grouped by location (Studio, Arena, Truck, Transmission, Partner)
- Searchable list with click-to-copy for phone/email

## Phase 4: Signals Tab (Core Operational View)

**The heart of the binder — the signal/patch grid:**
- Steel grid table with columns: ISO #, Production Alias, Onsite Patch, HQ Patch, Destination, Transport
- "Set ISO Count" control that dynamically adjusts the grid
- Auto-allocate buttons for encoder inputs and decoder outputs
- When ISO count changes, show required encoder capacity and highlight shortfalls in red
- Signal aliases displayed per context (production / onsite / HQ)

## Phase 5: Remaining Tabs

**Transport Tab:**
- Structured form for primary and backup transport details
- Return feed toggle, commercials setting, notes

**Comms Tab:**
- Clear-Com / LQ entries and hot mic entries in a clean list

**Changes & Issues Tab:**
- Left panel: Change timeline with a vertical steel line, proposed changes in red, confirmed changes in gray
- Right panel: Issue list with status indicators
- All powered by mock data for now

**Docs Tab:**
- Document list showing: type (Primer, Call Sheet, Schedule, Diagrams), version, uploaded by, extraction status

## Phase 6 (Future): Backend & Data Layer
- Connect Supabase for persistent storage with the full data model
- Authentication and multi-tenant organization support
- Slack/email tag ingestion and change proposal workflow
- Role-based access control

---

**All phases use hardcoded mock data** representing a realistic live sports broadcast event, so the UI is immediately functional and demonstrable. The backend wiring comes later as a separate phase.


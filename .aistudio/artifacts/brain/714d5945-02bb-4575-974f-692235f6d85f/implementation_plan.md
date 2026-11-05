# ForestFire Sentinel — Navigation & Hardware Prototype Enhancement

Implementation plan to improve application navigability, cross-workflow transitions, browser history support, and introduce an interactive proposed hardware prototype visual.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Navigation Strategy**: Add URL hash routing (`#intelligence`, `#optimizer`, `#prototype`, `#research`, `#incidents`) so browser back/forward buttons work naturally without page reloads, while retaining the client-side state.
> - **Hardware Representation**: Render a dedicated **Proposed Hardware Prototype** section with an annotated physical product blueprint (ESP32, SHT31/DHT22, MQ-2, IR flame detector, LoRa antenna, solar harvesting power module, and weatherproof pole enclosure), a LoRaWAN/Cellular gateway hub, and an end-to-end interactive data flow pipeline.
> - **Contextual Workflows**: Connect Incidents $\leftrightarrow$ Sensors $\leftrightarrow$ AI Agent with single-click breadcrumbs and return buttons (e.g., "Inspect on Map & Agent", "Return to Incidents", "Deploy Topology to Live Simulation").

---

## 1. Overview & Core Concept

- **What It Delivers**: Seamless navigation across all 5 core workflows with active state indicators, responsive mobile drawer, contextual breadcrumbs, and a comprehensive technical visualization of the proposed physical hardware sensor node and gateway architecture.
- **Target Audience**: IEEE Ingénieux 2026 hackathon evaluators, forestry operators, and environmental IoT researchers.
- **Key Value**: Eliminates user disorientation when switching between incidents, sensor oscilloscopes, and topology optimizers, while providing a credible physical hardware reference grounded in accessible maker electronics (ESP32 + LoRa + environmental sensors).

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Incident to Investigation**: In *Tactical Incidents*, clicking any fire or alarmed sensor jumps directly to the *Wildfire Intelligence* map with the relevant node selected, displays a clear contextual badge ("Inspecting Incident IGN-01"), and provides a 1-click "Return to Incidents" button.
2. **Optimizer to Live Simulation**: In *Sensor Network Optimizer*, a prominent "Apply Topology & Return to Live Fire Simulation" button switches to the live tactical map with toast confirmation.
3. **Proposed Hardware Prototype Exploration**: A new primary tab (*Hardware Prototype*) presents:
   - An annotated technical illustration of the field sensor mast and IP65 enclosure.
   - Interactive callout hot-spots for the ESP32 microcontroller, SHT31/DHT22 temperature & humidity module, MQ-2 gas sensor chamber, IR flame sensor, LoRa SX1278 transceiver, solar harvester, and LiFePO4 battery.
   - An interactive end-to-end system flow: `Physical Field Nodes` $\rightarrow$ `LoRa Chirp RF (868/915 MHz)` $\rightarrow$ `ESP32/Raspberry Pi Gateway` $\rightarrow$ `Cellular/Wi-Fi Backhaul` $\rightarrow$ `Kalman/CUSUM Signal Processing` $\rightarrow$ `Agentic Wildfire Intelligence`.
   - Wiring pinout matrix and hardware demonstration specifications.
4. **Browser History & Mobile Access**:
   - URL hash updates smoothly (`#intelligence`, `#optimizer`, `#prototype`, `#research`, `#incidents`) without reloading.
   - Full keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-amber-400`).
   - Responsive mobile navigation bar with slide-over drawer so navigation is never hidden on smaller viewports.

### Visual Identity & Theme
- **Color Tokens**: Deep dark forest slate (`bg-slate-950`, `bg-slate-900`), crisp amber accents (`text-amber-400`, `border-amber-700`), emerald nominal indicators (`text-emerald-400`), and crimson alarm states (`text-red-400`).
- **Typography**: Manrope for display headings, Plus Jakarta Sans for body prose, and JetBrains Mono for telemetry, tabular numerals, and hardware pinouts.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: URL Hash Navigation vs. React Router Dependency**
  - *Chosen Approach*: Lightweight client-side hash routing (`window.location.hash` with `hashchange` and `history.pushState`).
  - *Why*: Eliminates the need to install external routing packages, prevents 404s on static hosting, and guarantees instant back/forward navigation.
- **Decision 2: Interactive SVG & Canvas Hardware Blueprint vs. Static Generic Render**
  - *Chosen Approach*: High-fidelity interactive SVG/Canvas diagram with selectable components, live signal pulse animation, and detailed technical callout drawers.
  - *Why*: Ensures crisp rendering at any screen resolution, avoids broken image links or generic AI stock graphics, and allows evaluators to inspect specific GPIO pinouts and sensor specifications directly.

---

## 4. Technical Architecture & System Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Top Navigation Bar                              │
│   [ForestFire Sentinel]  [Intelligence] [Optimizer] [Hardware Prototype] [Research] [Incidents] │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ URL Hash Sync (#prototype, etc.)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Contextual Breadcrumb & Status Ribbon                │
│    Active View / Inspected Node / Active Incidents Quick Return        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
       ┌─────────────────────────────┼────────────────────────────┐
       ▼                             ▼                            ▼
┌─────────────────────────┐  ┌────────────────────────┐  ┌─────────────────────────┐
│  Wildfire Intelligence  │  │   Hardware Prototype   │  │ Sensor Network Optimizer│
│ ┌─────────────────────┐ │  │ ┌────────────────────┐ │  │ ┌─────────────────────┐ │
│ │ Tactical GIS Canvas │ │  │ │ Field Node Mast    │ │  │ │ Algorithm Selector │ │
│ └──────────┬──────────┘ │  │ │ (ESP32, SHT31,     │ │  │ │ Greedy / Voronoi   │ │
│            ▼            │  │ │  MQ-2, LoRa, Solar)│ │  │ └──────────┬──────────┘ │
│ ┌─────────────────────┐ │  │ └─────────┬──────────┘ │  │            ▼            │
│ │ Signal Telemetry &  │ │  │           ▼            │  │ ┌─────────────────────┐ │
│ │ Agent Investigation │ │  │ ┌────────────────────┐ │  │ │ "Apply & Test Live" │ │
│ └─────────────────────┘ │  │ │ Gateway & Data Flow│ │  │ └─────────────────────┘ │
│                         │  │ └────────────────────┘ │  │                         │
└─────────────────────────┘  └────────────────────────┘  └─────────────────────────┘
```

### Component & State Changes:
1. `src/types/index.ts`: Add `HardwareComponent` and `HardwareSubsystem` interfaces, and update active tab type to include `'prototype'`.
2. `src/components/Header.tsx`: Add Hardware Prototype nav item, responsive mobile navigation menu, visible focus outlines, and hash links.
3. `src/components/HardwarePrototypeView.tsx`: New component with interactive physical node diagram, gateway hub breakdown, data flow architecture, pinout table, and demonstration notes.
4. `src/components/IncidentsManagerView.tsx`: Add "Inspect Incident on Map" action linking to Wildfire Intelligence with return breadcrumb state.
5. `src/components/NetworkOptimizerView.tsx`: Add "Apply Topology & Return to Live Simulation" button.
6. `src/App.tsx`: Manage hash routing, contextual return-to-incident state, and view switching.

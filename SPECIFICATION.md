# Speaking Event Tracker - Technical Specification

A web application for conference speakers to track speaking engagements, session submissions, and travel logistics.

## Overview

The application consists of:
- **Frontend**: React + TypeScript + Tailwind CSS (Vite build)
- **Backend**: Express.js API server
- **Storage**: JSON files for data persistence (data.json, settings.json)
- **Deployment**: Docker containerized

---

## Data Models

### Event
Represents a conference or speaking event.

```typescript
interface Event {
  id: string                    // UUID
  name: string                  // Event name (e.g., "SQLBits 2026")
  country: string               // Country name
  city: string                  // City name
  dateStart: string             // ISO date (YYYY-MM-DD)
  dateEnd: string               // ISO date (YYYY-MM-DD)
  remote: boolean               // Is this a remote/online event?
  callForContentUrl: string     // URL to CfS page
  callForContentLastDate: string // CfS deadline (ISO date)
  loginTool: string             // Submission platform (e.g., "Sessionize", "Papercall")
  travel: TravelBooking[]       // Array of travel bookings
  hotels: HotelBooking[]        // Array of hotel bookings
  mvpSubmission: boolean        // Has MVP portal submission been completed?
}
```

### Session
Represents a talk/presentation that can be submitted to events.

```typescript
interface Session {
  id: string                    // UUID
  name: string                  // Primary session title
  alternateNames: string[]      // Alternative titles for different events
  level: string                 // Difficulty level: "100", "200", "300", "400", "500"
  abstract: string              // Full session description
  summary: string               // Brief one-liner description
  goals: string                 // Learning objectives
  elevatorPitch: string         // 30-second pitch
  retired: boolean              // No longer actively submitting this session
}
```

### Submission
Links a Session to an Event with a status.

```typescript
interface Submission {
  id: string                    // UUID
  sessionId: string             // Reference to Session
  eventId: string               // Reference to Event
  state: SubmissionState        // Current status
  nameUsed: string              // Which session name was used for this submission
  notes: string                 // Free-form notes for this submission
}

type SubmissionState = 'submitted' | 'selected' | 'rejected' | 'declined'
```

### Travel & Hotel Bookings

```typescript
type TravelType = 'flight' | 'train' | 'bus' | 'car' | 'other'

interface TravelBooking {
  id: string
  type: TravelType
  reference: string             // Booking reference or URL
}

interface HotelBooking {
  id: string
  name: string                  // Hotel name
  reference: string             // Booking reference or URL
}
```

### UI Settings

```typescript
interface UISettings {
  showMonthView: boolean        // Show monthly timeline bar
  showWeekView: boolean         // Show weekly timeline bar
  showMvpFeatures: boolean      // Show MVP-related UI elements
  maxEventsPerMonth: number     // Soft limit for events per month (0 = no limit)
  maxEventsPerYear: number      // Soft limit for events per year (0 = no limit)
}
```

---

## Event State Computation

An event's aggregate state is computed from its submissions:

```typescript
type EventState = 'selected' | 'rejected' | 'declined' | 'pending' | 'none'
```

**Logic** (in order of precedence):
1. **none**: Event has no submissions
2. **selected**: All submissions are final (selected/rejected/declined) AND at least one is selected
3. **rejected**: All submissions are rejected
4. **declined**: All submissions are rejected or declined (but not all rejected)
5. **pending**: Has submitted sessions still awaiting decision

---

## Conflict Detection

Events that have overlapping dates are flagged with visual warnings.

### Overlap Detection Logic
Two events overlap if their date ranges intersect:
```typescript
// Events overlap if: eventA.start <= eventB.end AND eventA.end >= eventB.start
function getOverlappingEvents(event: Event, allEvents: Event[]): OverlappingEvent[]
```

### Visual Indicators
- **Single overlap**: Amber badge showing `"⚠ Overlaps with {EventName} ({City})"`
- **Multiple overlaps**: Amber badge showing `"⚠ Overlaps with {N} events"` with tooltip listing all
- Badge appears on event cards in the event list

---

## Speaker Bandwidth

Configurable soft limits help speakers manage their schedule capacity.

### Settings
- `maxEventsPerMonth`: Maximum events per calendar month (0 = no limit)
- `maxEventsPerYear`: Maximum events per calendar year (0 = no limit)

### Visual Indicators

**Monthly View (Heatmap):**
- Normal months: Default background
- At limit: Amber/yellow background tint
- Over limit: Red background tint
- Tooltip shows `"{count} events / {max} max"` and warning if exceeded

**Year Warning Banner:**
When the current year exceeds or meets the limit, a banner appears above the event list:
- At limit: Amber banner with `"Year bandwidth at limit: {count} / {max}"`
- Over limit: Red banner with `"Year bandwidth exceeded: {count} / {max} ({over} over limit)"`

---

## API Endpoints

Base URL: `/api`

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | List all events |
| POST | `/events` | Create new event |
| GET | `/events/:id` | Get event by ID |
| PUT | `/events/:id` | Update event (partial) |
| DELETE | `/events/:id` | Delete event and its submissions |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sessions` | List all sessions |
| POST | `/sessions` | Create new session |
| GET | `/sessions/:id` | Get session by ID |
| PUT | `/sessions/:id` | Update session (partial) |
| DELETE | `/sessions/:id` | Delete session and its submissions |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/submissions` | List all submissions |
| POST | `/submissions` | Create submission (body: `{sessionId, eventId, nameUsed}`) |
| PUT | `/submissions/:id` | Update submission (body: `{state?, notes?}`) |
| DELETE | `/submissions/:id` | Delete submission |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings` | Get UI settings |
| PUT | `/settings` | Save UI settings |

### Import
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/import/sessionize` | Parse Sessionize CfS page (body: `{url}`) |

---

## UI Components

### Main Layout (App.tsx)

Three-tab layout:
1. **Events** - Main tab with event management
2. **Sessions** - Manage session library
3. **Statistics** - Analytics and reporting

Header contains:
- Application title
- Settings button (cog icon)

### Events Tab

#### Timeline Bars
Two optional timeline visualizations (toggled via settings):

**Monthly Events Bar:**
- Shows 12 months of the current year
- Each month displays colored dots for events
- Dot colors indicate event state (green=selected, yellow=pending, red=rejected, gray=declined/none)
- Past months show muted colors
- Current month highlighted with blue background
- Hover shows popover with event list (name, date range, city)
- Click filters event list to that month
- Shows total event count for year

**Weekly Events Bar:**
- Shows 52 weeks of current year
- Smaller dots (max 2 visible per week, +N indicator)
- Hover shows week number, date, and events
- Tooltip positioning adapts to edge proximity (left/center/right)
- Month labels at bottom

#### Event List Panel (Left Side)

**Header:**
- "Events" title with count "(X of Y)"
- Month filter badge (when month selected from timeline)
- Import button (opens Sessionize import modal)
- New Event button

**Filters (2 rows, sticky/non-scrolling):**

Row 1:
- "Future only" checkbox - hides past events
- "No submissions" checkbox - shows only events with no submissions
- "MVP submission pending" checkbox (when MVP features enabled) - shows only selected events missing MVP submission

Row 2:
- Status filters: Pending, Selected, Rejected, Declined

**Event Cards:**
- Background color based on event state
- Selected events without MVP submission get thicker green border
- Content:
  - Event name
  - "Remote" badge if applicable
  - Location (City, Country)
  - Date range
  - Submission count and selected count
  - Login tool icon (clickable link to CfS URL)
  - CfS countdown badge (color-coded: red <7d, yellow <14d, blue >14d)
  - Event countdown badge
  - Travel/Hotel icons (green if booked, gray if not)
  - "MVP submission pending" red badge (when applicable)
  - Overlap warning badge (amber) if event dates overlap with other events
- Actions: Decline (bulk decline all submissions), Edit, Delete
- Double-click to edit
- Right-click context menu: Remote event toggle, MVP submission completed toggle

#### Submission Panel (Right Side)

Shows when event is selected:
- Header with event name
- "Add Sessions" button opens SessionPicker
- List of submissions with:
  - Session name (uses nameUsed if different from primary)
  - Level badge (color-coded 100-500)
  - "alt name" badge if using alternate name
  - State dropdown selector
  - Remove button
  - Notes section (click to edit, supports multi-line text)

### Sessions Tab

**Filters:**
- Active checkbox
- Retired checkbox
- Count display

**Session Cards:**
- Session name
- Level badge (100=green, 200=teal, 300=yellow, 400=orange, 500=red)
- "Retired" badge if applicable
- Expandable submission history showing:
  - State counts (selected, pending, rejected, declined)
  - Per-event details with state, event name, location
  - "as [name]" badge if alternate name was used
- Edit/Delete buttons (Delete hidden if has submissions)
- Right-click context menu: Retired toggle

### Statistics Tab

Shows analytics for events with at least one selected submission:

**Year Filter:**
- Click any year bar to filter all stats to that year
- Banner shows active filter with clear option

**Summary Cards:**
- Events Spoken At
- Events Submitted To
- Acceptance Rate (events accepted / events submitted)
- Countries visited

**Charts:**
- Events by Year (horizontal bar chart, clickable to filter)
- Events by Region (Europe, North America, Asia, etc.)
- Events by Season (Spring/Summer/Fall/Winter)
- Event Format (In-Person vs Remote pie chart)
- Events by Month (bubble chart with size proportional to count)
- Top Countries (badges with count, hover shows events)
- Countries Visited (badge list)
- Cities Visited (grid list)

### Forms

#### EventForm
Two sections:

**Event Details:**
- Name (required)
- Country, City (row with Remote checkbox)
- Start Date, End Date (required)
- Call for Content URL
- Call for Content Last Date
- Login Tool

**Event Logistics:**
- MVP submission completed checkbox (when MVP features enabled)
- Travel bookings list with add/remove
- Hotel bookings list with add/remove

#### SessionForm
- Name (required)
- Alternate Names (dynamic list with add/remove)
- Level dropdown (100-500)
- Summary (one-liner)
- Elevator Pitch (textarea)
- Abstract (textarea)
- Goals (textarea)
- Retired checkbox

#### SessionPicker
Modal for adding sessions to an event:
- Checkbox list of available sessions (excludes retired and already submitted)
- When selected, shows "Submit as" dropdown with all names (primary + alternates)
- "+ Add new name" option to create new alternate on the fly
- Multi-select support with count badge

### Settings Modal

**UI Settings:**
- Show monthly events view (toggle)
- Show weekly events view (toggle)
- Show MVP submission features (toggle)

**Speaker Bandwidth:**
- Max events per month (number input, 0 = no limit)
- Max events per year (number input, 0 = no limit)

Settings persist to server-side settings.json.

### ImportFromSessionize Modal
- URL input for Sessionize CfS page
- Parses HTML to extract: name, city, country, dates, CfS deadline
- Pre-fills EventForm with imported data

---

## Visual Design

### Color Scheme

**Event State Backgrounds:**
- selected: green-50 with green-200 border
- pending: yellow-50 with yellow-200 border
- rejected: red-50 with red-200 border
- declined: orange-50 with orange-200 border
- none: white with gray-200 border

**Level Colors:**
- 100: green
- 200: teal
- 300: yellow
- 400: orange
- 500: red

**Submission State Colors:**
- submitted: blue
- selected: green
- rejected: red
- declined: orange

**Login Tool Icons:**
- Sessionize: Custom SVG (teal)
- Papercall: Custom SVG (blue)
- Pretalx: Purple circle with P
- Google Forms: Purple document icon
- Other: Gray circle with first letter

### Countdown Badges
- CfS closing: red (<7d), yellow (<14d), blue (>14d), gray (closed)
- Event date: purple (<14d), indigo (<30d), gray (>30d)

---

## Behavior Specifications

### MVP Feature Behavior
When MVP features are disabled:
- Hide all MVP-related UI (checkboxes, filters, badges)
- New events default to `mvpSubmission: true` so they won't trigger warnings if feature is re-enabled

When MVP features are enabled:
- "MVP submission pending" filter shows only selected events where `mvpSubmission: false`
- Red "MVP submission pending" badge appears on selected events without MVP submission
- Selected events without MVP submission get thicker border for visibility

### Filter Interactions
- Filters are cumulative (AND logic)
- "Future only" exception: always shows selected events without MVP submission (when MVP enabled)
- Event count updates in real-time as filters change

### Event Deletion
- Cascade deletes all submissions for that event

### Session Deletion
- Only allowed if session has no submissions
- Cascade deletes all submissions if forced

### Sessionize Import
Parses HTML for:
- Event name from `<h4>` in ibox-title
- Location from spans in location section
- Start/end dates from "event starts/ends" sections
- CfS deadline from "Call closes" section
- Auto-sets loginTool to "Sessionize"

---

## Docker Deployment

### Environment Variables
```
NODE_ENV=production
PORT=3000
DATA_FILE=/data/data.json
SETTINGS_FILE=/data/settings.json
```

### Build Process
1. Build React frontend with Vite
2. Compile TypeScript server to CommonJS
3. Copy built files to production image
4. Install production dependencies only

### Volume
Mount `/data` for persistent storage of data.json and settings.json.

---

## File Structure

```
/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Main application component
│   ├── api.ts                # API client functions
│   ├── types.ts              # TypeScript type definitions
│   ├── components/
│   │   ├── EventList.tsx     # Event list with filters
│   │   ├── EventForm.tsx     # Event create/edit form
│   │   ├── SessionList.tsx   # Session list with filters
│   │   ├── SessionForm.tsx   # Session create/edit form
│   │   ├── SubmissionList.tsx # Submissions for selected event
│   │   ├── SessionPicker.tsx # Add sessions to event modal
│   │   ├── StateSelector.tsx # Submission state dropdown
│   │   ├── Statistics.tsx    # Analytics dashboard
│   │   ├── MonthlyEventsBar.tsx # Monthly timeline
│   │   ├── WeeklyEventsBar.tsx  # Weekly timeline
│   │   ├── Settings.tsx      # Settings modal
│   │   └── ImportFromSessionize.tsx # Import modal
│   └── utils/
│       ├── computeEventState.ts # Event state computation
│       └── getOverlappingEvents.ts # Overlap detection
├── server.ts                 # Express API server
├── data.json                 # Event/Session/Submission data
├── settings.json             # UI settings
├── package.json
├── Dockerfile
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## Dependencies

### Runtime
- react, react-dom (18.x)
- express (4.x)
- cors
- uuid
- @radix-ui/react-context-menu

### Development
- typescript (5.x)
- vite (5.x)
- tailwindcss (3.x)
- tsx (server dev mode)
- concurrently (parallel dev servers)

---

## Key Implementation Notes

1. **State Management**: All state in App.tsx, passed down via props. No external state library.

2. **Data Persistence**: JSON files read/written on every API call (no in-memory caching).

3. **ID Generation**: UUID v4 for all entities.

4. **Date Handling**: ISO date strings (YYYY-MM-DD) throughout.

5. **Form Cancellation**: ESC key cancels all forms.

6. **Context Menus**: Radix UI for right-click menus on events and sessions.

7. **Responsive Layout**: 50/50 split panels on events tab, single column on mobile.

8. **Filter Persistence**: Filter state maintained in App.tsx, survives tab switches.

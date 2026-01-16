# Speaking Event Tracker

A React/TypeScript application for tracking speaking engagements, session submissions, and conference statistics.

## Features

### Event Management
- Track conferences and speaking events with details like name, location, dates, and call for speakers deadlines
- Support for both in-person and remote events
- Visual indicators showing days until CfS closes and days until event starts
- Import events directly from Sessionize CfS pages
- Filter events by status (pending, selected, rejected, declined) and future/past

### Session Management
- Maintain a library of talk sessions with titles, abstracts, summaries, and elevator pitches
- Support for alternate session names (for localized or variant titles)
- Track session difficulty levels
- Mark sessions as retired when no longer actively submitting

### Submission Tracking
- Link sessions to events as submissions
- Track submission states: submitted, selected, rejected, declined
- Bulk decline all submissions for an event
- Visual status indicators on event cards (color-coded backgrounds)

### Travel & Hotel Booking
- Track travel bookings (flights, trains, buses, cars) per event
- Track hotel reservations with booking references
- Visual indicators showing booking status on event list
- Support for booking reference numbers or URLs

### MVP Submission Tracking
- Checkbox to mark events submitted to Microsoft MVP portal
- Visual indicator (dashed border) for selected events not yet submitted to MVP

### Statistics Dashboard
- Summary cards: Events spoken at, Events submitted to, Acceptance rate, Countries visited
- Events by year chart (clickable to filter all stats by year)
- Events by region breakdown
- Events by season distribution
- In-person vs remote event ratio
- Top countries with hover tooltips showing event details
- Cities visited list

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Express.js
- **Storage**: JSON file-based persistence

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Start the backend server (runs on port 3001)
npx ts-node server.ts

# In another terminal, start the frontend dev server
npm run dev
```

The app will be available at http://localhost:5173

## Project Structure

```
├── server.ts              # Express backend API
├── data.json              # Data storage file
├── src/
│   ├── App.tsx            # Main application component
│   ├── api.ts             # API client functions
│   ├── types.ts           # TypeScript interfaces
│   ├── components/
│   │   ├── EventList.tsx       # Event listing with filters
│   │   ├── EventForm.tsx       # Event create/edit form
│   │   ├── SessionList.tsx     # Session listing
│   │   ├── SessionForm.tsx     # Session create/edit form
│   │   ├── SubmissionList.tsx  # Submissions for selected event
│   │   ├── SessionPicker.tsx   # Session selection modal
│   │   ├── Statistics.tsx      # Statistics dashboard
│   │   ├── StateSelector.tsx   # Submission state dropdown
│   │   └── ImportFromSessionize.tsx  # Sessionize URL importer
│   └── utils/
│       └── computeEventState.ts  # Event state computation
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/events | List all events |
| POST | /api/events | Create event |
| GET | /api/events/:id | Get event |
| PUT | /api/events/:id | Update event |
| DELETE | /api/events/:id | Delete event |
| GET | /api/sessions | List all sessions |
| POST | /api/sessions | Create session |
| GET | /api/sessions/:id | Get session |
| PUT | /api/sessions/:id | Update session |
| DELETE | /api/sessions/:id | Delete session |
| GET | /api/submissions | List all submissions |
| POST | /api/submissions | Create submission |
| PUT | /api/submissions/:id | Update submission state |
| DELETE | /api/submissions/:id | Delete submission |
| POST | /api/import/sessionize | Parse Sessionize CfS page |

## License

MIT

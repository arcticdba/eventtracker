# Speaking Event Tracker

A React/TypeScript application for tracking speaking engagements, session submissions, and conference statistics.

## Features

### Event Management
- Track conferences and speaking events with details like name, location, dates, and call for speakers deadlines
- Support for both in-person and remote events
- Visual indicators showing days until CfS closes and days until event starts
- Import events directly from Sessionize CfS pages
- Filter events by status (pending, selected, rejected, declined) and future/past
- Country flag emojis displayed alongside locations
- Country name normalization for data consistency

### Session Management
- Maintain a library of talk sessions with titles, abstracts, summaries, and elevator pitches
- Support for alternate session names (for localized or variant titles)
- Track session difficulty levels (100-500)
- Session types: Session, Workshop, Short session, Lightning Talk, Keynote
- Mark sessions as retired when no longer actively submitting
- Search sessions by name (including alternate names)

### Submission Tracking
- Link sessions to events as submissions
- Track submission states: submitted, selected, rejected, declined
- Bulk decline or reject all pending submissions for an event
- Session type tags displayed on submissions
- Visual status indicators on event cards (color-coded backgrounds)

### Travel & Hotel Booking
- Track travel bookings (flights, trains, buses, cars) per event
- Track hotel reservations with booking references
- Add, edit, and remove bookings inline
- Visual indicators showing booking status on event list
- Support for booking reference numbers or URLs

### MVP Submission Tracking
- Checkbox to mark events submitted to Microsoft MVP portal
- Visual indicator (dashed border) for selected events not yet submitted to MVP

### Export Options
- Backup all data as JSON
- Export events, sessions, and submissions as CSV
- Export selected events to iCal (.ics) for calendar import
- Export individual events to iCal via right-click menu

### Statistics Dashboard
- Summary cards: Events spoken at, Events submitted to, Acceptance rate, Countries visited
- Year-over-year comparison with selectable years and trend indicators
- Events by year chart (clickable to filter all stats by year)
- Events by region breakdown
- Events by season distribution
- In-person vs remote event ratio
- Top countries with flag emojis and hover tooltips showing event details
- Countries and cities visited lists with flag emojis
- Session performance analytics with acceptance rates by level

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

## Docker Deployment

### Running Locally with Docker Compose

```bash
# Build and start the container
docker compose up -d

# View logs
docker compose logs -f

# Stop the container
docker compose down
```

The app will be available at http://localhost:3000

### Deploying to QNAP NAS with Portainer

Building on the NAS can have permission issues, so it's easier to build on your local machine and transfer the image.

#### 1. Build the Image (on Mac)

```bash
# For Apple Silicon Macs, specify the platform for x86_64 NAS
docker build --platform linux/amd64 -t eventtracker .

# Save the image to a file
docker save eventtracker -o eventtracker.tar
```

#### 2. Transfer to NAS

Copy `eventtracker.tar` to your NAS via file share, scp, or any preferred method:
```bash
scp eventtracker.tar admin@your-nas-ip:/share/YourFolder/
```

#### 3. Load the Image on NAS

SSH into your NAS and load the image:
```bash
ssh admin@your-nas-ip
docker load -i /share/YourFolder/eventtracker.tar
```

#### 4. Prepare Data Directory

Create a folder for persistent data and copy your existing data:
```bash
mkdir -p /share/YourFolder/eventtracker/data
cp /path/to/data.json /share/YourFolder/eventtracker/data/
```

#### 5. Create Container in Portainer

1. Open Portainer and go to **Containers** → **Add container**

2. Configure the container:
   - **Name:** `eventtracker`
   - **Image:** `eventtracker:latest`

3. **Port mapping:**
   - Host: `3333` → Container: `3000`

4. **Volumes:**
   - Click **map additional volume**
   - Container: `/data`
   - Select **Bind**
   - Host: `/share/YourFolder/eventtracker/data`

5. **Restart policy:** `Unless stopped`

6. Click **Deploy the container**

#### 6. Access the App

Open `http://your-nas-ip:3333` in your browser.

Your data persists in `/share/YourFolder/eventtracker/data/data.json` and survives container rebuilds.

### 7. To Update the Container

Build the Docker image locally, copy the eventtracker.tar to the NAS, and load the tar through Docker as per steps 1 and 2.

In Portainer, simply recreate the container to have updates show.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port (inside container) |
| `DATA_FILE` | /data/data.json | Path to data file |
| `NODE_ENV` | production | Environment mode |

## Project Structure

```
├── server.ts              # Express backend API
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
│       ├── computeEventState.ts  # Event state computation
│       ├── formatDate.ts         # Date formatting utilities
│       └── countryFlags.ts       # Country flag emojis and normalization
```

Note: `data.json` and `settings.json` are created at runtime and not included in the repository.

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
| GET | /api/export/events.ics | Export selected events as iCal |

## License

MIT

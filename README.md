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
- Filter pills for quick filtering by status (active/retired), level, and session type

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
- Event-focused summary cards for submitted, accepted, rejected, and upcoming events
- Filters by event year and in-person/remote format
- Acceptance rate based only on accepted and rejected events
- Clickable outcome breakdown grouped by event
- Optional event-outcome drill-down details with session titles and submitted aliases, controlled in Settings
- Event-based acceptance rates by country and recurring event series
- Event performance breakdowns by geographic region and season
- Completed/upcoming engagements derived from selected submissions and event dates
- Yearly performance trends, speaking-footprint summary, and cities visited

### Recurring Event Series
- Link individual editions such as SQLBits 2024 and SQLBits 2025 to one canonical series
- Create, select, rename, or remove a series from the event editor
- Removing a series unlinks its events without deleting them
- Compare event-level acceptance across recurring editions in Statistics

The Events tab can be searched by event name, city, country, or event series.
An unobtrusive reminder strip highlights actionable CfC deadlines within seven days.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Express.js
- **Storage**: JSON file-based persistence

The interface uses shared semantic styles for cards, controls, focus states,
and submission outcomes. Accepted is emerald, pending is amber, rejected is
rose, declined is slate, and cancelled is gray throughout the application.

## Getting Started

### Prerequisites
- Node.js 20.19+ (or 22.12+)
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

Run the automated domain and calendar checks with:

```bash
npm test
```

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

#### Automated Build and Transfer

The deployment helper builds versioned and `latest` image tags, saves the image,
copies it to the NAS, and loads it into Docker:

```bash
./scripts/deploy-nas.sh admin@your-nas-ip /share/YourFolder/eventtracker
```

The NAS target and directory can also be saved in environment variables:

```bash
export NAS_TARGET=admin@your-nas-ip
export NAS_DIRECTORY=/share/YourFolder/eventtracker
./scripts/deploy-nas.sh
```

Preview all commands without running them:

```bash
./scripts/deploy-nas.sh --dry-run admin@your-nas-ip /share/YourFolder/eventtracker
```

The script leaves the generated versioned `.tar` file locally and on the NAS.
After it finishes, recreate the container in Portainer using
`eventtracker:latest`, preserving the `/data` mount and the `3333:3000` port
mapping.

Portainer can create container or service webhooks that trigger a redeploy, but
they are best suited to images pulled from a registry. This local image-transfer
workflow intentionally leaves container recreation as the final manual step.

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
| GET | /api/health | Container and API health check |
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

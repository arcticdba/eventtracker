import express from 'express'
import cors from 'cors'
import path from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const PORT = process.env.PORT || 3001
const DATA_FILE = process.env.DATA_FILE || './data.json'

app.use(cors())
app.use(express.json())

// Serve static files from dist in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))
}

interface TravelBooking {
  id: string
  type: 'flight' | 'train' | 'bus' | 'car' | 'other'
  reference: string
}

interface HotelBooking {
  id: string
  name: string
  reference: string
}

interface Event {
  id: string
  name: string
  country: string
  city: string
  dateStart: string
  dateEnd: string
  remote: boolean
  callForContentUrl: string
  callForContentLastDate: string
  loginTool: string
  travel: TravelBooking[]
  hotels: HotelBooking[]
  mvpSubmission: boolean
}

interface Session {
  id: string
  name: string
  alternateNames: string[]
  level: string
  abstract: string
  summary: string
  goals: string
  elevatorPitch: string
  retired: boolean
}

interface Submission {
  id: string
  sessionId: string
  eventId: string
  state: 'submitted' | 'selected' | 'rejected' | 'declined'
  nameUsed: string
}

interface Data {
  events: Event[]
  sessions: Session[]
  submissions: Submission[]
}

function loadData(): Data {
  if (!existsSync(DATA_FILE)) {
    return { events: [], sessions: [], submissions: [] }
  }
  const raw = readFileSync(DATA_FILE, 'utf-8')
  const data = JSON.parse(raw)
  // Ensure existing events have travel, hotels, and mvpSubmission fields
  data.events = data.events.map((e: Event) => ({
    ...e,
    travel: e.travel || [],
    hotels: e.hotels || [],
    mvpSubmission: e.mvpSubmission ?? false
  }))
  return data
}

function saveData(data: Data): void {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

// Events
app.get('/api/events', (_req, res) => {
  const data = loadData()
  res.json(data.events)
})

app.post('/api/events', (req, res) => {
  const data = loadData()
  const newEvent: Event = {
    id: uuidv4(),
    name: req.body.name,
    country: req.body.country,
    city: req.body.city,
    dateStart: req.body.dateStart,
    dateEnd: req.body.dateEnd,
    remote: req.body.remote || false,
    callForContentUrl: req.body.callForContentUrl || '',
    callForContentLastDate: req.body.callForContentLastDate || '',
    loginTool: req.body.loginTool || '',
    travel: req.body.travel || [],
    hotels: req.body.hotels || [],
    mvpSubmission: req.body.mvpSubmission || false
  }
  data.events.push(newEvent)
  saveData(data)
  res.status(201).json(newEvent)
})

app.get('/api/events/:id', (req, res) => {
  const data = loadData()
  const event = data.events.find(e => e.id === req.params.id)
  if (!event) return res.status(404).json({ error: 'Event not found' })
  res.json(event)
})

app.put('/api/events/:id', (req, res) => {
  const data = loadData()
  const index = data.events.findIndex(e => e.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Event not found' })
  data.events[index] = { ...data.events[index], ...req.body, id: req.params.id }
  saveData(data)
  res.json(data.events[index])
})

app.delete('/api/events/:id', (req, res) => {
  const data = loadData()
  const index = data.events.findIndex(e => e.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Event not found' })
  data.events.splice(index, 1)
  data.submissions = data.submissions.filter(s => s.eventId !== req.params.id)
  saveData(data)
  res.status(204).send()
})

// Sessions
app.get('/api/sessions', (_req, res) => {
  const data = loadData()
  res.json(data.sessions)
})

app.post('/api/sessions', (req, res) => {
  const data = loadData()
  const newSession: Session = {
    id: uuidv4(),
    name: req.body.name,
    alternateNames: req.body.alternateNames || [],
    level: req.body.level,
    abstract: req.body.abstract,
    summary: req.body.summary || '',
    goals: req.body.goals || '',
    elevatorPitch: req.body.elevatorPitch || '',
    retired: req.body.retired || false
  }
  data.sessions.push(newSession)
  saveData(data)
  res.status(201).json(newSession)
})

app.get('/api/sessions/:id', (req, res) => {
  const data = loadData()
  const session = data.sessions.find(s => s.id === req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  res.json(session)
})

app.put('/api/sessions/:id', (req, res) => {
  const data = loadData()
  const index = data.sessions.findIndex(s => s.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Session not found' })
  data.sessions[index] = { ...data.sessions[index], ...req.body, id: req.params.id }
  saveData(data)
  res.json(data.sessions[index])
})

app.delete('/api/sessions/:id', (req, res) => {
  const data = loadData()
  const index = data.sessions.findIndex(s => s.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Session not found' })
  data.sessions.splice(index, 1)
  data.submissions = data.submissions.filter(s => s.sessionId !== req.params.id)
  saveData(data)
  res.status(204).send()
})

// Submissions
app.get('/api/submissions', (_req, res) => {
  const data = loadData()
  res.json(data.submissions)
})

app.post('/api/submissions', (req, res) => {
  const data = loadData()
  const session = data.sessions.find(s => s.id === req.body.sessionId)
  const newSubmission: Submission = {
    id: uuidv4(),
    sessionId: req.body.sessionId,
    eventId: req.body.eventId,
    state: 'submitted',
    nameUsed: req.body.nameUsed || session?.name || ''
  }
  data.submissions.push(newSubmission)
  saveData(data)
  res.status(201).json(newSubmission)
})

app.put('/api/submissions/:id', (req, res) => {
  const data = loadData()
  const index = data.submissions.findIndex(s => s.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Submission not found' })
  data.submissions[index] = { ...data.submissions[index], state: req.body.state }
  saveData(data)
  res.json(data.submissions[index])
})

app.delete('/api/submissions/:id', (req, res) => {
  const data = loadData()
  const index = data.submissions.findIndex(s => s.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Submission not found' })
  data.submissions.splice(index, 1)
  saveData(data)
  res.status(204).send()
})

// Parse Sessionize CFS page
app.post('/api/import/sessionize', async (req, res) => {
  const { url } = req.body

  if (!url || !url.includes('sessionize.com')) {
    return res.status(400).json({ error: 'Invalid Sessionize URL' })
  }

  try {
    const response = await fetch(url)
    const html = await response.text()

    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                        'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

    function parseDate(dateStr: string): string {
      // Parse "22 Apr 2026" or "18 Jan 2026" format
      const match = dateStr.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/)
      if (match) {
        const day = match[1].padStart(2, '0')
        const month = (monthNames.indexOf(match[2].toLowerCase()) + 1).toString().padStart(2, '0')
        const year = match[3]
        return `${year}-${month}-${day}`
      }
      return ''
    }

    // Extract event name from <h4> in ibox-title (e.g., <h4>SQLBits 2026</h4>)
    let name = ''
    const h4Match = html.match(/<div class="ibox-title">[^]*?<h4>([^<]+)<\/h4>/i)
    if (h4Match) {
      name = h4Match[1].trim()
    } else {
      // Fallback to title tag
      const titleMatch = html.match(/<title>([^:]+):/i)
      if (titleMatch) {
        name = titleMatch[1].trim()
      }
    }

    // Extract location from <span class="block"> elements after "location" section
    let city = ''
    let country = ''
    const locationSection = html.match(/location\s*<\/div>\s*<h2[^>]*>\s*([\s\S]*?)<\/h2>/i)
    if (locationSection) {
      // Find all <span class="block"> content
      const spans = locationSection[1].match(/<span[^>]*>([^<]+)<\/span>/gi)
      if (spans && spans.length >= 2) {
        // Last span usually has "City, Country"
        const lastSpan = spans[spans.length - 1].replace(/<[^>]+>/g, '').trim()
        const parts = lastSpan.split(',').map(s => s.trim())
        if (parts.length >= 2) {
          city = parts[0]
          country = parts[1]
        } else if (parts.length === 1) {
          city = parts[0]
        }
      }
    }

    // Extract event start date - look for "event starts" section
    let dateStart = ''
    const startMatch = html.match(/event starts\s*<\/div>\s*<h2[^>]*>([^<]+)<\/h2>/i)
    if (startMatch) {
      dateStart = parseDate(startMatch[1].trim())
    }

    // Extract event end date - look for "event ends" section
    let dateEnd = ''
    const endMatch = html.match(/event ends\s*<\/div>\s*<h2[^>]*>([^<]+)<\/h2>/i)
    if (endMatch) {
      dateEnd = parseDate(endMatch[1].trim())
    }

    // Extract CFS deadline - look for "Call closes" section
    let callForContentLastDate = ''
    const closesMatch = html.match(/Call closes[^<]*<\/span>\s*<\/div>\s*<h2[^>]*>([^<]+)<\/h2>/i)
    if (closesMatch) {
      callForContentLastDate = parseDate(closesMatch[1].trim())
    }

    res.json({
      name,
      city,
      country,
      dateStart,
      dateEnd,
      remote: false,
      callForContentUrl: url,
      callForContentLastDate,
      loginTool: 'Sessionize',
      travel: [],
      hotels: [],
      mvpSubmission: false
    })
  } catch (error) {
    console.error('Error parsing Sessionize page:', error)
    res.status(500).json({ error: 'Failed to parse Sessionize page' })
  }
})

// SPA fallback - serve index.html for any non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

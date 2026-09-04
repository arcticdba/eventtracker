import express from 'express'
import cors from 'cors'
import path from 'path'
import { readFileSync, writeFileSync, existsSync, renameSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import type { Event, EventSeries, Session, Submission, UISettings } from './src/types'
import { extractSessionizeLocation } from './server/sessionizeParser'

const app = express()
const PORT = process.env.PORT || 3001
const DATA_FILE = process.env.DATA_FILE || './data.json'
const SETTINGS_FILE = process.env.SETTINGS_FILE || './settings.json'

app.use(cors())
app.use(express.json())

// Serve static files from dist in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))
}

interface Data {
  events: Event[]
  eventSeries: EventSeries[]
  sessions: Session[]
  submissions: Submission[]
}

type Settings = UISettings

function writeJsonFile(file: string, value: unknown): void {
  const temporaryFile = `${file}.tmp`
  writeFileSync(temporaryFile, JSON.stringify(value, null, 2))
  renameSync(temporaryFile, file)
}

function loadData(): Data {
  if (!existsSync(DATA_FILE)) {
    return { events: [], eventSeries: [], sessions: [], submissions: [] }
  }
  const raw = readFileSync(DATA_FILE, 'utf-8')
  const data = JSON.parse(raw) as Partial<Data>
  if (!Array.isArray(data.events) || !Array.isArray(data.sessions) || !Array.isArray(data.submissions)) {
    throw new Error(`Invalid data file: ${DATA_FILE}`)
  }
  // Ensure existing events have travel, hotels, and mvpSubmission fields
  data.events = data.events.map((e: Event) => ({
    ...e,
    travel: e.travel || [],
    hotels: e.hotels || [],
    mvpSubmission: e.mvpSubmission ?? false
  }))
  data.eventSeries = Array.isArray(data.eventSeries) ? data.eventSeries : []
  return data as Data
}

function saveData(data: Data): void {
  writeJsonFile(DATA_FILE, data)
}

const defaultSettings: Settings = {
  showMonthView: true,
  showWeekView: true,
  showMvpFeatures: true,
  showSessionPerformance: true,
  maxEventsPerMonth: 0,
  maxEventsPerYear: 0,
  dateFormat: 'YYYY-MM-DD'
}

function loadSettings(): Settings {
  if (!existsSync(SETTINGS_FILE)) {
    return defaultSettings
  }
  try {
    const raw = readFileSync(SETTINGS_FILE, 'utf-8')
    return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    return defaultSettings
  }
}

function saveSettings(settings: Settings): void {
  writeJsonFile(SETTINGS_FILE, settings)
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Settings
app.get('/api/settings', (_req, res) => {
  res.json(loadSettings())
})

app.put('/api/settings', (req, res) => {
  const settings: Settings = {
    showMonthView: req.body.showMonthView ?? true,
    showWeekView: req.body.showWeekView ?? true,
    showMvpFeatures: req.body.showMvpFeatures ?? true,
    showSessionPerformance: req.body.showSessionPerformance ?? true,
    maxEventsPerMonth: req.body.maxEventsPerMonth ?? 0,
    maxEventsPerYear: req.body.maxEventsPerYear ?? 0,
    dateFormat: req.body.dateFormat ?? 'YYYY-MM-DD'
  }
  saveSettings(settings)
  res.json(settings)
})

// Events
app.get('/api/event-series', (_req, res) => {
  res.json(loadData().eventSeries)
})

app.post('/api/event-series', (req, res) => {
  const data = loadData()
  const name = String(req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'Series name is required' })
  const existing = data.eventSeries.find(series => series.name.localeCompare(name, undefined, { sensitivity: 'accent' }) === 0)
  if (existing) return res.status(409).json({ error: 'An event series with this name already exists' })
  const series: EventSeries = { id: uuidv4(), name }
  data.eventSeries.push(series)
  saveData(data)
  res.status(201).json(series)
})

app.put('/api/event-series/:id', (req, res) => {
  const data = loadData()
  const index = data.eventSeries.findIndex(series => series.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Event series not found' })
  const name = String(req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'Series name is required' })
  if (data.eventSeries.some(series => series.id !== req.params.id && series.name.localeCompare(name, undefined, { sensitivity: 'accent' }) === 0)) {
    return res.status(409).json({ error: 'An event series with this name already exists' })
  }
  data.eventSeries[index] = { ...data.eventSeries[index], name }
  saveData(data)
  res.json(data.eventSeries[index])
})

app.delete('/api/event-series/:id', (req, res) => {
  const data = loadData()
  const index = data.eventSeries.findIndex(series => series.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Event series not found' })
  data.eventSeries.splice(index, 1)
  data.events = data.events.map(event => event.seriesId === req.params.id ? { ...event, seriesId: undefined } : event)
  saveData(data)
  res.status(204).send()
})

app.get('/api/events', (_req, res) => {
  const data = loadData()
  res.json(data.events)
})

app.post('/api/events', (req, res) => {
  const data = loadData()
  if (req.body.seriesId && !data.eventSeries.some(series => series.id === req.body.seriesId)) {
    return res.status(400).json({ error: 'Event series not found' })
  }
  const newEvent: Event = {
    id: uuidv4(),
    name: req.body.name,
    country: req.body.country,
    city: req.body.city,
    dateStart: req.body.dateStart,
    dateEnd: req.body.dateEnd,
    remote: req.body.remote || false,
    url: req.body.url || '',
    callForContentUrl: req.body.callForContentUrl || '',
    callForContentLastDate: req.body.callForContentLastDate || '',
    loginTool: req.body.loginTool || '',
    travel: req.body.travel || [],
    hotels: req.body.hotels || [],
    eventHandlesTravel: req.body.eventHandlesTravel || false,
    eventHandlesHotel: req.body.eventHandlesHotel || false,
    mvpSubmission: req.body.mvpSubmission || false,
    notes: req.body.notes || '',
    seriesId: req.body.seriesId || undefined
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
  if (req.body.seriesId && !data.eventSeries.some(series => series.id === req.body.seriesId)) {
    return res.status(400).json({ error: 'Event series not found' })
  }
  const updates = { ...req.body }
  if (Object.prototype.hasOwnProperty.call(req.body, 'seriesId')) {
    updates.seriesId = req.body.seriesId || undefined
  }
  data.events[index] = { ...data.events[index], ...updates, id: req.params.id }
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
    sessionType: req.body.sessionType || 'Session (45-60 min)',
    level: req.body.level,
    abstract: req.body.abstract,
    summary: req.body.summary || '',
    goals: req.body.goals || '',
    elevatorPitch: req.body.elevatorPitch || '',
    retired: req.body.retired || false,
    materialsUrl: req.body.materialsUrl || '',
    targetAudience: req.body.targetAudience || [],
    primaryTechnology: req.body.primaryTechnology || '',
    additionalTechnology: req.body.additionalTechnology || '',
    equipmentNotes: req.body.equipmentNotes || ''
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
    nameUsed: req.body.nameUsed || session?.name || '',
    notes: req.body.notes || ''
  }
  data.submissions.push(newSubmission)
  saveData(data)
  res.status(201).json(newSubmission)
})

app.put('/api/submissions/:id', (req, res) => {
  const data = loadData()
  const index = data.submissions.findIndex(s => s.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Submission not found' })
  const updates: Partial<Submission> = {}
  if (req.body.state !== undefined) updates.state = req.body.state
  if (req.body.notes !== undefined) updates.notes = req.body.notes
  data.submissions[index] = { ...data.submissions[index], ...updates }
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

// Export all data as JSON
app.get('/api/export/json', (_req, res) => {
  const data = loadData()
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename="eventtracker-backup-${new Date().toISOString().split('T')[0]}.json"`)
  res.json(data)
})

// Export events as CSV
app.get('/api/export/events.csv', (_req, res) => {
  const data = loadData()
  const headers = ['id', 'name', 'seriesId', 'seriesName', 'country', 'city', 'dateStart', 'dateEnd', 'remote', 'callForContentUrl', 'callForContentLastDate', 'loginTool', 'mvpSubmission', 'notes']
  const rows = data.events.map(e => [
    e.id,
    `"${(e.name || '').replace(/"/g, '""')}"`,
    e.seriesId || '',
    `"${(data.eventSeries.find(series => series.id === e.seriesId)?.name || '').replace(/"/g, '""')}"`,
    `"${(e.country || '').replace(/"/g, '""')}"`,
    `"${(e.city || '').replace(/"/g, '""')}"`,
    e.dateStart,
    e.dateEnd,
    e.remote ? 'true' : 'false',
    `"${(e.callForContentUrl || '').replace(/"/g, '""')}"`,
    e.callForContentLastDate,
    `"${(e.loginTool || '').replace(/"/g, '""')}"`,
    e.mvpSubmission ? 'true' : 'false',
    `"${(e.notes || '').replace(/"/g, '""')}"`
  ].join(','))

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="events.csv"')
  res.send([headers.join(','), ...rows].join('\n'))
})

// Export sessions as CSV
app.get('/api/export/sessions.csv', (_req, res) => {
  const data = loadData()
  const headers = ['id', 'name', 'level', 'abstract', 'summary', 'goals', 'elevatorPitch', 'retired', 'alternateNames']
  const rows = data.sessions.map(s => [
    s.id,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    s.level,
    `"${(s.abstract || '').replace(/"/g, '""')}"`,
    `"${(s.summary || '').replace(/"/g, '""')}"`,
    `"${(s.goals || '').replace(/"/g, '""')}"`,
    `"${(s.elevatorPitch || '').replace(/"/g, '""')}"`,
    s.retired ? 'true' : 'false',
    `"${(s.alternateNames || []).join('; ').replace(/"/g, '""')}"`
  ].join(','))

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="sessions.csv"')
  res.send([headers.join(','), ...rows].join('\n'))
})

// Export submissions as CSV
app.get('/api/export/submissions.csv', (_req, res) => {
  const data = loadData()
  const headers = ['id', 'sessionId', 'eventId', 'state', 'nameUsed', 'notes', 'sessionName', 'eventName']
  const rows = data.submissions.map(sub => {
    const session = data.sessions.find(s => s.id === sub.sessionId)
    const event = data.events.find(e => e.id === sub.eventId)
    return [
      sub.id,
      sub.sessionId,
      sub.eventId,
      sub.state,
      `"${(sub.nameUsed || '').replace(/"/g, '""')}"`,
      `"${(sub.notes || '').replace(/"/g, '""')}"`,
      `"${(session?.name || '').replace(/"/g, '""')}"`,
      `"${(event?.name || '').replace(/"/g, '""')}"`
    ].join(',')
  })

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"')
  res.send([headers.join(','), ...rows].join('\n'))
})

// Export events as iCal
app.get('/api/export/events.ics', (req, res) => {
  const data = loadData()
  const { selected, eventId } = req.query

  // Filter events
  let eventsToExport = data.events

  // Single event export
  if (eventId && typeof eventId === 'string') {
    eventsToExport = data.events.filter(e => e.id === eventId)
  }
  // Only events with selected submissions
  else if (selected === 'true') {
    const eventIdsWithSelected = new Set(
      data.submissions
        .filter(s => s.state === 'selected')
        .map(s => s.eventId)
    )
    eventsToExport = data.events.filter(e => eventIdsWithSelected.has(e.id))
  }

  // Only include future events (end date >= today)
  const today = new Date().toISOString().split('T')[0]
  eventsToExport = eventsToExport.filter(e => e.dateEnd >= today)

  // Helper to format date as iCal date (YYYYMMDD)
  const formatICalDate = (dateStr: string): string => {
    return dateStr.replace(/-/g, '')
  }

  // Helper to escape text for iCal
  const escapeICalText = (text: string): string => {
    return (text || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
  }

  // Build iCal content
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventTracker//Speaking Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Speaking Events'
  ]

  for (const event of eventsToExport) {
    const location = [event.city, event.country].filter(Boolean).join(', ')

    // Get selected sessions for this event
    const selectedSessions = data.submissions
      .filter(s => s.eventId === event.id && s.state === 'selected')
      .map(s => {
        const session = data.sessions.find(sess => sess.id === s.sessionId)
        return s.nameUsed || session?.name || 'Unknown session'
      })

    let description = ''
    if (selectedSessions.length > 0) {
      description = `Sessions: ${selectedSessions.join(', ')}`
    }
    if (event.notes) {
      description += (description ? '\\n\\n' : '') + event.notes
    }

    // Calculate end date (add 1 day for all-day events in iCal)
    const endDate = new Date(event.dateEnd)
    endDate.setDate(endDate.getDate() + 1)
    const endDateStr = endDate.toISOString().split('T')[0]

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${event.id}@eventtracker`)
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`)
    lines.push(`DTSTART;VALUE=DATE:${formatICalDate(event.dateStart)}`)
    lines.push(`DTEND;VALUE=DATE:${formatICalDate(endDateStr)}`)
    lines.push(`SUMMARY:${escapeICalText(event.name)}`)
    if (location) {
      lines.push(`LOCATION:${escapeICalText(location)}`)
    }
    if (description) {
      lines.push(`DESCRIPTION:${escapeICalText(description)}`)
    }
    if (event.url) {
      lines.push(`URL:${event.url}`)
    }
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="speaking-events.ics"')
  res.send(lines.join('\r\n'))
})

// Parse Sessionize CFS page
app.post('/api/import/sessionize', async (req, res) => {
  const { url } = req.body

  if (!url) {
    return res.status(400).json({ error: 'Invalid Sessionize URL' })
  }

  // Validate URL hostname to prevent SSRF
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.hostname !== 'sessionize.com' && !parsedUrl.hostname.endsWith('.sessionize.com')) {
      return res.status(400).json({ error: 'Invalid Sessionize URL' })
    }
  } catch {
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

    const { city, country } = extractSessionizeLocation(html)

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
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

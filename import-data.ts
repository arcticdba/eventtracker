import { readFileSync, writeFileSync } from 'fs'
import { parseStringPromise } from 'xml2js'
import { v4 as uuidv4 } from 'uuid'

interface XMLEvent {
  EventID?: string[]
  EventName?: string[]
  City?: string[]
  Country?: string[]
  DateStart?: string[]
  DateEnd?: string[]
  EventStatus?: string[]
  IsRemote?: string[]
}

interface XMLSessionEvent {
  EventID?: string[]
  SessionID?: string[]
  Status?: string[]
}

interface XMLSession {
  SessionID?: string[]
  SessionName?: string[]
}

interface DataJson {
  events: Array<{
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
  }>
  sessions: Array<{
    id: string
    name: string
    level: string
    abstract: string
    summary: string
    goals: string
    elevatorPitch: string
    retired: boolean
  }>
  submissions: Array<{
    id: string
    sessionId: string
    eventId: string
    state: string
  }>
}

function formatDate(isoString: string): string {
  // Convert "2016-08-27T00:00:00" to "2016-08-27"
  return isoString.split('T')[0]
}

function mapStatus(status: string): string {
  // Map XML status to our submission states
  const statusLower = status.toLowerCase()
  if (statusLower === 'accepted') return 'selected'
  if (statusLower === 'rejected') return 'rejected'
  if (statusLower === 'declined') return 'declined'
  return 'submitted'
}

async function importData() {
  // Read current data
  const dataJson: DataJson = JSON.parse(readFileSync('./data.json', 'utf-8'))

  // Read Sessions.xml to build SessionID -> name mapping
  const sessionsXml = readFileSync('./Sessions.xml', 'utf-8')
  const sessionsParsed = await parseStringPromise(sessionsXml)
  const xmlSessions: XMLSession[] = sessionsParsed.dataroot.Sessions || []

  // Build mapping from original SessionID to session name
  const sessionIdToName: Map<string, string> = new Map()
  for (const session of xmlSessions) {
    const id = session.SessionID?.[0]
    const name = session.SessionName?.[0]?.trim()
    if (id && name) {
      sessionIdToName.set(id, name)
    }
  }
  console.log(`Loaded ${sessionIdToName.size} session ID mappings from Sessions.xml`)

  // Build mapping from session name to our UUID
  const sessionNameToUuid: Map<string, string> = new Map()
  for (const session of dataJson.sessions) {
    sessionNameToUuid.set(session.name, session.id)
  }
  console.log(`Found ${sessionNameToUuid.size} sessions in data.json`)

  // Combined mapping: original SessionID -> our UUID
  const sessionIdToUuid: Map<string, string> = new Map()
  for (const [id, name] of sessionIdToName) {
    const uuid = sessionNameToUuid.get(name)
    if (uuid) {
      sessionIdToUuid.set(id, uuid)
    }
  }
  console.log(`Mapped ${sessionIdToUuid.size} session IDs to UUIDs`)

  // Read and parse events
  const eventsXml = readFileSync('./tblEvents.xml', 'utf-8')
  const eventsParsed = await parseStringPromise(eventsXml)
  const xmlEvents: XMLEvent[] = eventsParsed.dataroot.tblEvents || []

  console.log(`Found ${xmlEvents.length} events to import`)

  // Build mapping from original EventID to our UUID
  const eventIdToUuid: Map<string, string> = new Map()

  // Clear existing events (except manually created ones) - actually, let's just add new ones
  // Keep track of existing event names to avoid duplicates
  const existingEventNames = new Set(dataJson.events.map(e => e.name))

  let eventsImported = 0
  let eventsSkipped = 0

  for (const event of xmlEvents) {
    const name = event.EventName?.[0]?.trim()
    const eventId = event.EventID?.[0]

    if (!name || !eventId) {
      eventsSkipped++
      continue
    }

    if (existingEventNames.has(name)) {
      // Event already exists, just map the ID
      const existingEvent = dataJson.events.find(e => e.name === name)
      if (existingEvent) {
        eventIdToUuid.set(eventId, existingEvent.id)
      }
      eventsSkipped++
      continue
    }

    const newEvent = {
      id: uuidv4(),
      name,
      country: event.Country?.[0] || '',
      city: event.City?.[0] || '',
      dateStart: formatDate(event.DateStart?.[0] || ''),
      dateEnd: formatDate(event.DateEnd?.[0] || ''),
      remote: event.IsRemote?.[0] === '1',
      callForContentUrl: '',
      callForContentLastDate: '',
      loginTool: ''
    }

    dataJson.events.push(newEvent)
    eventIdToUuid.set(eventId, newEvent.id)
    existingEventNames.add(name)
    eventsImported++
  }

  console.log(`Events imported: ${eventsImported}, skipped: ${eventsSkipped}`)

  // Read and parse session-event submissions
  const sessionEventsXml = readFileSync('./tblSessionEvents.xml', 'utf-8')
  const sessionEventsParsed = await parseStringPromise(sessionEventsXml)
  const xmlSessionEvents: XMLSessionEvent[] = sessionEventsParsed.dataroot.tblSessionEvents || []

  console.log(`Found ${xmlSessionEvents.length} submissions to import`)

  // Keep track of existing submissions to avoid duplicates
  const existingSubmissions = new Set(
    dataJson.submissions.map(s => `${s.sessionId}-${s.eventId}`)
  )

  let submissionsImported = 0
  let submissionsSkipped = 0
  let missingSession = 0
  let missingEvent = 0

  for (const se of xmlSessionEvents) {
    const eventId = se.EventID?.[0]
    const sessionId = se.SessionID?.[0]
    const status = se.Status?.[0] || 'Submitted'

    if (!eventId || !sessionId) {
      submissionsSkipped++
      continue
    }

    const ourEventId = eventIdToUuid.get(eventId)
    const ourSessionId = sessionIdToUuid.get(sessionId)

    if (!ourEventId) {
      missingEvent++
      continue
    }

    if (!ourSessionId) {
      missingSession++
      continue
    }

    const submissionKey = `${ourSessionId}-${ourEventId}`
    if (existingSubmissions.has(submissionKey)) {
      submissionsSkipped++
      continue
    }

    const newSubmission = {
      id: uuidv4(),
      sessionId: ourSessionId,
      eventId: ourEventId,
      state: mapStatus(status)
    }

    dataJson.submissions.push(newSubmission)
    existingSubmissions.add(submissionKey)
    submissionsImported++
  }

  console.log(`Submissions imported: ${submissionsImported}, skipped: ${submissionsSkipped}`)
  console.log(`Missing sessions: ${missingSession}, missing events: ${missingEvent}`)

  // Save updated data
  writeFileSync('./data.json', JSON.stringify(dataJson, null, 2))
  console.log('\nData saved to data.json')

  // Summary
  console.log('\n--- Summary ---')
  console.log(`Total events: ${dataJson.events.length}`)
  console.log(`Total sessions: ${dataJson.sessions.length}`)
  console.log(`Total submissions: ${dataJson.submissions.length}`)
}

importData().catch(console.error)

import { Event, Session, Submission, SubmissionState } from './types'

const API_BASE = '/api'

// Events
export async function fetchEvents(): Promise<Event[]> {
  const res = await fetch(`${API_BASE}/events`)
  return res.json()
}

export async function createEvent(event: Omit<Event, 'id'>): Promise<Event> {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  })
  return res.json()
}

export async function updateEvent(id: string, event: Partial<Event>): Promise<Event> {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  })
  return res.json()
}

export async function deleteEvent(id: string): Promise<void> {
  await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' })
}

// Sessions
export async function fetchSessions(): Promise<Session[]> {
  const res = await fetch(`${API_BASE}/sessions`)
  return res.json()
}

export async function createSession(session: Omit<Session, 'id'>): Promise<Session> {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session)
  })
  return res.json()
}

export async function updateSession(id: string, session: Partial<Session>): Promise<Session> {
  const res = await fetch(`${API_BASE}/sessions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session)
  })
  return res.json()
}

export async function deleteSession(id: string): Promise<void> {
  await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE' })
}

// Submissions
export async function fetchSubmissions(): Promise<Submission[]> {
  const res = await fetch(`${API_BASE}/submissions`)
  return res.json()
}

export async function createSubmission(sessionId: string, eventId: string, nameUsed: string): Promise<Submission> {
  const res = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, eventId, nameUsed })
  })
  return res.json()
}

export async function updateSubmissionState(id: string, state: SubmissionState): Promise<Submission> {
  const res = await fetch(`${API_BASE}/submissions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state })
  })
  return res.json()
}

export async function deleteSubmission(id: string): Promise<void> {
  await fetch(`${API_BASE}/submissions/${id}`, { method: 'DELETE' })
}

// Import
export async function importFromSessionize(url: string): Promise<Omit<Event, 'id'>> {
  const res = await fetch(`${API_BASE}/import/sessionize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Import failed')
  }
  return res.json()
}

import { Event, EventSeries, Session, Submission, SubmissionState, UISettings } from './types'

export type { DateFormat, UISettings } from './types'

const API_BASE = '/api'

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options)
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    try {
      const body = await res.json() as { error?: string }
      if (body.error) message = body.error
    } catch {
      // Preserve the HTTP status message when the response has no JSON body.
    }
    throw new ApiError(message, res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

function jsonOptions(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }
}

// Events
export async function fetchEventSeries(): Promise<EventSeries[]> {
  return request('/event-series')
}

export async function createEventSeries(name: string): Promise<EventSeries> {
  return request('/event-series', jsonOptions('POST', { name }))
}

export async function updateEventSeries(id: string, name: string): Promise<EventSeries> {
  return request(`/event-series/${id}`, jsonOptions('PUT', { name }))
}

export async function deleteEventSeries(id: string): Promise<void> {
  await request<void>(`/event-series/${id}`, { method: 'DELETE' })
}

export async function fetchEvents(): Promise<Event[]> {
  return request('/events')
}

export async function createEvent(event: Omit<Event, 'id'>): Promise<Event> {
  return request('/events', jsonOptions('POST', event))
}

export async function updateEvent(id: string, event: Partial<Event>): Promise<Event> {
  return request(`/events/${id}`, jsonOptions('PUT', event))
}

export async function deleteEvent(id: string): Promise<void> {
  await request<void>(`/events/${id}`, { method: 'DELETE' })
}

// Sessions
export async function fetchSessions(): Promise<Session[]> {
  return request('/sessions')
}

export async function createSession(session: Omit<Session, 'id'>): Promise<Session> {
  return request('/sessions', jsonOptions('POST', session))
}

export async function updateSession(id: string, session: Partial<Session>): Promise<Session> {
  return request(`/sessions/${id}`, jsonOptions('PUT', session))
}

export async function deleteSession(id: string): Promise<void> {
  await request<void>(`/sessions/${id}`, { method: 'DELETE' })
}

// Submissions
export async function fetchSubmissions(): Promise<Submission[]> {
  return request('/submissions')
}

export async function createSubmission(sessionId: string, eventId: string, nameUsed: string, notes?: string): Promise<Submission> {
  return request('/submissions', jsonOptions('POST', { sessionId, eventId, nameUsed, notes: notes || '' }))
}

export async function updateSubmissionState(id: string, state: SubmissionState): Promise<Submission> {
  return request(`/submissions/${id}`, jsonOptions('PUT', { state }))
}

export async function updateSubmissionNotes(id: string, notes: string): Promise<Submission> {
  return request(`/submissions/${id}`, jsonOptions('PUT', { notes }))
}

export async function deleteSubmission(id: string): Promise<void> {
  await request<void>(`/submissions/${id}`, { method: 'DELETE' })
}

// Settings
export async function fetchSettings(): Promise<UISettings> {
  return request('/settings')
}

export async function saveSettings(settings: UISettings): Promise<UISettings> {
  return request('/settings', jsonOptions('PUT', settings))
}

// Import
export async function importFromSessionize(url: string): Promise<Omit<Event, 'id'>> {
  return request('/import/sessionize', jsonOptions('POST', { url }))
}

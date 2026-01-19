import { useState, useEffect } from 'react'
import { Event, Session, Submission, SubmissionState, EventState } from './types'
import * as api from './api'
import { EventList } from './components/EventList'
import { EventForm } from './components/EventForm'
import { SessionList } from './components/SessionList'
import { SessionForm } from './components/SessionForm'
import { SubmissionList } from './components/SubmissionList'
import { SessionPicker } from './components/SessionPicker'
import { ImportFromSessionize } from './components/ImportFromSessionize'
import { Statistics } from './components/Statistics'

type Tab = 'events' | 'sessions' | 'statistics'

export default function App() {
  const [events, setEvents] = useState<Event[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('events')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [showSessionPicker, setShowSessionPicker] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importedEventData, setImportedEventData] = useState<Omit<Event, 'id'> | null>(null)

  // Persistent filter state for EventList
  const [eventFilters, setEventFilters] = useState<Set<EventState>>(new Set())
  const [eventFutureOnly, setEventFutureOnly] = useState(true)

  // Persistent filter state for SessionList
  const [sessionShowActive, setSessionShowActive] = useState(true)
  const [sessionShowRetired, setSessionShowRetired] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [eventsData, sessionsData, submissionsData] = await Promise.all([
      api.fetchEvents(),
      api.fetchSessions(),
      api.fetchSubmissions()
    ])
    setEvents(eventsData)
    setSessions(sessionsData)
    setSubmissions(submissionsData)
  }

  // Event handlers
  async function handleSaveEvent(data: Omit<Event, 'id'>) {
    if (editingEvent) {
      const updated = await api.updateEvent(editingEvent.id, data)
      setEvents(events.map(e => e.id === updated.id ? updated : e))
    } else {
      const created = await api.createEvent(data)
      setEvents([...events, created])
    }
    setShowEventForm(false)
    setEditingEvent(null)
  }

  async function handleDeleteEvent(id: string) {
    if (confirm('Delete this event and all its submissions?')) {
      await api.deleteEvent(id)
      setEvents(events.filter(e => e.id !== id))
      setSubmissions(submissions.filter(s => s.eventId !== id))
      if (selectedEvent?.id === id) setSelectedEvent(null)
    }
  }

  // Session handlers
  async function handleSaveSession(data: Omit<Session, 'id'>) {
    if (editingSession) {
      const updated = await api.updateSession(editingSession.id, data)
      setSessions(sessions.map(s => s.id === updated.id ? updated : s))
    } else {
      const created = await api.createSession(data)
      setSessions([...sessions, created])
    }
    setShowSessionForm(false)
    setEditingSession(null)
  }

  async function handleDeleteSession(id: string) {
    if (confirm('Delete this session?')) {
      await api.deleteSession(id)
      setSessions(sessions.filter(s => s.id !== id))
    }
  }

  // Submission handlers
  async function handleAddSessionsToEvent(selections: { sessionId: string; nameUsed: string }[]) {
    if (!selectedEvent) return

    const newSubmissions: Submission[] = []
    for (const { sessionId, nameUsed } of selections) {
      const exists = submissions.some(
        s => s.sessionId === sessionId && s.eventId === selectedEvent.id
      )
      if (!exists) {
        const created = await api.createSubmission(sessionId, selectedEvent.id, nameUsed)
        newSubmissions.push(created)
      }
    }
    setSubmissions([...submissions, ...newSubmissions])
  }

  async function handleUpdateSubmissionState(id: string, state: SubmissionState) {
    const updated = await api.updateSubmissionState(id, state)
    setSubmissions(submissions.map(s => s.id === updated.id ? updated : s))
  }

  async function handleDeleteSubmission(id: string) {
    await api.deleteSubmission(id)
    setSubmissions(submissions.filter(s => s.id !== id))
  }

  async function handleDeclineEvent(eventId: string) {
    if (!confirm('Decline all submissions for this event?')) return

    const eventSubmissions = submissions.filter(s => s.eventId === eventId)
    const updatedSubmissions = await Promise.all(
      eventSubmissions.map(s => api.updateSubmissionState(s.id, 'declined'))
    )

    setSubmissions(submissions.map(s => {
      const updated = updatedSubmissions.find(u => u.id === s.id)
      return updated || s
    }))
  }

  const eventSubmissions = selectedEvent
    ? submissions.filter(s => s.eventId === selectedEvent.id)
    : []

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="bg-white shadow flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Speaking Event Tracker</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-6xl w-full mx-auto px-4 py-4 overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-4 flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'events'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'sessions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Sessions
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'statistics'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Statistics
            </button>
          </div>
        </div>

        {activeTab === 'statistics' ? (
          <div className="flex-1 overflow-y-auto">
            <Statistics events={events} submissions={submissions} />
          </div>
        ) : (
          <div className={`flex-1 grid gap-4 ${activeTab === 'events' && !showEventForm ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} overflow-hidden`}>
            {/* Left Panel */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-col overflow-hidden">
              {activeTab === 'events' ? (
                <>
                  <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-lg font-semibold">Events</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowImportModal(true)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Import
                      </button>
                      <button
                        onClick={() => { setShowEventForm(true); setEditingEvent(null); setImportedEventData(null) }}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        + New Event
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {showEventForm ? (
                      <EventForm
                        event={editingEvent || undefined}
                        initialData={importedEventData || undefined}
                        onSave={handleSaveEvent}
                        onCancel={() => { setShowEventForm(false); setEditingEvent(null); setImportedEventData(null) }}
                      />
                    ) : (
                      <EventList
                        events={events}
                        submissions={submissions}
                        onEdit={e => { setEditingEvent(e); setShowEventForm(true) }}
                        onDelete={handleDeleteEvent}
                        onSelect={setSelectedEvent}
                        onDecline={handleDeclineEvent}
                        selectedEventId={selectedEvent?.id}
                        filters={eventFilters}
                        onFiltersChange={setEventFilters}
                        futureOnly={eventFutureOnly}
                        onFutureOnlyChange={setEventFutureOnly}
                      />
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-lg font-semibold">Sessions</h2>
                    <button
                      onClick={() => { setShowSessionForm(true); setEditingSession(null) }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      + New Session
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {showSessionForm ? (
                      <SessionForm
                        session={editingSession || undefined}
                        onSave={handleSaveSession}
                        onCancel={() => { setShowSessionForm(false); setEditingSession(null) }}
                      />
                    ) : (
                      <SessionList
                        sessions={sessions}
                        events={events}
                        submissions={submissions}
                        onEdit={s => { setEditingSession(s); setShowSessionForm(true) }}
                        onDelete={handleDeleteSession}
                        showActive={sessionShowActive}
                        onShowActiveChange={setSessionShowActive}
                        showRetired={sessionShowRetired}
                        onShowRetiredChange={setSessionShowRetired}
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right Panel - Submissions for selected event (only show on events tab when not editing) */}
            {activeTab === 'events' && !showEventForm && (
              <div className="bg-white rounded-lg shadow p-4 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <h2 className="text-lg font-semibold">
                    {selectedEvent
                      ? `Submissions for ${selectedEvent.name}`
                      : 'Select an event to view submissions'}
                  </h2>
                  {selectedEvent && !showSessionPicker && (
                    <button
                      onClick={() => setShowSessionPicker(true)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      + Add Sessions
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto">
                  {selectedEvent ? (
                    showSessionPicker ? (
                      <SessionPicker
                        sessions={sessions}
                        submissions={submissions}
                        eventId={selectedEvent.id}
                        onAdd={handleAddSessionsToEvent}
                        onClose={() => setShowSessionPicker(false)}
                      />
                    ) : (
                      <SubmissionList
                        submissions={eventSubmissions}
                        sessions={sessions}
                        onUpdateState={handleUpdateSubmissionState}
                        onDelete={handleDeleteSubmission}
                      />
                    )
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Click on an event in the Events tab to see and manage its submissions.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showImportModal && (
        <ImportFromSessionize
          onImport={(data) => {
            setImportedEventData(data)
            setShowImportModal(false)
            setShowEventForm(true)
            setEditingEvent(null)
          }}
          onCancel={() => setShowImportModal(false)}
        />
      )}
    </div>
  )
}

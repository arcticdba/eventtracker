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
import { MonthlyEventsBar } from './components/MonthlyEventsBar'
import { WeeklyEventsBar } from './components/WeeklyEventsBar'
import { Settings } from './components/Settings'
import { CommandPalette } from './components/CommandPalette'
import { UISettings } from './api'

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

  // Persistent filter state for EventList (default: "Upcoming" preset)
  const [eventFilters, setEventFilters] = useState<Set<EventState>>(new Set(['selected']))
  const [eventFutureOnly, setEventFutureOnly] = useState(true)
  const [eventPastOnly, setEventPastOnly] = useState(false)
  const [eventMvpCompletedOnly, setEventMvpCompletedOnly] = useState(false)
  const [eventNotFullyBooked, setEventNotFullyBooked] = useState(false)
  const [eventCfsOpen, setEventCfsOpen] = useState(false)
  const [eventEquipmentNeeded, setEventEquipmentNeeded] = useState(false)

  // Persistent filter state for SessionList
  const [sessionShowActive, setSessionShowActive] = useState(true)
  const [sessionShowRetired, setSessionShowRetired] = useState(false)

  // Month filter from the timeline bar
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  // Event list counts for header display
  const [eventListCounts, setEventListCounts] = useState<{ filtered: number; total: number }>({ filtered: 0, total: 0 })

  // Settings
  const [showSettings, setShowSettings] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [uiSettings, setUISettings] = useState<UISettings>({
    showMonthView: true,
    showWeekView: true,
    showMvpFeatures: true,
    maxEventsPerMonth: 0,
    maxEventsPerYear: 0,
    dateFormat: 'YYYY-MM-DD'
  })

  useEffect(() => {
    loadData()
    loadSettings()
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(true)
      }
      // Cmd+, or Ctrl+, to open settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setShowSettings(true)
      }
      // Cmd+N or Ctrl+N to create new event (when on events tab)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && activeTab === 'events' && !showEventForm) {
        e.preventDefault()
        setShowEventForm(true)
        setEditingEvent(null)
        setImportedEventData(null)
      }
      // Cmd+S or Ctrl+S to create new session
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && !showSessionForm) {
        e.preventDefault()
        setActiveTab('sessions')
        setShowSessionForm(true)
        setEditingSession(null)
      }
      // Cmd+U or Ctrl+U to submit session to selected event
      if ((e.metaKey || e.ctrlKey) && e.key === 'u' && selectedEvent && !showSessionPicker) {
        e.preventDefault()
        setActiveTab('events')
        setShowSessionPicker(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, showEventForm, showSessionForm, showSessionPicker, selectedEvent])

  async function loadSettings() {
    const settings = await api.fetchSettings()
    setUISettings(settings)
  }

  async function handleSettingsChange(settings: UISettings) {
    setUISettings(settings)
    await api.saveSettings(settings)
  }

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

  async function handleToggleEventRemote(id: string) {
    const event = events.find(e => e.id === id)
    if (event) {
      const updated = await api.updateEvent(id, { remote: !event.remote })
      setEvents(events.map(e => e.id === id ? updated : e))
    }
  }

  async function handleToggleEventMvpSubmission(id: string) {
    const event = events.find(e => e.id === id)
    if (event) {
      const updated = await api.updateEvent(id, { mvpSubmission: !event.mvpSubmission })
      setEvents(events.map(e => e.id === id ? updated : e))
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

  async function handleToggleSessionRetired(id: string) {
    const session = sessions.find(s => s.id === id)
    if (session) {
      const updated = await api.updateSession(id, { retired: !session.retired })
      setSessions(sessions.map(s => s.id === id ? updated : s))
    }
  }

  // Submission handlers
  async function handleAddSessionsToEvent(selections: { sessionId: string; nameUsed: string; newAlternateName?: string; notes?: string }[]) {
    if (!selectedEvent) return

    const newSubmissions: Submission[] = []
    const updatedSessions: Session[] = []

    for (const { sessionId, nameUsed, newAlternateName, notes } of selections) {
      // If a new alternate name was created, save it to the session
      if (newAlternateName) {
        const session = sessions.find(s => s.id === sessionId)
        if (session) {
          const existingNames = session.alternateNames || []
          if (!existingNames.includes(newAlternateName)) {
            const updated = await api.updateSession(sessionId, {
              alternateNames: [...existingNames, newAlternateName]
            })
            updatedSessions.push(updated)
          }
        }
      }

      const exists = submissions.some(
        s => s.sessionId === sessionId && s.eventId === selectedEvent.id
      )
      if (!exists) {
        const created = await api.createSubmission(sessionId, selectedEvent.id, nameUsed, notes)
        newSubmissions.push(created)
      }
    }

    // Update sessions state with any new alternate names
    if (updatedSessions.length > 0) {
      setSessions(sessions.map(s => {
        const updated = updatedSessions.find(u => u.id === s.id)
        return updated || s
      }))
    }

    setSubmissions([...submissions, ...newSubmissions])
  }

  async function handleUpdateSubmissionState(id: string, state: SubmissionState) {
    const updated = await api.updateSubmissionState(id, state)
    setSubmissions(submissions.map(s => s.id === updated.id ? updated : s))
  }

  async function handleUpdateSubmissionNotes(id: string, notes: string) {
    const updated = await api.updateSubmissionNotes(id, notes)
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

  async function handleRejectPendingEvent(eventId: string) {
    const pendingSubmissions = submissions.filter(s => s.eventId === eventId && s.state === 'submitted')
    if (pendingSubmissions.length === 0) return
    if (!confirm(`Reject ${pendingSubmissions.length} pending submission${pendingSubmissions.length > 1 ? 's' : ''} for this event?`)) return

    const updatedSubmissions = await Promise.all(
      pendingSubmissions.map(s => api.updateSubmissionState(s.id, 'rejected'))
    )

    setSubmissions(submissions.map(s => {
      const updated = updatedSubmissions.find(u => u.id === s.id)
      return updated || s
    }))
  }

  const eventSubmissions = selectedEvent
    ? submissions.filter(s => s.eventId === selectedEvent.id)
    : []

  // Filter events by selected month
  const currentYear = new Date().getFullYear()
  const filteredEvents = selectedMonth !== null
    ? events.filter(event => {
        const date = new Date(event.dateStart)
        return date.getFullYear() === currentYear && date.getMonth() === selectedMonth
      })
    : events

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="bg-white shadow flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Speaking Event Tracker</h1>
          <button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200"
            title="Command Palette (⌘K)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm text-gray-400">⌘K</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="Settings (⌘,)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
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

        {activeTab === 'events' && (
          <>
            {uiSettings.showMonthView && (
              <MonthlyEventsBar
                events={events}
                submissions={submissions}
                selectedMonth={selectedMonth}
                onMonthSelect={setSelectedMonth}
                maxEventsPerMonth={uiSettings.maxEventsPerMonth}
                dateFormat={uiSettings.dateFormat}
              />
            )}
            {uiSettings.showWeekView && (
              <WeeklyEventsBar
                events={events}
                submissions={submissions}
                maxEventsPerMonth={uiSettings.maxEventsPerMonth}
                selectedMonth={selectedMonth}
                onMonthSelect={setSelectedMonth}
                dateFormat={uiSettings.dateFormat}
              />
            )}
            {/* Year bandwidth warning */}
            {uiSettings.maxEventsPerYear > 0 && (() => {
              const eventsThisYear = events.filter(e => new Date(e.dateStart).getFullYear() === currentYear).length
              if (eventsThisYear > uiSettings.maxEventsPerYear) {
                return (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4 flex-shrink-0">
                    <span className="text-sm text-red-700">
                      Year bandwidth exceeded: {eventsThisYear} events / {uiSettings.maxEventsPerYear} max ({eventsThisYear - uiSettings.maxEventsPerYear} over limit)
                    </span>
                  </div>
                )
              } else if (eventsThisYear === uiSettings.maxEventsPerYear) {
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 flex-shrink-0">
                    <span className="text-sm text-amber-700">
                      Year bandwidth at limit: {eventsThisYear} events / {uiSettings.maxEventsPerYear} max
                    </span>
                  </div>
                )
              }
              return null
            })()}
          </>
        )}

        {activeTab === 'statistics' ? (
          <div className="flex-1 overflow-y-auto">
            <Statistics events={events} sessions={sessions} submissions={submissions} dateFormat={uiSettings.dateFormat} />
          </div>
        ) : (
          <div className={`flex-1 grid gap-4 ${activeTab === 'events' && !showEventForm ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} overflow-hidden`}>
            {/* Left Panel */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-col overflow-hidden">
              {activeTab === 'events' ? (
                <>
                  <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">Events</h2>
                      <span className="text-xs text-gray-400">
                        ({eventListCounts.filtered} of {eventListCounts.total})
                      </span>
                      {selectedMonth !== null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-sm rounded-full">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][selectedMonth]} {currentYear}
                          <button
                            onClick={() => setSelectedMonth(null)}
                            className="hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      )}
                    </div>
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
                        allEvents={events}
                        onSave={handleSaveEvent}
                        onCancel={() => { setShowEventForm(false); setEditingEvent(null); setImportedEventData(null) }}
                        showMvpFeatures={uiSettings.showMvpFeatures}
                      />
                    ) : (
                      <EventList
                        events={filteredEvents}
                        submissions={submissions}
                        sessions={sessions}
                        onEdit={e => { setEditingEvent(e); setShowEventForm(true) }}
                        onDelete={handleDeleteEvent}
                        onSelect={setSelectedEvent}
                        onDecline={handleDeclineEvent}
                        onRejectPending={handleRejectPendingEvent}
                        onToggleRemote={handleToggleEventRemote}
                        onToggleMvpSubmission={handleToggleEventMvpSubmission}
                        selectedEventId={selectedEvent?.id}
                        filters={eventFilters}
                        onFiltersChange={setEventFilters}
                        futureOnly={eventFutureOnly}
                        onFutureOnlyChange={setEventFutureOnly}
                        pastOnly={eventPastOnly}
                        onPastOnlyChange={setEventPastOnly}
                        showMvpFeatures={uiSettings.showMvpFeatures}
                        mvpCompletedOnly={eventMvpCompletedOnly}
                        onMvpCompletedOnlyChange={setEventMvpCompletedOnly}
                        notFullyBooked={eventNotFullyBooked}
                        onNotFullyBookedChange={setEventNotFullyBooked}
                        cfsOpen={eventCfsOpen}
                        onCfsOpenChange={setEventCfsOpen}
                        equipmentNeeded={eventEquipmentNeeded}
                        onEquipmentNeededChange={setEventEquipmentNeeded}
                        onFilteredCountChange={(filtered, total) => setEventListCounts({ filtered, total })}
                        dateFormat={uiSettings.dateFormat}
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
                        onToggleRetired={handleToggleSessionRetired}
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
                        onUpdateNotes={handleUpdateSubmissionNotes}
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

      {showSettings && (
        <Settings
          settings={uiSettings}
          onSettingsChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        events={events}
        submissions={submissions}
        selectedEvent={selectedEvent}
        onNewEvent={() => {
          setActiveTab('events')
          setShowEventForm(true)
          setEditingEvent(null)
          setImportedEventData(null)
        }}
        onNewSession={() => {
          setActiveTab('sessions')
          setShowSessionForm(true)
          setEditingSession(null)
        }}
        onAddSessionToEvent={() => {
          if (selectedEvent) {
            setActiveTab('events')
            setShowSessionPicker(true)
          }
        }}
        onOpenSettings={() => setShowSettings(true)}
        onSelectEvent={setSelectedEvent}
        onTabChange={setActiveTab}
      />
    </div>
  )
}

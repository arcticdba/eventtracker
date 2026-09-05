import { useState, useEffect } from 'react'
import { Event, Session, Submission, SubmissionState, EventState, CalendarSelection } from './types'
import * as api from './api'
import { EventList } from './components/EventList'
import { EventForm } from './components/EventForm'
import { SessionList } from './components/SessionList'
import { SessionForm } from './components/SessionForm'
import { SubmissionList } from './components/SubmissionList'
import { SessionPicker } from './components/SessionPicker'
import { ImportFromSessionize } from './components/ImportFromSessionize'
import { StatisticsLab } from './components/StatisticsLab'
import { MonthlyEventsBar } from './components/MonthlyEventsBar'
import { WeeklyEventsBar } from './components/WeeklyEventsBar'
import { Settings } from './components/Settings'
import { CommandPalette } from './components/CommandPalette'
import { UISettings } from './api'
import { computeEventState } from './utils/computeEventState'
import { MONTHS, parseDateOnly } from './utils/date'
import { formatDate } from './utils/formatDate'
import { useEventTrackerData } from './hooks/useEventTrackerData'
import { useUISettings } from './hooks/useUISettings'

type Tab = 'events' | 'sessions' | 'statistics'
type SessionEditReturn = { tab: 'events' | 'statistics'; eventId: string; submissionId: string; outcome?: SubmissionState }

export default function App() {
  const { events, setEvents, eventSeries, setEventSeries, sessions, setSessions, submissions, setSubmissions } = useEventTrackerData()
  const { settings: uiSettings, updateSettings } = useUISettings()
  const [activeTab, setActiveTab] = useState<Tab>('events')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [sessionEditReturn, setSessionEditReturn] = useState<SessionEditReturn | null>(null)
  const [focusedSubmissionId, setFocusedSubmissionId] = useState<string | null>(null)
  const [statisticsExpandedOutcome, setStatisticsExpandedOutcome] = useState<SubmissionState | null>(null)
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
  const [eventSearch, setEventSearch] = useState('')

  // Persistent filter state for SessionList
  const [sessionShowActive, setSessionShowActive] = useState(true)
  const [sessionShowRetired, setSessionShowRetired] = useState(false)

  // Month filter from the timeline bar
  const [selectedMonth, setSelectedMonth] = useState<CalendarSelection | null>(null)

  // Event list counts for header display
  const [eventListCounts, setEventListCounts] = useState<{ filtered: number; total: number }>({ filtered: 0, total: 0 })

  // Settings
  const [showSettings, setShowSettings] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)

  useEffect(() => {
    if (!focusedSubmissionId) return
    const timeout = window.setTimeout(() => {
      setFocusedSubmissionId(null)
      setStatisticsExpandedOutcome(null)
    }, 2000)
    return () => window.clearTimeout(timeout)
  }, [focusedSubmissionId])

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

  async function handleSettingsChange(settings: UISettings) {
    await updateSettings(settings)
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

  async function handleCreateEventSeries(name: string) {
    const created = await api.createEventSeries(name)
    setEventSeries([...eventSeries, created].sort((a, b) => a.name.localeCompare(b.name)))
    return created
  }

  async function handleRenameEventSeries(id: string, name: string) {
    const updated = await api.updateEventSeries(id, name)
    setEventSeries(eventSeries.map(series => series.id === id ? updated : series).sort((a, b) => a.name.localeCompare(b.name)))
    return updated
  }

  async function handleDeleteEventSeries(id: string) {
    await api.deleteEventSeries(id)
    setEventSeries(eventSeries.filter(series => series.id !== id))
    setEvents(events.map(event => event.seriesId === id ? { ...event, seriesId: undefined } : event))
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
    finishSessionEditing()
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

  function handleEditSession(session: Session, returnTo: SessionEditReturn | null = null) {
    setActiveTab('sessions')
    setEditingSession(session)
    setShowSessionForm(true)
    setShowSessionPicker(false)
    setSessionEditReturn(returnTo)
  }

  function finishSessionEditing() {
    const returnTo = sessionEditReturn
    setShowSessionForm(false)
    setEditingSession(null)
    setSessionEditReturn(null)
    if (!returnTo) return

    setFocusedSubmissionId(returnTo.submissionId)
    if (returnTo.tab === 'events') {
      setSelectedEvent(events.find(event => event.id === returnTo.eventId) ?? null)
    } else {
      setStatisticsExpandedOutcome(returnTo.outcome ?? null)
    }
    setActiveTab(returnTo.tab)
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

  async function handleCancelEvent(eventId: string) {
    if (!confirm('Mark this event as cancelled? All submissions will be set to cancelled.')) return

    const eventSubmissions = submissions.filter(s => s.eventId === eventId)
    const updatedSubmissions = await Promise.all(
      eventSubmissions.map(s => api.updateSubmissionState(s.id, 'cancelled'))
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
        const date = parseDateOnly(event.dateStart)
        return date.getFullYear() === selectedMonth.year && date.getMonth() === selectedMonth.month
      })
    : events

  const cfcClosingSoon = events.filter(event => {
    if (!event.callForContentLastDate) return false
    const state = computeEventState(event.id, submissions)
    if (state !== 'none' && state !== 'pending') return false
    const deadline = parseDateOnly(event.callForContentLastDate)
    deadline.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysRemaining = Math.round((deadline.getTime() - today.getTime()) / 86400000)
    return daysRemaining >= 0 && daysRemaining <= 7
  }).sort((a, b) => a.callForContentLastDate.localeCompare(b.callForContentLastDate) || a.name.localeCompare(b.name))

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-100 overflow-hidden">
      <header className="flex-shrink-0 border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center gap-2">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Speaking Event Tracker</h1>
          <button
            onClick={() => setShowCommandPalette(true)}
            className="ui-button-secondary gap-2 py-1.5"
            title="Command Palette (⌘K)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm text-gray-400 hidden sm:inline">⌘K</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="ui-button-quiet p-2"
            title="Settings (⌘,)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-6xl w-full mx-auto px-3 py-3 sm:px-4 sm:py-4 overflow-y-auto lg:overflow-hidden">
        {/* Tabs */}
        <div className="mb-4 flex-shrink-0 overflow-x-auto pb-1">
          <div className="flex w-max gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('events')}
              className={`ui-button px-4 py-2 ${
                activeTab === 'events'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`ui-button px-4 py-2 ${
                activeTab === 'sessions'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Sessions
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`ui-button px-4 py-2 ${
                activeTab === 'statistics'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
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
            {cfcClosingSoon.length > 0 && (
              <div className="mb-4 flex flex-shrink-0 flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 sm:flex-row sm:items-center">
                <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-amber-900">
                  <span aria-hidden="true">◷</span>
                  CfC closing within 7 days
                </div>
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {cfcClosingSoon.map(event => (
                    <button key={event.id} onClick={() => { setSelectedEvent(event); setShowEventForm(false) }} className="rounded-full border border-amber-200 bg-white px-2 py-1 text-xs text-amber-900 hover:border-amber-400 hover:bg-amber-100" title={`Select ${event.name}`}>
                      <span className="font-medium">{event.name}</span>
                      <span className="ml-1 text-amber-700">{formatDate(event.callForContentLastDate, uiSettings.dateFormat)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Year bandwidth warning */}
            {uiSettings.maxEventsPerYear > 0 && (() => {
              const eventsThisYear = events.filter(e => {
                if (parseDateOnly(e.dateStart).getFullYear() !== currentYear) return false
                const state = computeEventState(e.id, submissions)
                return state === 'pending' || state === 'selected'
              }).length
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
          <div className="overflow-y-auto lg:flex-1">
            <StatisticsLab events={events} eventSeries={eventSeries} sessions={sessions} submissions={submissions} dateFormat={uiSettings.dateFormat} showSessionDetails={uiSettings.showSessionPerformance} initialExpandedOutcome={statisticsExpandedOutcome} focusedSubmissionId={focusedSubmissionId} onEditSession={(session, submission, outcome) => handleEditSession(session, { tab: 'statistics', eventId: submission.eventId, submissionId: submission.id, outcome })} />
          </div>
        ) : (
          <div className={`grid gap-3 ${activeTab === 'events' && !showEventForm ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} lg:flex-1 lg:overflow-hidden`}>
            {/* Left Panel */}
            <div className="ui-panel flex flex-col lg:overflow-hidden">
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
                          {MONTHS[selectedMonth.month]} {selectedMonth.year}
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
                        className="ui-button-secondary py-1 text-emerald-700"
                      >
                        Import
                      </button>
                      <button
                        onClick={() => { setShowEventForm(true); setEditingEvent(null); setImportedEventData(null) }}
                        className="ui-button-primary py-1"
                      >
                        + New Event
                      </button>
                    </div>
                  </div>
                  <div className="overflow-y-auto min-h-[280px] lg:flex-1 lg:min-h-0">
                    {showEventForm ? (
                      <EventForm
                        event={editingEvent || undefined}
                        initialData={importedEventData || undefined}
                        allEvents={events}
                        eventSeries={eventSeries}
                        submissions={submissions}
                        onCreateEventSeries={handleCreateEventSeries}
                        onRenameEventSeries={handleRenameEventSeries}
                        onDeleteEventSeries={handleDeleteEventSeries}
                        onSave={handleSaveEvent}
                        onCancel={() => { setShowEventForm(false); setEditingEvent(null); setImportedEventData(null) }}
                        showMvpFeatures={uiSettings.showMvpFeatures}
                        dateFormat={uiSettings.dateFormat}
                      />
                    ) : (
                      <EventList
                        events={filteredEvents}
                        search={eventSearch}
                        onSearchChange={setEventSearch}
                        submissions={submissions}
                        sessions={sessions}
                        eventSeries={eventSeries}
                        onEdit={e => { setEditingEvent(e); setShowEventForm(true) }}
                        onDelete={handleDeleteEvent}
                        onSelect={setSelectedEvent}
                        onDecline={handleDeclineEvent}
                        onCancel={handleCancelEvent}
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
                      className="ui-button-primary py-1"
                    >
                      + New Session
                    </button>
                  </div>
                  <div className="overflow-y-auto min-h-[280px] lg:flex-1 lg:min-h-0">
                    {showSessionForm ? (
                      <SessionForm
                        session={editingSession || undefined}
                        onSave={handleSaveSession}
                        onCancel={finishSessionEditing}
                      />
                    ) : (
                      <SessionList
                        sessions={sessions}
                        events={events}
                        submissions={submissions}
                        onEdit={session => handleEditSession(session)}
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
              <div className="ui-panel flex flex-col lg:overflow-hidden">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <h2 className="text-lg font-semibold">
                    {selectedEvent
                      ? `Submissions for ${selectedEvent.name}`
                      : 'Select an event to view submissions'}
                  </h2>
                  {selectedEvent && !showSessionPicker && (
                    <button
                      onClick={() => setShowSessionPicker(true)}
                      className="ui-button-primary py-1"
                    >
                      + Add Sessions
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto min-h-[280px] lg:flex-1 lg:min-h-0">
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
                        focusedSubmissionId={focusedSubmissionId}
                        onEditSession={(session, submission) => handleEditSession(session, { tab: 'events', eventId: submission.eventId, submissionId: submission.id })}
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

import { Event, Submission, EventState } from '../types'
import { computeEventState } from '../utils/computeEventState'

interface Props {
  events: Event[]
  submissions: Submission[]
  onEdit: (event: Event) => void
  onDelete: (id: string) => void
  onSelect: (event: Event) => void
  onDecline: (eventId: string) => void
  selectedEventId?: string
  filters: Set<EventState>
  onFiltersChange: (filters: Set<EventState>) => void
  futureOnly: boolean
  onFutureOnlyChange: (futureOnly: boolean) => void
}

const allStates: EventState[] = ['pending', 'selected', 'rejected', 'declined', 'none']

const stateBackgrounds: Record<EventState, string> = {
  selected: 'bg-green-50 border-green-200',
  rejected: 'bg-red-50 border-red-200',
  declined: 'bg-orange-50 border-orange-200',
  pending: 'bg-yellow-50 border-yellow-200',
  none: 'bg-white border-gray-200'
}

const stateLabels: Record<EventState, string> = {
  selected: 'Selected',
  rejected: 'Rejected',
  declined: 'Declined',
  pending: 'Pending',
  none: 'No submissions'
}

function LoginToolIcon({ tool, url }: { tool: string; url?: string }) {
  const lowerTool = tool.toLowerCase()

  const getIcon = () => {
    if (lowerTool.includes('sessionize')) {
      // Official Sessionize logo from Simple Icons
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1AB394">
          <path d="M12 0c6.628 0 12 5.372 12 12v10c0 1.097-.903 2-2 2h-7.5l-.001-.169c-.049-2.894-1.347-4.902-3.709-5.96L24 12l-.32-.109c-2.858-.999-5.251-2.462-7.18-4.391c-1.928-1.928-3.392-4.322-4.391-7.181L12 0L4 18c0 .667.167 1.167.5 1.5c.334.334.834.5 1.5.5l.187.001c3.771.04 5.313 1.295 5.313 3.999H2c-1.097 0-2-.903-2-2V2C0 .903.903 0 2 0h10Zm7.207 4.793c-.781-.781-1.73-1.097-2.121-.707c-.39.39-.074 1.34.707 2.121c.781.781 1.731 1.098 2.121.707c.391-.39.074-1.34-.707-2.121Z"/>
        </svg>
      )
    }

    if (lowerTool.includes('papercall')) {
      return (
        <svg className="w-4 h-4" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" fill="#4A90A4"/>
          <path d="M8 16l14-8-4 8 4 8-14-8z" fill="white"/>
          <path d="M18 16l-6 4v-8l6 4z" fill="#4A90A4"/>
        </svg>
      )
    }

    if (lowerTool.includes('pretalx')) {
      return (
        <svg className="w-4 h-4" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" fill="#8B5CF6"/>
          <text x="16" y="21" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">P</text>
        </svg>
      )
    }

    if (lowerTool.includes('google') || lowerTool.includes('form')) {
      return (
        <svg className="w-4 h-4" viewBox="0 0 32 32" fill="none">
          <rect x="6" y="2" width="20" height="28" rx="2" fill="#673AB7"/>
          <rect x="10" y="8" width="8" height="2" rx="1" fill="white"/>
          <rect x="10" y="14" width="12" height="2" rx="1" fill="white"/>
          <rect x="10" y="20" width="10" height="2" rx="1" fill="white"/>
        </svg>
      )
    }

    // Default: show first letter in a circle
    return (
      <svg className="w-4 h-4" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" fill="#9CA3AF"/>
        <text x="16" y="21" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
          {tool.charAt(0).toUpperCase()}
        </text>
      </svg>
    )
  }

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        title={`Open ${tool}`}
        className="hover:opacity-70"
      >
        {getIcon()}
      </a>
    )
  }

  return <span title={tool}>{getIcon()}</span>
}

function getDaysRemaining(dateString: string): number | null {
  if (!dateString) return null
  const targetDate = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

function formatLocation(country: string, city: string, remote: boolean): string {
  const parts = []
  if (city) parts.push(city)
  if (country) parts.push(country)
  if (remote) parts.push('Remote')
  return parts.join(', ') || 'No location'
}

export function EventList({ events, submissions, onEdit, onDelete, onSelect, onDecline, selectedEventId, filters, onFiltersChange, futureOnly, onFutureOnlyChange }: Props) {
  const toggleFilter = (state: EventState) => {
    const newFilters = new Set(filters)
    if (newFilters.has(state)) {
      newFilters.delete(state)
    } else {
      newFilters.add(state)
    }
    onFiltersChange(newFilters)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const filteredEvents = events
    .filter(event => {
      const eventState = computeEventState(event.id, submissions)

      // Always show selected events without MVP submission
      const showDueToMvp = !event.mvpSubmission && eventState === 'selected'

      // Filter by future/past (but always include non-MVP selected events)
      if (futureOnly && !showDueToMvp) {
        const endDate = new Date(event.dateEnd || event.dateStart)
        endDate.setHours(0, 0, 0, 0)
        if (endDate < today) return false
      }

      // Filter by state
      if (filters.size === 0) return true
      return filters.has(eventState)
    })
    .sort((a, b) => {
      // Sort by start date descending (latest first)
      return (b.dateStart || '').localeCompare(a.dateStart || '')
    })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={futureOnly}
            onChange={() => onFutureOnlyChange(!futureOnly)}
            className="rounded border-gray-300"
          />
          <span>Future only</span>
        </label>
        <span className="text-gray-300">|</span>
        <label className="text-sm text-gray-600">Status:</label>
        {allStates.map(state => (
          <label key={state} className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={filters.has(state)}
              onChange={() => toggleFilter(state)}
              className="rounded border-gray-300"
            />
            <span>{stateLabels[state]}</span>
          </label>
        ))}
        <span className="text-xs text-gray-400">
          ({filteredEvents.length} of {events.length})
        </span>
      </div>

      {events.length === 0 ? (
        <p className="text-gray-500 text-sm">No events yet. Create one to get started.</p>
      ) : filteredEvents.length === 0 ? (
        <p className="text-gray-500 text-sm">No events match this filter.</p>
      ) : (
        filteredEvents.map(event => {
          const state = computeEventState(event.id, submissions)
          const eventSubmissions = submissions.filter(s => s.eventId === event.id)
          const submissionCount = eventSubmissions.length
          const selectedCount = eventSubmissions.filter(s => s.state === 'selected').length
          const isSelected = event.id === selectedEventId
          const daysUntilCfcClose = getDaysRemaining(event.callForContentLastDate)
          const daysUntilEvent = getDaysRemaining(event.dateStart)
          const eventInPast = daysUntilEvent !== null && daysUntilEvent < 0

          return (
            <div
              key={event.id}
              onClick={() => onSelect(event)}
              onDoubleClick={() => onEdit(event)}
              className={`p-3 border rounded-lg cursor-pointer transition ${
                !event.mvpSubmission && state === 'selected'
                  ? 'bg-green-50 border-green-400 border-2'
                  : stateBackgrounds[state]
              } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{event.name}</h3>
                    {event.remote && (
                      <span className="px-1.5 py-0.5 text-xs rounded bg-purple-100 text-purple-700">
                        Remote
                      </span>
                    )}
                    {!event.mvpSubmission && state === 'selected' && (
                      <span className="px-1.5 py-0.5 text-xs rounded bg-red-600 text-white font-medium max-w-[7rem]">
                        MVP submission needed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatLocation(event.country, event.city, false)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {event.dateStart}{event.dateEnd && event.dateEnd !== event.dateStart ? ` - ${event.dateEnd}` : ''}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {submissionCount} submission{submissionCount !== 1 ? 's' : ''}{selectedCount > 0 && ` (${selectedCount} selected)`}
                    </span>
                    {event.loginTool && (
                      <LoginToolIcon tool={event.loginTool} url={event.callForContentUrl} />
                    )}
                    {!eventInPast && daysUntilCfcClose !== null && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        daysUntilCfcClose < 0
                          ? 'bg-gray-100 text-gray-500'
                          : daysUntilCfcClose <= 7
                            ? 'bg-red-100 text-red-700'
                            : daysUntilCfcClose <= 14
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                      }`}>
                        {daysUntilCfcClose < 0
                          ? 'CfS closed'
                          : daysUntilCfcClose === 0
                            ? 'CfS closes today!'
                            : `CfS: ${daysUntilCfcClose}d`}
                      </span>
                    )}
                    {!eventInPast && daysUntilEvent !== null && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        daysUntilEvent <= 14
                          ? 'bg-purple-100 text-purple-700'
                          : daysUntilEvent <= 30
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {daysUntilEvent === 0
                          ? 'Event today!'
                          : `Event: ${daysUntilEvent}d`}
                      </span>
                    )}
                    <span
                      className={event.travel?.length > 0 ? 'text-green-600' : 'text-gray-300'}
                      title={event.travel?.length > 0 ? `${event.travel.length} travel booking(s)` : 'No travel booked'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </span>
                    <span
                      className={event.hotels?.length > 0 ? 'text-green-600' : 'text-gray-300'}
                      title={event.hotels?.length > 0 ? `${event.hotels.length} hotel booking(s)` : 'No hotel booked'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs">
                  {submissionCount > 0 && state !== 'declined' && state !== 'rejected' && (
                    <button
                      onClick={e => { e.stopPropagation(); onDecline(event.id) }}
                      className="text-gray-400 hover:text-orange-600"
                      title="Decline all submissions"
                    >
                      Decline
                    </button>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); onEdit(event) }}
                    className="text-gray-400 hover:text-blue-600"
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(event.id) }}
                    className="text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

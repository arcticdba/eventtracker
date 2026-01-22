import { useState, useEffect, useRef, useCallback } from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import { Event, Submission, EventState } from '../types'
import { computeEventState } from '../utils/computeEventState'
import { getOverlappingEvents } from '../utils/getOverlappingEvents'
import { formatDate } from '../utils/formatDate'
import { DateFormat } from '../api'

interface Props {
  events: Event[]
  submissions: Submission[]
  onEdit: (event: Event) => void
  onDelete: (id: string) => void
  onSelect: (event: Event) => void
  onDecline: (eventId: string) => void
  onToggleRemote: (eventId: string) => void
  onToggleMvpSubmission: (eventId: string) => void
  selectedEventId?: string
  filters: Set<EventState>
  onFiltersChange: (filters: Set<EventState>) => void
  futureOnly: boolean
  onFutureOnlyChange: (futureOnly: boolean) => void
  showMvpFeatures?: boolean
  mvpCompletedOnly: boolean
  onMvpCompletedOnlyChange: (value: boolean) => void
  notFullyBooked: boolean
  onNotFullyBookedChange: (value: boolean) => void
  onFilteredCountChange?: (filtered: number, total: number) => void
  dateFormat: DateFormat
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

export function EventList({ events, submissions, onEdit, onDelete, onSelect, onDecline, onToggleRemote, onToggleMvpSubmission, selectedEventId, filters, onFiltersChange, futureOnly, onFutureOnlyChange, showMvpFeatures = true, mvpCompletedOnly, onMvpCompletedOnlyChange, notFullyBooked, onNotFullyBookedChange, onFilteredCountChange, dateFormat }: Props) {
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

      // Always show selected events without MVP submission (only when MVP features enabled)
      const showDueToMvp = showMvpFeatures && !event.mvpSubmission && eventState === 'selected'

      // Filter by future/past (but always include non-MVP selected events)
      if (futureOnly && !showDueToMvp) {
        const endDate = new Date(event.dateEnd || event.dateStart)
        endDate.setHours(0, 0, 0, 0)
        if (endDate < today) return false
      }

      // Filter by MVP submission pending (only when MVP features enabled)
      // Only show selected events that don't have MVP submission completed
      if (showMvpFeatures && mvpCompletedOnly) {
        if (eventState !== 'selected' || event.mvpSubmission) {
          return false
        }
      }

      // Filter by not fully booked (in-person selected upcoming events without both travel and hotel)
      if (notFullyBooked) {
        const startDate = new Date(event.dateStart)
        startDate.setHours(0, 0, 0, 0)
        const isUpcoming = startDate > today
        const isInPerson = !event.remote
        const hasTravel = (event.travel?.length ?? 0) > 0
        const hasHotel = (event.hotels?.length ?? 0) > 0
        const isFullyBooked = hasTravel && hasHotel

        // Only show selected, in-person, upcoming events that are NOT fully booked
        if (eventState !== 'selected' || !isInPerson || !isUpcoming || isFullyBooked) {
          return false
        }
      }

      // Filter by state
      if (filters.size === 0) return true
      return filters.has(eventState)
    })
    .sort((a, b) => {
      // Sort by start date descending (latest first)
      return (b.dateStart || '').localeCompare(a.dateStart || '')
    })

  useEffect(() => {
    onFilteredCountChange?.(filteredEvents.length, events.length)
  }, [filteredEvents.length, events.length, onFilteredCountChange])

  const listRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (filteredEvents.length === 0) return

    const currentIndex = selectedEventId
      ? filteredEvents.findIndex(ev => ev.id === selectedEventId)
      : -1

    switch (e.key) {
      case 'ArrowDown':
      case 'j':
        e.preventDefault()
        const nextIndex = currentIndex < filteredEvents.length - 1 ? currentIndex + 1 : 0
        onSelect(filteredEvents[nextIndex])
        break
      case 'ArrowUp':
      case 'k':
        e.preventDefault()
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredEvents.length - 1
        onSelect(filteredEvents[prevIndex])
        break
      case 'Enter':
        e.preventDefault()
        if (currentIndex >= 0) {
          onEdit(filteredEvents[currentIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        listRef.current?.blur()
        break
    }
  }, [filteredEvents, selectedEventId, onSelect, onEdit])

  // Scroll selected event into view
  useEffect(() => {
    if (selectedEventId && listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-event-id="${selectedEventId}"]`)
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedEventId])

  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const moreFiltersRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreFiltersRef.current && !moreFiltersRef.current.contains(e.target as Node)) {
        setShowMoreFilters(false)
      }
    }
    if (showMoreFilters) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreFilters])

  const allSelected = allStates.every(s => filters.has(s))
  const selectAll = () => onFiltersChange(new Set(allStates))

  // Count active secondary filters
  const activeSecondaryFilters = [
    futureOnly,
    !filters.has('none'),
    showMvpFeatures && mvpCompletedOnly,
    notFullyBooked
  ].filter(Boolean).length

  const statePillStyles: Record<EventState, { active: string; inactive: string }> = {
    pending: { active: 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300', inactive: 'bg-gray-100 text-gray-500 hover:bg-gray-200' },
    selected: { active: 'bg-green-100 text-green-800 ring-1 ring-green-300', inactive: 'bg-gray-100 text-gray-500 hover:bg-gray-200' },
    rejected: { active: 'bg-red-100 text-red-800 ring-1 ring-red-300', inactive: 'bg-gray-100 text-gray-500 hover:bg-gray-200' },
    declined: { active: 'bg-orange-100 text-orange-800 ring-1 ring-orange-300', inactive: 'bg-gray-100 text-gray-500 hover:bg-gray-200' },
    none: { active: 'bg-gray-200 text-gray-800 ring-1 ring-gray-400', inactive: 'bg-gray-100 text-gray-500 hover:bg-gray-200' }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="pb-3 flex-shrink-0 bg-white px-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* All button */}
          <button
            onClick={selectAll}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
              allSelected
                ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-300'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            All
          </button>

          {/* State filter pills */}
          {allStates.filter(s => s !== 'none').map(state => (
            <button
              key={state}
              onClick={() => toggleFilter(state)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                filters.has(state) ? statePillStyles[state].active : statePillStyles[state].inactive
              }`}
            >
              {stateLabels[state]}
            </button>
          ))}

          {/* Divider */}
          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* More filters dropdown */}
          <div className="relative" ref={moreFiltersRef}>
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                activeSecondaryFilters > 0
                  ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              More
              {activeSecondaryFilters > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {activeSecondaryFilters}
                </span>
              )}
            </button>

            {showMoreFilters && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border p-2 z-20 min-w-[180px]">
                <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={futureOnly}
                    onChange={() => onFutureOnlyChange(!futureOnly)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Future only</span>
                </label>
                <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.has('none')}
                    onChange={() => toggleFilter('none')}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">No submissions</span>
                </label>
                {showMvpFeatures && (
                  <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mvpCompletedOnly}
                      onChange={() => onMvpCompletedOnlyChange(!mvpCompletedOnly)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">MVP pending</span>
                  </label>
                )}
                <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notFullyBooked}
                    onChange={() => onNotFullyBookedChange(!notFullyBooked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Not fully booked</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        ref={listRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex-1 overflow-y-auto space-y-3 outline-none p-1"
      >
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
          const overlappingEvents = getOverlappingEvents(event, events)

          return (
            <ContextMenu.Root key={event.id}>
              <ContextMenu.Trigger asChild>
                <div
                  data-event-id={event.id}
                  onClick={() => onSelect(event)}
                  onDoubleClick={() => onEdit(event)}
                  className={`p-3 border rounded-lg cursor-pointer transition ${
                    showMvpFeatures && !event.mvpSubmission && state === 'selected'
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
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatLocation(event.country, event.city, false)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(event.dateStart, dateFormat)}{event.dateEnd && event.dateEnd !== event.dateStart ? ` - ${formatDate(event.dateEnd, dateFormat)}` : ''}
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
                      className={event.travel?.length ? 'text-green-600' : 'text-gray-300'}
                      title={event.travel?.length ? `${event.travel.length} travel booking(s)` : 'No travel booked'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </span>
                    <span
                      className={event.hotels?.length ? 'text-green-600' : 'text-gray-300'}
                      title={event.hotels?.length ? `${event.hotels.length} hotel booking(s)` : 'No hotel booked'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </span>
                  </div>
                  {showMvpFeatures && !event.mvpSubmission && state === 'selected' && (
                    <div className="mt-1">
                      <span className="px-1.5 py-0.5 text-xs rounded bg-red-600 text-white font-medium">
                        MVP submission pending
                      </span>
                    </div>
                  )}
                  {overlappingEvents.length > 0 && (
                    <div className="mt-1">
                      <span
                        className="px-1.5 py-0.5 text-xs rounded bg-amber-100 text-amber-800 font-medium"
                        title={overlappingEvents.map(e => `${e.name}${e.city ? ` (${e.city})` : ''}`).join('\n')}
                      >
                        {overlappingEvents.length === 1
                          ? `Overlaps with ${overlappingEvents[0].name}${overlappingEvents[0].city ? ` (${overlappingEvents[0].city})` : ''}`
                          : `Overlaps with ${overlappingEvents.length} events`}
                      </span>
                    </div>
                  )}
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
              </ContextMenu.Trigger>
              <ContextMenu.Portal>
                <ContextMenu.Content className="min-w-[160px] bg-white rounded-md shadow-lg border p-1 z-50">
                  <ContextMenu.CheckboxItem
                    className="flex items-center px-2 py-1.5 text-sm rounded hover:bg-gray-100 cursor-pointer outline-none"
                    checked={event.remote}
                    onCheckedChange={() => onToggleRemote(event.id)}
                  >
                    <ContextMenu.ItemIndicator className="w-4 mr-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </ContextMenu.ItemIndicator>
                    <span className={event.remote ? '' : 'ml-6'}>Remote event</span>
                  </ContextMenu.CheckboxItem>
                  {showMvpFeatures && (
                    <ContextMenu.CheckboxItem
                      className="flex items-center px-2 py-1.5 text-sm rounded hover:bg-gray-100 cursor-pointer outline-none"
                      checked={event.mvpSubmission}
                      onCheckedChange={() => onToggleMvpSubmission(event.id)}
                    >
                      <ContextMenu.ItemIndicator className="w-4 mr-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </ContextMenu.ItemIndicator>
                      <span className={event.mvpSubmission ? '' : 'ml-6'}>MVP submission completed</span>
                    </ContextMenu.CheckboxItem>
                  )}
                </ContextMenu.Content>
              </ContextMenu.Portal>
            </ContextMenu.Root>
          )
        })
        )}
      </div>
    </div>
  )
}

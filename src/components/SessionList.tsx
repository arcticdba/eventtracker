import { useState } from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import { Session, Event, Submission, SubmissionState } from '../types'

interface Props {
  sessions: Session[]
  events: Event[]
  submissions: Submission[]
  onEdit: (session: Session) => void
  onDelete: (id: string) => void
  onToggleRetired: (sessionId: string) => void
  showActive: boolean
  onShowActiveChange: (showActive: boolean) => void
  showRetired: boolean
  onShowRetiredChange: (showRetired: boolean) => void
}

const stateColors: Record<SubmissionState, string> = {
  submitted: 'bg-blue-100 text-blue-700',
  selected: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  declined: 'bg-orange-100 text-orange-700'
}

const levelColors: Record<string, string> = {
  '100': 'bg-green-100 text-green-700',
  '200': 'bg-teal-100 text-teal-700',
  '300': 'bg-yellow-100 text-yellow-700',
  '400': 'bg-orange-100 text-orange-700',
  '500': 'bg-red-100 text-red-700'
}

const sessionTypeColors: Record<string, string> = {
  'Session (45-60 min)': 'bg-blue-100 text-blue-700',
  'Workshop (full day)': 'bg-indigo-100 text-indigo-700',
  'Short session (20 min)': 'bg-cyan-100 text-cyan-700',
  'Lightning Talk (5-10 min)': 'bg-pink-100 text-pink-700',
  'Keynote': 'bg-amber-100 text-amber-700'
}

const sessionTypeShortLabels: Record<string, string> = {
  'Session (45-60 min)': 'Session',
  'Workshop (full day)': 'Workshop',
  'Short session (20 min)': '20 min',
  'Lightning Talk (5-10 min)': 'Lightning',
  'Keynote': 'Keynote'
}

const LEVELS = ['100', '200', '300', '400', '500']
const SESSION_TYPES = ['Session (45-60 min)', 'Workshop (full day)', 'Short session (20 min)', 'Lightning Talk (5-10 min)', 'Keynote']

export function SessionList({ sessions, events, submissions, onEdit, onDelete, onToggleRetired, showActive, onShowActiveChange, showRetired, onShowRetiredChange }: Props) {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set(LEVELS))
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(SESSION_TYPES))

  const toggleExpanded = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedSessions(newExpanded)
  }

  const toggleLevel = (level: string) => {
    const newLevels = new Set(selectedLevels)
    if (newLevels.has(level)) {
      newLevels.delete(level)
    } else {
      newLevels.add(level)
    }
    setSelectedLevels(newLevels)
  }

  const toggleType = (type: string) => {
    const newTypes = new Set(selectedTypes)
    if (newTypes.has(type)) {
      newTypes.delete(type)
    } else {
      newTypes.add(type)
    }
    setSelectedTypes(newTypes)
  }

  const filteredSessions = sessions
    .filter(session => {
      // Active/Retired filter
      if (!showActive && !showRetired) return true
      if (session.retired) {
        if (!showRetired) return false
      } else {
        if (!showActive) return false
      }

      // Level filter
      if (selectedLevels.size > 0 && selectedLevels.size < LEVELS.length) {
        if (!selectedLevels.has(session.level)) return false
      }

      // Session type filter
      if (selectedTypes.size > 0 && selectedTypes.size < SESSION_TYPES.length) {
        const sessionType = session.sessionType || 'Session (45-60 min)'
        if (!selectedTypes.has(sessionType)) return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesName = session.name.toLowerCase().includes(query)
        const matchesAlternate = session.alternateNames?.some(n => n.toLowerCase().includes(query))
        const matchesPrimaryTech = session.primaryTechnology?.toLowerCase().includes(query)
        const matchesAdditionalTech = session.additionalTechnology?.toLowerCase().includes(query)
        if (!matchesName && !matchesAlternate && !matchesPrimaryTech && !matchesAdditionalTech) {
          return false
        }
      }

      return true
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search sessions..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <span className="text-xs text-gray-400">
            ({filteredSessions.length} of {sessions.length})
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Status:</span>
          <button
            onClick={() => onShowActiveChange(!showActive)}
            className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
              showActive ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-50 text-gray-400 border-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => onShowRetiredChange(!showRetired)}
            className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
              showRetired ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-gray-50 text-gray-400 border-gray-200'
            }`}
          >
            Retired
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-500">Level:</span>
          {LEVELS.map(level => (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                selectedLevels.has(level) ? levelColors[level] + ' border-current' : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}
            >
              {level}
            </button>
          ))}
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-500">Type:</span>
          {SESSION_TYPES.map(type => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                selectedTypes.has(type) ? sessionTypeColors[type] + ' border-current' : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}
            >
              {sessionTypeShortLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {sessions.length === 0 ? (
        <p className="text-gray-500 text-sm">No sessions yet. Create one to get started.</p>
      ) : filteredSessions.length === 0 ? (
        <p className="text-gray-500 text-sm">No sessions match this filter.</p>
      ) : (
        filteredSessions.map(session => (
          <ContextMenu.Root key={session.id}>
            <ContextMenu.Trigger asChild>
              <div
                onDoubleClick={() => onEdit(session)}
                className="p-3 border rounded-lg cursor-pointer"
              >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{session.name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded ${levelColors[session.level] || 'bg-gray-100'}`}>
                    {session.level}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded ${sessionTypeColors[session.sessionType || 'Session (45-60 min)'] || 'bg-gray-100 text-gray-700'}`}>
                    {sessionTypeShortLabels[session.sessionType || 'Session (45-60 min)'] || session.sessionType || 'Session'}
                  </span>
                  {session.retired && (
                    <span className="px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-600">
                      Retired
                    </span>
                  )}
                </div>
                {(() => {
                  const sessionSubmissions = submissions.filter(s => s.sessionId === session.id)
                  if (sessionSubmissions.length === 0) return null

                  const counts = {
                    submitted: sessionSubmissions.filter(s => s.state === 'submitted').length,
                    selected: sessionSubmissions.filter(s => s.state === 'selected').length,
                    rejected: sessionSubmissions.filter(s => s.state === 'rejected').length,
                    declined: sessionSubmissions.filter(s => s.state === 'declined').length
                  }

                  const isExpanded = expandedSessions.has(session.id)

                  return (
                    <div className="mt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpanded(session.id) }}
                        className="flex flex-wrap items-center gap-2 text-xs hover:bg-gray-100 rounded px-1 -mx-1"
                      >
                        <span className="text-gray-500">
                          {isExpanded ? '▼' : '▶'} {sessionSubmissions.length} event{sessionSubmissions.length !== 1 ? 's' : ''}:
                        </span>
                        {counts.selected > 0 && (
                          <span className={`px-1.5 py-0.5 rounded ${stateColors.selected}`}>
                            {counts.selected} selected
                          </span>
                        )}
                        {counts.submitted > 0 && (
                          <span className={`px-1.5 py-0.5 rounded ${stateColors.submitted}`}>
                            {counts.submitted} pending
                          </span>
                        )}
                        {counts.rejected > 0 && (
                          <span className={`px-1.5 py-0.5 rounded ${stateColors.rejected}`}>
                            {counts.rejected} rejected
                          </span>
                        )}
                        {counts.declined > 0 && (
                          <span className={`px-1.5 py-0.5 rounded ${stateColors.declined}`}>
                            {counts.declined} declined
                          </span>
                        )}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 ml-4 space-y-1">
                          {sessionSubmissions.map(sub => {
                            const event = events.find(e => e.id === sub.eventId)
                            if (!event) return null
                            const isAlternateName = sub.nameUsed && sub.nameUsed !== session.name
                            return (
                              <div key={sub.id} className="flex items-center gap-2 text-xs">
                                <span className={`px-1.5 py-0.5 rounded ${stateColors[sub.state]}`}>
                                  {sub.state}
                                </span>
                                <span className="text-gray-700">{event.name}</span>
                                <span className="text-gray-400">
                                  {event.city}{event.city && event.country ? ', ' : ''}{event.country}
                                </span>
                                {isAlternateName && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                                    as "{sub.nameUsed}"
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const hasSubmissions = submissions.some(s => s.sessionId === session.id)
                  return (
                    <>
                      <button
                        onClick={() => onEdit(session)}
                        className="p-1 text-gray-400 hover:text-blue-600 text-sm"
                      >
                        Edit
                      </button>
                      {!hasSubmissions && (
                        <button
                          onClick={() => onDelete(session.id)}
                          className="p-1 text-gray-400 hover:text-red-600 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
              </div>
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
              <ContextMenu.Content className="min-w-[140px] bg-white rounded-md shadow-lg border p-1 z-50">
                <ContextMenu.CheckboxItem
                  className="flex items-center px-2 py-1.5 text-sm rounded hover:bg-gray-100 cursor-pointer outline-none"
                  checked={session.retired}
                  onCheckedChange={() => onToggleRetired(session.id)}
                >
                  <ContextMenu.ItemIndicator className="w-4 mr-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </ContextMenu.ItemIndicator>
                  <span className={session.retired ? '' : 'ml-6'}>Retired</span>
                </ContextMenu.CheckboxItem>
              </ContextMenu.Content>
            </ContextMenu.Portal>
          </ContextMenu.Root>
        ))
      )}
    </div>
  )
}

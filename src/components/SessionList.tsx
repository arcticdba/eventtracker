import { useState } from 'react'
import { Session, Event, Submission, SubmissionState } from '../types'

interface Props {
  sessions: Session[]
  events: Event[]
  submissions: Submission[]
  onEdit: (session: Session) => void
  onDelete: (id: string) => void
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

export function SessionList({ sessions, events, submissions, onEdit, onDelete, showActive, onShowActiveChange, showRetired, onShowRetiredChange }: Props) {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

  const toggleExpanded = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedSessions(newExpanded)
  }

  const filteredSessions = sessions.filter(session => {
    if (!showActive && !showRetired) return true
    if (session.retired) return showRetired
    return showActive
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Filter:</label>
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={showActive}
            onChange={e => onShowActiveChange(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span>Active</span>
        </label>
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={showRetired}
            onChange={e => onShowRetiredChange(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span>Retired</span>
        </label>
        <span className="text-xs text-gray-400">
          ({filteredSessions.length} of {sessions.length})
        </span>
      </div>

      {sessions.length === 0 ? (
        <p className="text-gray-500 text-sm">No sessions yet. Create one to get started.</p>
      ) : filteredSessions.length === 0 ? (
        <p className="text-gray-500 text-sm">No sessions match this filter.</p>
      ) : (
        filteredSessions.map(session => (
          <div
            key={session.id}
            onDoubleClick={() => onEdit(session)}
            className={`p-3 border rounded-lg cursor-pointer ${session.retired ? 'opacity-60' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{session.name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded ${levelColors[session.level] || 'bg-gray-100'}`}>
                    {session.level}
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
        ))
      )}
    </div>
  )
}

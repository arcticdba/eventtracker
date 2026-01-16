import { useState } from 'react'
import { Session, Submission } from '../types'

interface SessionSelection {
  sessionId: string
  nameUsed: string
}

interface Props {
  sessions: Session[]
  submissions: Submission[]
  eventId: string
  onAdd: (selections: SessionSelection[]) => void
  onClose: () => void
}

const levelColors: Record<string, string> = {
  '100': 'bg-green-100 text-green-700',
  '200': 'bg-teal-100 text-teal-700',
  '300': 'bg-yellow-100 text-yellow-700',
  '400': 'bg-orange-100 text-orange-700',
  '500': 'bg-red-100 text-red-700'
}

export function SessionPicker({ sessions, submissions, eventId, onAdd, onClose }: Props) {
  // Map of sessionId -> nameUsed (if selected)
  const [selections, setSelections] = useState<Map<string, string>>(new Map())

  // Filter out sessions already submitted to this event and retired sessions, sort alphabetically
  const availableSessions = sessions
    .filter(session => {
      if (session.retired) return false
      return !submissions.some(s => s.sessionId === session.id && s.eventId === eventId)
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const toggleSession = (session: Session) => {
    const newSelections = new Map(selections)
    if (newSelections.has(session.id)) {
      newSelections.delete(session.id)
    } else {
      // Default to primary name
      newSelections.set(session.id, session.name)
    }
    setSelections(newSelections)
  }

  const updateNameChoice = (sessionId: string, nameUsed: string) => {
    const newSelections = new Map(selections)
    newSelections.set(sessionId, nameUsed)
    setSelections(newSelections)
  }

  const handleAdd = () => {
    if (selections.size > 0) {
      const result: SessionSelection[] = Array.from(selections.entries()).map(
        ([sessionId, nameUsed]) => ({ sessionId, nameUsed })
      )
      onAdd(result)
    }
    onClose()
  }

  const getAllNames = (session: Session): string[] => {
    return [session.name, ...(session.alternateNames || [])]
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Add Sessions</h3>
        <span className="text-sm text-gray-500">{selections.size} selected</span>
      </div>

      {availableSessions.length === 0 ? (
        <p className="text-gray-500 text-sm">No available sessions to add.</p>
      ) : (
        <div className="space-y-2 max-h-[32rem] overflow-y-auto">
          {availableSessions.map(session => {
            const isSelected = selections.has(session.id)
            const allNames = getAllNames(session)
            const hasAlternateNames = allNames.length > 1

            return (
              <div
                key={session.id}
                className={`p-2 rounded ${
                  isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSession(session)}
                    className="mt-1 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{session.name}</span>
                      <span className={`px-1.5 py-0.5 text-xs rounded ${levelColors[session.level] || 'bg-gray-100'}`}>
                        {session.level}
                      </span>
                      {hasAlternateNames && (
                        <span className="px-1.5 py-0.5 text-xs rounded bg-purple-100 text-purple-700">
                          {allNames.length} names
                        </span>
                      )}
                    </div>
                  </div>
                </label>

                {isSelected && hasAlternateNames && (
                  <div className="ml-8 mt-2">
                    <label className="text-xs text-gray-600">Submit as:</label>
                    <select
                      value={selections.get(session.id) || session.name}
                      onChange={e => updateNameChoice(session.id, e.target.value)}
                      className="ml-2 text-sm rounded border-gray-300 py-1 px-2"
                    >
                      {allNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t">
        <button
          onClick={handleAdd}
          disabled={selections.size === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add {selections.size > 0 ? `(${selections.size})` : ''}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

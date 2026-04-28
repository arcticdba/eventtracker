import { useState, useMemo } from 'react'
import { Session, Submission } from '../types'

interface SessionSelection {
  sessionId: string
  nameUsed: string
  newAlternateName?: string  // If set, this name should be added to the session's alternateNames
  notes?: string             // Optional notes for this submission
}

interface Props {
  sessions: Session[]
  submissions: Submission[]
  eventId: string
  onAdd: (selections: SessionSelection[]) => void
  onClose: () => void
}

const LEVELS = ['100', '200', '300', '400', '500']
const SESSION_TYPES = ['Session (45-60 min)', 'Workshop (full day)', 'Short session (20 min)', 'Lightning Talk (5-10 min)', 'Keynote']

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

export function SessionPicker({ sessions, submissions, eventId, onAdd, onClose }: Props) {
  const [selections, setSelections] = useState<Map<string, string>>(new Map())
  const [newNames, setNewNames] = useState<Map<string, string[]>>(new Map())
  const [notes, setNotes] = useState<Map<string, string>>(new Map())
  const [newNameInputs, setNewNameInputs] = useState<Map<string, string>>(new Map())
  const [showingNewNameInput, setShowingNewNameInput] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set(LEVELS))
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(SESSION_TYPES))

  const toggleLevel = (level: string) => {
    const next = new Set(selectedLevels)
    next.has(level) ? next.delete(level) : next.add(level)
    setSelectedLevels(next)
  }

  const toggleType = (type: string) => {
    const next = new Set(selectedTypes)
    next.has(type) ? next.delete(type) : next.add(type)
    setSelectedTypes(next)
  }

  const availableSessions = useMemo(() => sessions
    .filter(session => {
      if (session.retired) return false
      if (submissions.some(s => s.sessionId === session.id && s.eventId === eventId)) return false
      if (selectedLevels.size < LEVELS.length && !selectedLevels.has(session.level)) return false
      const type = session.sessionType || 'Session (45-60 min)'
      if (selectedTypes.size < SESSION_TYPES.length && !selectedTypes.has(type)) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        if (
          !session.name.toLowerCase().includes(q) &&
          !session.alternateNames?.some(n => n.toLowerCase().includes(q)) &&
          !session.primaryTechnology?.toLowerCase().includes(q) &&
          !session.additionalTechnology?.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
    .sort((a, b) => a.name.localeCompare(b.name)),
  [sessions, submissions, eventId, searchQuery, selectedLevels, selectedTypes])

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

  const toggleNewNameInput = (sessionId: string) => {
    const newShowing = new Set(showingNewNameInput)
    if (newShowing.has(sessionId)) {
      newShowing.delete(sessionId)
      // Clear the input when hiding
      const newInputs = new Map(newNameInputs)
      newInputs.delete(sessionId)
      setNewNameInputs(newInputs)
    } else {
      newShowing.add(sessionId)
    }
    setShowingNewNameInput(newShowing)
  }

  const updateNewNameInput = (sessionId: string, value: string) => {
    const newInputs = new Map(newNameInputs)
    newInputs.set(sessionId, value)
    setNewNameInputs(newInputs)
  }

  const addNewName = (sessionId: string) => {
    const inputValue = newNameInputs.get(sessionId)?.trim()
    if (!inputValue) return

    // Add to new names for this session
    const sessionNewNames = newNames.get(sessionId) || []
    if (!sessionNewNames.includes(inputValue)) {
      const updatedNewNames = new Map(newNames)
      updatedNewNames.set(sessionId, [...sessionNewNames, inputValue])
      setNewNames(updatedNewNames)
    }

    // Select this new name
    updateNameChoice(sessionId, inputValue)

    // Clear input and hide
    const newInputs = new Map(newNameInputs)
    newInputs.delete(sessionId)
    setNewNameInputs(newInputs)

    const newShowing = new Set(showingNewNameInput)
    newShowing.delete(sessionId)
    setShowingNewNameInput(newShowing)
  }

  const updateNotes = (sessionId: string, value: string) => {
    const newNotes = new Map(notes)
    newNotes.set(sessionId, value)
    setNotes(newNotes)
  }

  const handleAdd = () => {
    if (selections.size > 0) {
      const result: SessionSelection[] = Array.from(selections.entries()).map(
        ([sessionId, nameUsed]) => {
          const sessionNewNames = newNames.get(sessionId) || []
          const isNewName = sessionNewNames.includes(nameUsed)
          const sessionNotes = notes.get(sessionId)
          return {
            sessionId,
            nameUsed,
            newAlternateName: isNewName ? nameUsed : undefined,
            notes: sessionNotes || undefined
          }
        }
      )
      onAdd(result)
    }
    onClose()
  }

  const getAllNames = (session: Session): string[] => {
    const existingNames = [session.name, ...(session.alternateNames || [])]
    const sessionNewNames = newNames.get(session.id) || []
    return [...existingNames, ...sessionNewNames]
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Add Sessions</h3>
        <span className="text-sm text-gray-500">{selections.size} selected</span>
      </div>

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
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <span className="text-xs text-gray-400">({availableSessions.length} of {sessions.filter(s => !s.retired && !submissions.some(sub => sub.sessionId === s.id && sub.eventId === eventId)).length})</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Level:</span>
          {LEVELS.map(level => (
            <button
              key={level}
              type="button"
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
              type="button"
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

                {isSelected && (
                  <div className="ml-8 mt-2 space-y-2">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600">Submit as:</label>
                      <select
                        value={selections.get(session.id) || session.name}
                        onChange={e => updateNameChoice(session.id, e.target.value)}
                        className="block w-full text-sm rounded border-gray-300 py-1 px-2"
                      >
                        {allNames.map(name => {
                          const sessionNewNames = newNames.get(session.id) || []
                          const isNew = sessionNewNames.includes(name)
                          return (
                            <option key={name} value={name}>
                              {name}{isNew ? ' (new)' : ''}
                            </option>
                          )
                        })}
                      </select>
                      {!showingNewNameInput.has(session.id) && (
                        <button
                          type="button"
                          onClick={() => toggleNewNameInput(session.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          + Add new name
                        </button>
                      )}
                    </div>
                    {showingNewNameInput.has(session.id) && (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={newNameInputs.get(session.id) || ''}
                          onChange={e => updateNewNameInput(session.id, e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNewName(session.id) } }}
                          placeholder="Enter new name..."
                          className="block w-full text-sm rounded border-gray-300 py-1 px-2 border"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => addNewName(session.id)}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleNewNameInput(session.id)}
                            className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600">Notes:</label>
                      <textarea
                        value={notes.get(session.id) || ''}
                        onChange={e => updateNotes(session.id, e.target.value)}
                        placeholder="Add notes for this submission..."
                        className="block w-full text-sm rounded border-gray-300 py-1 px-2 border"
                        rows={2}
                      />
                    </div>
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

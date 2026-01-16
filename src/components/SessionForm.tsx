import { useState } from 'react'
import { Session } from '../types'

interface Props {
  session?: Session
  onSave: (data: Omit<Session, 'id'>) => void
  onCancel: () => void
}

export function SessionForm({ session, onSave, onCancel }: Props) {
  const [name, setName] = useState(session?.name || '')
  const [alternateNames, setAlternateNames] = useState<string[]>(session?.alternateNames || [])
  const [newAlternateName, setNewAlternateName] = useState('')
  const [level, setLevel] = useState(session?.level || '100')
  const [summary, setSummary] = useState(session?.summary || '')
  const [elevatorPitch, setElevatorPitch] = useState(session?.elevatorPitch || '')
  const [abstract, setAbstract] = useState(session?.abstract || '')
  const [goals, setGoals] = useState(session?.goals || '')
  const [retired, setRetired] = useState(session?.retired || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, alternateNames, level, abstract, summary, goals, elevatorPitch, retired })
  }

  const addAlternateName = () => {
    const trimmed = newAlternateName.trim()
    if (trimmed && !alternateNames.includes(trimmed)) {
      setAlternateNames([...alternateNames, trimmed])
      setNewAlternateName('')
    }
  }

  const removeAlternateName = (nameToRemove: string) => {
    setAlternateNames(alternateNames.filter(n => n !== nameToRemove))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Alternate Names</label>
        <div className="mt-1 space-y-2">
          {alternateNames.map((altName, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex-1 px-3 py-2 bg-white border rounded text-sm">{altName}</span>
              <button
                type="button"
                onClick={() => removeAlternateName(altName)}
                className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newAlternateName}
              onChange={e => setNewAlternateName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAlternateName() } }}
              className="flex-1 rounded border-gray-300 shadow-sm px-3 py-2 border text-sm"
              placeholder="Add alternate name..."
            />
            <button
              type="button"
              onClick={addAlternateName}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              Add
            </button>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Level</label>
        <select
          value={level}
          onChange={e => setLevel(e.target.value)}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
        >
          <option value="100">100</option>
          <option value="200">200</option>
          <option value="300">300</option>
          <option value="400">400</option>
          <option value="500">500</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Summary</label>
        <input
          type="text"
          value={summary}
          onChange={e => setSummary(e.target.value)}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          placeholder="Brief one-liner description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Elevator Pitch</label>
        <textarea
          value={elevatorPitch}
          onChange={e => setElevatorPitch(e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          placeholder="30-second pitch for this session"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Abstract</label>
        <textarea
          value={abstract}
          onChange={e => setAbstract(e.target.value)}
          rows={4}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          placeholder="Full session description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Goals</label>
        <textarea
          value={goals}
          onChange={e => setGoals(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          placeholder="What attendees will learn or achieve"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="retired"
          checked={retired}
          onChange={e => setRetired(e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="retired" className="text-sm text-gray-700">Retired</label>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

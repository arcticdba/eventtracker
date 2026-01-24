import { useState, useEffect } from 'react'
import { Session, TargetAudience, SessionType } from '../types'

const TARGET_AUDIENCES: TargetAudience[] = [
  'Developer',
  'IT Pro',
  'Business Decision Maker',
  'Technical Decision Maker',
  'Student',
  'Other'
]

const SESSION_TYPES: SessionType[] = [
  'Session (45-60 min)',
  'Workshop (full day)',
  'Short session (20 min)',
  'Lightning Talk (5-10 min)',
  'Keynote'
]

interface Props {
  session?: Session
  onSave: (data: Omit<Session, 'id'>) => void
  onCancel: () => void
}

export function SessionForm({ session, onSave, onCancel }: Props) {
  const [name, setName] = useState(session?.name || '')
  const [alternateNames, setAlternateNames] = useState<string[]>(session?.alternateNames || [])
  const [newAlternateName, setNewAlternateName] = useState('')
  const [sessionType, setSessionType] = useState<SessionType>(session?.sessionType || 'Session (45-60 min)')
  const [level, setLevel] = useState(session?.level || '100')
  const [summary, setSummary] = useState(session?.summary || '')
  const [elevatorPitch, setElevatorPitch] = useState(session?.elevatorPitch || '')
  const [abstract, setAbstract] = useState(session?.abstract || '')
  const [goals, setGoals] = useState(session?.goals || '')
  const [retired, setRetired] = useState(session?.retired || false)
  const [materialsUrl, setMaterialsUrl] = useState(session?.materialsUrl || '')
  const [targetAudience, setTargetAudience] = useState<TargetAudience[]>(session?.targetAudience || [])
  const [primaryTechnology, setPrimaryTechnology] = useState(session?.primaryTechnology || '')
  const [additionalTechnology, setAdditionalTechnology] = useState(session?.additionalTechnology || '')
  const [equipmentNotes, setEquipmentNotes] = useState(session?.equipmentNotes || '')

  // Handle Escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      alternateNames,
      sessionType,
      level,
      abstract,
      summary,
      goals,
      elevatorPitch,
      retired,
      materialsUrl,
      targetAudience,
      primaryTechnology,
      additionalTechnology,
      equipmentNotes
    })
  }

  const toggleAudience = (audience: TargetAudience) => {
    if (targetAudience.includes(audience)) {
      setTargetAudience(targetAudience.filter(a => a !== audience))
    } else {
      setTargetAudience([...targetAudience, audience])
    }
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
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={80}
            size={80}
            className="mt-1 block rounded border-gray-300 shadow-sm px-3 py-2 border"
            required
          />
        </div>
        <div className="w-24">
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
      </div>
      <div className="flex gap-4 items-start">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Alternate Names</label>
          <div className="mt-1 space-y-2">
            {alternateNames.map((altName, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="px-3 py-2 bg-white border rounded" style={{ width: '80ch' }}>{altName}</span>
                <button
                  type="button"
                  onClick={() => removeAlternateName(altName)}
                  className="px-2 py-1 text-red-600 hover:text-red-800"
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
                maxLength={80}
                size={80}
                className="rounded border-gray-300 shadow-sm px-3 py-2 border"
                placeholder="Add alternate name..."
              />
              <button
                type="button"
                onClick={addAlternateName}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Add
              </button>
            </div>
          </div>
        </div>
        <div className="w-60">
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            value={sessionType}
            onChange={e => setSessionType(e.target.value as SessionType)}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          >
            {SESSION_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Summary</label>
        <input
          type="text"
          value={summary}
          onChange={e => setSummary(e.target.value)}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          placeholder="Brief description, 150 words max"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Abstract</label>
        <textarea
          value={abstract}
          onChange={e => setAbstract(e.target.value)}
          rows={10}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          placeholder="Full session description"
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
        <label className="block text-sm font-medium text-gray-700">Goals</label>
        <textarea
          value={goals}
          onChange={e => setGoals(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          placeholder="What attendees will learn or achieve"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Materials URL</label>
        <input
          type="url"
          value={materialsUrl}
          onChange={e => setMaterialsUrl(e.target.value)}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          placeholder="Link to slides, repo, or resources"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
        <div className="flex flex-wrap gap-3">
          {TARGET_AUDIENCES.map(audience => (
            <label key={audience} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={targetAudience.includes(audience)}
                onChange={() => toggleAudience(audience)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">{audience}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Primary Technology</label>
          <input
            type="text"
            value={primaryTechnology}
            onChange={e => setPrimaryTechnology(e.target.value)}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
            placeholder="e.g., Azure, .NET, SQL Server"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Additional Technology</label>
          <input
            type="text"
            value={additionalTechnology}
            onChange={e => setAdditionalTechnology(e.target.value)}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
            placeholder="e.g., Docker, Kubernetes"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Equipment Notes</label>
        <textarea
          value={equipmentNotes}
          onChange={e => setEquipmentNotes(e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          placeholder="Special equipment requirements (e.g., multiple monitors, specific hardware)"
        />
      </div>
      <div className={`flex items-center gap-2 px-3 py-2 rounded ${retired ? 'bg-orange-100 border border-orange-300' : ''}`}>
        <input
          type="checkbox"
          id="retired"
          checked={retired}
          onChange={e => setRetired(e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="retired" className={`text-sm ${retired ? 'text-orange-700 font-medium' : 'text-gray-700'}`}>Retired</label>
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

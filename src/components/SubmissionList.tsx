import { useState } from 'react'
import { Submission, Session, SubmissionState } from '../types'
import { StateSelector } from './StateSelector'

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

interface Props {
  submissions: Submission[]
  sessions: Session[]
  onUpdateState: (id: string, state: SubmissionState) => void
  onUpdateNotes: (id: string, notes: string) => void
  onDelete: (id: string) => void
}

export function SubmissionList({ submissions, sessions, onUpdateState, onUpdateNotes, onDelete }: Props) {
  const getSession = (sessionId: string) => sessions.find(s => s.id === sessionId)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState('')

  const startEditingNotes = (submission: Submission) => {
    setEditingNotes(submission.id)
    setNotesValue(submission.notes || '')
  }

  const saveNotes = (id: string) => {
    onUpdateNotes(id, notesValue)
    setEditingNotes(null)
    setNotesValue('')
  }

  const cancelEditingNotes = () => {
    setEditingNotes(null)
    setNotesValue('')
  }

  return (
    <div className="space-y-2">
      {submissions.length === 0 ? (
        <p className="text-gray-500 text-sm">No submissions for this event yet.</p>
      ) : (
        submissions.map(submission => {
          const session = getSession(submission.sessionId)
          if (!session) return null

          // Show nameUsed if it differs from primary name, or show the submission's nameUsed
          const displayName = submission.nameUsed || session.name
          const isAlternateName = submission.nameUsed && submission.nameUsed !== session.name
          const isEditingThis = editingNotes === submission.id

          return (
            <div key={submission.id} className="p-3 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{displayName}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 text-xs rounded ${levelColors[session.level] || 'bg-gray-100'}`}>
                      {session.level}
                    </span>
                    <span className={`px-1.5 py-0.5 text-xs rounded ${sessionTypeColors[session.sessionType || 'Session (45-60 min)'] || 'bg-gray-100 text-gray-700'}`}>
                      {sessionTypeShortLabels[session.sessionType || 'Session (45-60 min)'] || session.sessionType || 'Session'}
                    </span>
                    {isAlternateName && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                        alt name
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StateSelector
                    value={submission.state}
                    onChange={state => onUpdateState(submission.id, state)}
                  />
                  <button
                    onClick={() => onDelete(submission.id)}
                    className="text-gray-400 hover:text-red-600 text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {/* Notes section */}
              <div className="mt-2 pt-2 border-t border-gray-100">
                {isEditingThis ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesValue}
                      onChange={e => setNotesValue(e.target.value)}
                      className="w-full text-sm border rounded px-2 py-1 border-gray-300"
                      rows={2}
                      placeholder="Add notes..."
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveNotes(submission.id)}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditingNotes}
                        className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => startEditingNotes(submission)}
                    className="text-sm text-gray-500 cursor-pointer hover:text-gray-700"
                  >
                    {submission.notes ? (
                      <p className="whitespace-pre-wrap">{submission.notes}</p>
                    ) : (
                      <p className="text-gray-400 italic">Click to add notes...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

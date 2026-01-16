import { Submission, Session, SubmissionState } from '../types'
import { StateSelector } from './StateSelector'

interface Props {
  submissions: Submission[]
  sessions: Session[]
  onUpdateState: (id: string, state: SubmissionState) => void
  onDelete: (id: string) => void
}

export function SubmissionList({ submissions, sessions, onUpdateState, onDelete }: Props) {
  const getSession = (sessionId: string) => sessions.find(s => s.id === sessionId)

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

          return (
            <div key={submission.id} className="p-3 border rounded-lg flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">{displayName}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{session.level}</span>
                  {isAlternateName && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                      alt name
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StateSelector
                  value={submission.state}
                  onChange={state => onUpdateState(submission.id, state)}
                />
                <button
                  onClick={() => onDelete(submission.id)}
                  className="p-1 text-gray-400 hover:text-red-600 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

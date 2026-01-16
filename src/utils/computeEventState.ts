import { Submission, EventState } from '../types'

export function computeEventState(eventId: string, submissions: Submission[]): EventState {
  const eventSubmissions = submissions.filter(s => s.eventId === eventId)

  if (eventSubmissions.length === 0) {
    return 'none'
  }

  const allFinal = eventSubmissions.every(s =>
    s.state === 'selected' || s.state === 'rejected' || s.state === 'declined'
  )
  const hasSelected = eventSubmissions.some(s => s.state === 'selected')
  const allRejected = eventSubmissions.every(s => s.state === 'rejected')
  const allRejectedOrDeclined = eventSubmissions.every(s =>
    s.state === 'rejected' || s.state === 'declined'
  )

  // Selected: all submissions are final (selected/rejected/declined) and at least one is selected
  if (allFinal && hasSelected) {
    return 'selected'
  }

  // Rejected: all submissions are rejected
  if (allRejected) {
    return 'rejected'
  }

  // Declined: all submissions are rejected or declined (but not all rejected)
  if (allRejectedOrDeclined) {
    return 'declined'
  }

  // Otherwise, pending (has submitted sessions awaiting decision)
  return 'pending'
}

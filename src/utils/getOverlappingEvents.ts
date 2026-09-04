import { Event, Submission } from '../types'
import { computeEventState } from './computeEventState'
import { parseDateOnly } from './date'

export interface OverlappingEvent {
  id: string
  name: string
  city: string
}

export function groupSubmissionsByEvent(submissions: Submission[]): Map<string, Submission[]> {
  const grouped = new Map<string, Submission[]>()
  for (const submission of submissions) {
    const eventSubmissions = grouped.get(submission.eventId) ?? []
    eventSubmissions.push(submission)
    grouped.set(submission.eventId, eventSubmissions)
  }
  return grouped
}

/**
 * Find events that overlap with the given event's date range.
 * Only considers active events (pending or selected) as conflicts.
 */
export function getOverlappingEvents(
  event: Event,
  allEvents: Event[],
  submissions: Submission[],
  submissionsByEvent = groupSubmissionsByEvent(submissions)
): OverlappingEvent[] {
  const eventStart = parseDateOnly(event.dateStart)
  const eventEnd = parseDateOnly(event.dateEnd || event.dateStart)

  eventStart.setHours(0, 0, 0, 0)
  eventEnd.setHours(23, 59, 59, 999)

  return allEvents
    .filter(other => {
      if (other.id === event.id) return false

      const state = computeEventState(other.id, submissionsByEvent.get(other.id) ?? [])
      if (state === 'rejected' || state === 'declined' || state === 'cancelled') return false

      const otherStart = parseDateOnly(other.dateStart)
      const otherEnd = parseDateOnly(other.dateEnd || other.dateStart)

      otherStart.setHours(0, 0, 0, 0)
      otherEnd.setHours(23, 59, 59, 999)

      return eventStart <= otherEnd && eventEnd >= otherStart
    })
    .map(other => ({
      id: other.id,
      name: other.name,
      city: other.city
    }))
}

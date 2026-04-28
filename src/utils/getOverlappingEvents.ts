import { Event, Submission } from '../types'
import { computeEventState } from './computeEventState'

export interface OverlappingEvent {
  id: string
  name: string
  city: string
}

/**
 * Find events that overlap with the given event's date range.
 * Only considers active events (pending or selected) as conflicts.
 */
export function getOverlappingEvents(event: Event, allEvents: Event[], submissions: Submission[]): OverlappingEvent[] {
  const eventStart = new Date(event.dateStart)
  const eventEnd = new Date(event.dateEnd || event.dateStart)

  eventStart.setHours(0, 0, 0, 0)
  eventEnd.setHours(23, 59, 59, 999)

  // Build lookup map once — O(M) — so state checks inside the filter are O(1)
  const subsByEventId = new Map<string, Submission[]>()
  for (const sub of submissions) {
    const arr = subsByEventId.get(sub.eventId) ?? []
    arr.push(sub)
    subsByEventId.set(sub.eventId, arr)
  }

  return allEvents
    .filter(other => {
      if (other.id === event.id) return false

      const state = computeEventState(other.id, subsByEventId.get(other.id) ?? [])
      if (state === 'rejected' || state === 'declined' || state === 'cancelled') return false

      const otherStart = new Date(other.dateStart)
      const otherEnd = new Date(other.dateEnd || other.dateStart)

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

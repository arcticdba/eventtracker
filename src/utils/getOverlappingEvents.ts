import { Event } from '../types'

export interface OverlappingEvent {
  id: string
  name: string
  city: string
}

/**
 * Find events that overlap with the given event's date range.
 * Two events overlap if their date ranges intersect.
 */
export function getOverlappingEvents(event: Event, allEvents: Event[]): OverlappingEvent[] {
  const eventStart = new Date(event.dateStart)
  const eventEnd = new Date(event.dateEnd || event.dateStart)

  // Set times to start/end of day for accurate comparison
  eventStart.setHours(0, 0, 0, 0)
  eventEnd.setHours(23, 59, 59, 999)

  return allEvents
    .filter(other => {
      // Don't compare with self
      if (other.id === event.id) return false

      const otherStart = new Date(other.dateStart)
      const otherEnd = new Date(other.dateEnd || other.dateStart)

      otherStart.setHours(0, 0, 0, 0)
      otherEnd.setHours(23, 59, 59, 999)

      // Check for overlap: events overlap if one starts before the other ends
      // and ends after the other starts
      return eventStart <= otherEnd && eventEnd >= otherStart
    })
    .map(other => ({
      id: other.id,
      name: other.name,
      city: other.city
    }))
}

import { useEffect, useState } from 'react'
import * as api from '../api'
import { Event, EventSeries, Session, Submission } from '../types'

export function useEventTrackerData() {
  const [events, setEvents] = useState<Event[]>([])
  const [eventSeries, setEventSeries] = useState<EventSeries[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])

  useEffect(() => {
    let active = true
    Promise.all([api.fetchEvents(), api.fetchEventSeries(), api.fetchSessions(), api.fetchSubmissions()])
      .then(([loadedEvents, loadedEventSeries, loadedSessions, loadedSubmissions]) => {
        if (!active) return
        setEvents(loadedEvents)
        setEventSeries(loadedEventSeries)
        setSessions(loadedSessions)
        setSubmissions(loadedSubmissions)
      })
    return () => { active = false }
  }, [])

  return { events, setEvents, eventSeries, setEventSeries, sessions, setSessions, submissions, setSubmissions }
}

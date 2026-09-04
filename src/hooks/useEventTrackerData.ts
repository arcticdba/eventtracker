import { useEffect, useState } from 'react'
import * as api from '../api'
import { Event, Session, Submission } from '../types'

export function useEventTrackerData() {
  const [events, setEvents] = useState<Event[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])

  useEffect(() => {
    let active = true
    Promise.all([api.fetchEvents(), api.fetchSessions(), api.fetchSubmissions()])
      .then(([loadedEvents, loadedSessions, loadedSubmissions]) => {
        if (!active) return
        setEvents(loadedEvents)
        setSessions(loadedSessions)
        setSubmissions(loadedSubmissions)
      })
    return () => { active = false }
  }, [])

  return { events, setEvents, sessions, setSessions, submissions, setSubmissions }
}

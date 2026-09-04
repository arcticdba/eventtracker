import { describe, expect, it } from 'vitest'
import { Event, Submission } from '../types'
import { getOverlappingEvents, groupSubmissionsByEvent } from './getOverlappingEvents'

function event(id: string, start: string, end = start): Event {
  return {
    id, name: id, country: '', city: '', dateStart: start, dateEnd: end,
    remote: false, url: '', callForContentUrl: '', callForContentLastDate: '',
    loginTool: '', travel: [], hotels: [], eventHandlesTravel: false,
    eventHandlesHotel: false, mvpSubmission: false, notes: ''
  }
}

function submission(eventId: string, state: Submission['state']): Submission {
  return { id: eventId, eventId, sessionId: eventId, state, nameUsed: '', notes: '' }
}

describe('event overlap model', () => {
  it('groups submissions once for reuse', () => {
    const grouped = groupSubmissionsByEvent([submission('one', 'selected'), submission('one', 'rejected')])
    expect(grouped.get('one')).toHaveLength(2)
  })

  it('finds active overlaps and excludes finalized non-selected events', () => {
    const target = event('target', '2026-05-10', '2026-05-12')
    const active = event('active', '2026-05-12')
    const rejected = event('rejected', '2026-05-11')
    const separate = event('separate', '2026-05-13')
    const submissions = [submission('active', 'selected'), submission('rejected', 'rejected')]

    expect(getOverlappingEvents(target, [target, active, rejected, separate], submissions).map(item => item.id)).toEqual(['active'])
  })
})

import { describe, expect, it } from 'vitest'
import { Submission, SubmissionState } from '../types'
import { computeEventState } from './computeEventState'

function submissions(...states: SubmissionState[]): Submission[] {
  return states.map((state, index) => ({
    id: String(index),
    eventId: 'event',
    sessionId: `session-${index}`,
    state,
    nameUsed: '',
    notes: ''
  }))
}

describe('computeEventState', () => {
  it('handles empty and pending events', () => {
    expect(computeEventState('event', [])).toBe('none')
    expect(computeEventState('event', submissions('submitted', 'selected'))).toBe('pending')
  })

  it('handles final outcomes', () => {
    expect(computeEventState('event', submissions('selected', 'rejected'))).toBe('selected')
    expect(computeEventState('event', submissions('rejected', 'rejected'))).toBe('rejected')
    expect(computeEventState('event', submissions('rejected', 'declined'))).toBe('declined')
    expect(computeEventState('event', submissions('cancelled'))).toBe('cancelled')
  })
})

import { describe, expect, it } from 'vitest'
import { extractSessionizeLocation } from './sessionizeParser'

describe('Sessionize location parser', () => {
  it.each([
    ['Oslo, Norway', { city: 'Oslo', country: 'Norway' }],
    ['Lingen, Germany', { city: 'Lingen', country: 'Germany' }]
  ])('handles an empty span before %s', (location, expected) => {
    const html = `<div>location</div><h2><span class="block"></span><span class="block">${location}</span></h2>`
    expect(extractSessionizeLocation(html)).toEqual(expected)
  })

  it('uses the last component as country for multi-part locations', () => {
    const html = '<div>location</div><h2><span>Venue</span><span>Atlanta, Georgia, United States</span></h2>'
    expect(extractSessionizeLocation(html)).toEqual({ city: 'Atlanta', country: 'United States' })
  })

  it('supports markup-free and entity-encoded locations', () => {
    expect(extractSessionizeLocation('<div>location</div><h2>Zürich, Switzerland</h2>'))
      .toEqual({ city: 'Zürich', country: 'Switzerland' })
    expect(extractSessionizeLocation('<div>location</div><h2><span>Rock &amp; Roll City, USA</span></h2>'))
      .toEqual({ city: 'Rock & Roll City', country: 'USA' })
  })
})

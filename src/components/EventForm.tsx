import { useState, useEffect, useMemo } from 'react'
import { Event, TravelBooking, HotelBooking, TravelType } from '../types'
import { DateFormat } from '../api'
import { v4 as uuidv4 } from 'uuid'
import { getOverlappingEvents } from '../utils/getOverlappingEvents'
import { getCountryFlagOrEmpty, normalizeCountryName } from '../utils/countryFlags'
import { DateInput } from './DateInput'

interface Props {
  event?: Event
  initialData?: Omit<Event, 'id'>
  allEvents: Event[]  // All events for overlap detection
  onSave: (data: Omit<Event, 'id'>) => void
  onCancel: () => void
  showMvpFeatures?: boolean
  dateFormat: DateFormat
}

const travelTypeLabels: Record<TravelType, string> = {
  flight: 'Flight',
  train: 'Train',
  bus: 'Bus',
  car: 'Car',
  other: 'Other'
}

export function EventForm({ event, initialData, allEvents, onSave, onCancel, showMvpFeatures = true, dateFormat }: Props) {
  // Use event first (for editing), then initialData (for import), then empty
  const source = event || initialData
  const [name, setName] = useState(source?.name || '')
  const [country, setCountry] = useState(source?.country || '')
  const [city, setCity] = useState(source?.city || '')
  const [dateStart, setDateStart] = useState(source?.dateStart || '')
  const [dateEnd, setDateEnd] = useState(source?.dateEnd || '')

  // Calculate overlapping events based on current date inputs
  const overlappingEvents = useMemo(() => {
    if (!dateStart) return []
    // Create a temporary event object for overlap detection
    const tempEvent: Event = {
      id: event?.id || 'temp-new-event',
      name: name || 'New Event',
      country,
      city,
      dateStart,
      dateEnd: dateEnd || dateStart,
      remote: false,
      url: '',
      callForContentUrl: '',
      callForContentLastDate: '',
      loginTool: '',
      travel: [],
      hotels: [],
      eventHandlesTravel: false,
      eventHandlesHotel: false,
      mvpSubmission: false,
      notes: ''
    }
    return getOverlappingEvents(tempEvent, allEvents)
  }, [dateStart, dateEnd, event?.id, allEvents, name, country, city])
  const [remote, setRemote] = useState(source?.remote || false)
  const [url, setUrl] = useState(source?.url || '')
  const [callForContentUrl, setCallForContentUrl] = useState(source?.callForContentUrl || '')
  const [callForContentLastDate, setCallForContentLastDate] = useState(source?.callForContentLastDate || '')
  const [loginTool, setLoginTool] = useState(source?.loginTool || '')
  const [travel, setTravel] = useState<TravelBooking[]>(source?.travel || [])
  const [hotels, setHotels] = useState<HotelBooking[]>(source?.hotels || [])
  const [eventHandlesTravel, setEventHandlesTravel] = useState(source?.eventHandlesTravel || false)
  const [eventHandlesHotel, setEventHandlesHotel] = useState(source?.eventHandlesHotel || false)
  // Default mvpSubmission to true when MVP features are hidden, so events created
  // during that time won't suddenly need MVP submission when re-enabled
  const [mvpSubmission, setMvpSubmission] = useState(source?.mvpSubmission ?? !showMvpFeatures)
  const [notes, setNotes] = useState(source?.notes || '')

  // Add travel form state
  const [showAddTravel, setShowAddTravel] = useState(false)
  const [newTravelType, setNewTravelType] = useState<TravelType>('flight')
  const [newTravelRef, setNewTravelRef] = useState('')
  const [editingTravelId, setEditingTravelId] = useState<string | null>(null)
  const [editTravelType, setEditTravelType] = useState<TravelType>('flight')
  const [editTravelRef, setEditTravelRef] = useState('')

  // Add hotel form state
  const [showAddHotel, setShowAddHotel] = useState(false)
  const [newHotelName, setNewHotelName] = useState('')
  const [newHotelRef, setNewHotelRef] = useState('')
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null)
  const [editHotelName, setEditHotelName] = useState('')
  const [editHotelRef, setEditHotelRef] = useState('')

  // Update form when initialData changes (e.g., after import while form is open)
  useEffect(() => {
    if (initialData && !event) {
      setName(initialData.name || '')
      setCountry(initialData.country || '')
      setCity(initialData.city || '')
      setDateStart(initialData.dateStart || '')
      setDateEnd(initialData.dateEnd || '')
      setRemote(initialData.remote || false)
      setCallForContentUrl(initialData.callForContentUrl || '')
      setCallForContentLastDate(initialData.callForContentLastDate || '')
      setLoginTool(initialData.loginTool || '')
      setTravel(initialData.travel || [])
      setHotels(initialData.hotels || [])
      setEventHandlesTravel(initialData.eventHandlesTravel || false)
      setEventHandlesHotel(initialData.eventHandlesHotel || false)
      setMvpSubmission(initialData.mvpSubmission ?? !showMvpFeatures)
      setNotes(initialData.notes || '')
    }
  }, [initialData, event, showMvpFeatures])

  // Handle Escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const addTravel = () => {
    if (!newTravelRef.trim()) return
    setTravel([...travel, { id: uuidv4(), type: newTravelType, reference: newTravelRef.trim() }])
    setNewTravelType('flight')
    setNewTravelRef('')
    setShowAddTravel(false)
  }

  const removeTravel = (id: string) => {
    setTravel(travel.filter(t => t.id !== id))
  }

  const startEditTravel = (t: TravelBooking) => {
    setEditingTravelId(t.id)
    setEditTravelType(t.type)
    setEditTravelRef(t.reference)
  }

  const saveEditTravel = () => {
    if (!editTravelRef.trim() || !editingTravelId) return
    setTravel(travel.map(t => t.id === editingTravelId ? { ...t, type: editTravelType, reference: editTravelRef.trim() } : t))
    setEditingTravelId(null)
  }

  const cancelEditTravel = () => {
    setEditingTravelId(null)
  }

  const addHotel = () => {
    if (!newHotelName.trim()) return
    setHotels([...hotels, { id: uuidv4(), name: newHotelName.trim(), reference: newHotelRef.trim() }])
    setNewHotelName('')
    setNewHotelRef('')
    setShowAddHotel(false)
  }

  const removeHotel = (id: string) => {
    setHotels(hotels.filter(h => h.id !== id))
  }

  const startEditHotel = (h: HotelBooking) => {
    setEditingHotelId(h.id)
    setEditHotelName(h.name)
    setEditHotelRef(h.reference)
  }

  const saveEditHotel = () => {
    if (!editHotelName.trim() || !editingHotelId) return
    setHotels(hotels.map(h => h.id === editingHotelId ? { ...h, name: editHotelName.trim(), reference: editHotelRef.trim() } : h))
    setEditingHotelId(null)
  }

  const cancelEditHotel = () => {
    setEditingHotelId(null)
  }

  const isUrl = (str: string) => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      country: normalizeCountryName(country),
      city,
      dateStart,
      dateEnd,
      remote,
      url,
      callForContentUrl,
      callForContentLastDate,
      loginTool,
      travel,
      hotels,
      eventHandlesTravel,
      eventHandlesHotel,
      mvpSubmission,
      notes
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-800">Event Details</h3>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
            required
          />
        </div>
        <div className="flex items-center gap-2 pb-2">
          <input
            type="checkbox"
            id="remote"
            checked={remote}
            onChange={e => setRemote(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="remote" className="text-sm text-gray-700">Remote event</label>
        </div>
      </div>
      <div className="flex gap-3 items-end">
        {!remote && <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
            />
            {getCountryFlagOrEmpty(country) && (
              <span className="text-2xl">{getCountryFlagOrEmpty(country)}</span>
            )}
          </div>
        </div>}
        {!remote && <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          />
        </div>}
        <div>
          <label className="block text-sm font-medium text-gray-700">Start</label>
          <DateInput
            value={dateStart}
            onChange={setDateStart}
            dateFormat={dateFormat}
            className="mt-1 block w-36 rounded border-gray-300 shadow-sm px-3 py-2 border"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End</label>
          <DateInput
            value={dateEnd}
            onChange={setDateEnd}
            dateFormat={dateFormat}
            className="mt-1 block w-36 rounded border-gray-300 shadow-sm px-3 py-2 border"
            required
          />
        </div>
      </div>
      {/* Overlap warning */}
      {overlappingEvents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 mt-0.5">⚠</span>
            <div>
              <p className="text-sm font-medium text-amber-800">Date conflict detected</p>
              <p className="text-sm text-amber-700">
                {overlappingEvents.length === 1
                  ? `Overlaps with ${overlappingEvents[0].name}${overlappingEvents[0].city ? ` (${overlappingEvents[0].city})` : ''}`
                  : `Overlaps with ${overlappingEvents.length} events:`}
              </p>
              {overlappingEvents.length > 1 && (
                <ul className="text-sm text-amber-700 mt-1 list-disc list-inside">
                  {overlappingEvents.map(e => (
                    <li key={e.id}>{e.name}{e.city ? ` (${e.city})` : ''}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">Event URL</label>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          placeholder="https://..."
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Call for Content URL</label>
          <input
            type="url"
            value={callForContentUrl}
            onChange={e => setCallForContentUrl(e.target.value)}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
            placeholder="https://..."
          />
        </div>
        <div className="w-36">
          <label className="block text-sm font-medium text-gray-700">Login Tool</label>
          <input
            type="text"
            value={loginTool}
            onChange={e => setLoginTool(e.target.value)}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
            placeholder="Sessionize"
          />
        </div>
        <div className="w-40">
          <label className="block text-sm font-medium text-gray-700">CfC Deadline</label>
          <DateInput
            value={callForContentLastDate}
            onChange={setCallForContentLastDate}
            dateFormat={dateFormat}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          placeholder="Any additional notes about this event..."
        />
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Event Logistics</h3>
        {showMvpFeatures && (
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="mvpSubmission"
              checked={mvpSubmission}
              onChange={e => setMvpSubmission(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="mvpSubmission" className="text-sm text-gray-700">MVP submission completed</label>
          </div>
        )}

        {/* Travel Bookings */}
        {!remote && <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">Travel</label>
          {!showAddTravel && (
            <button
              type="button"
              onClick={() => setShowAddTravel(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add travel
            </button>
          )}
        </div>
        {travel.length > 0 && (
          <div className="space-y-2 mb-2">
            {travel.map(t => (
              editingTravelId === t.id ? (
                <div key={t.id} className="flex gap-2 items-end bg-white p-2 rounded border">
                  <div>
                    <label className="block text-xs text-gray-500">Type</label>
                    <select
                      value={editTravelType}
                      onChange={e => setEditTravelType(e.target.value as TravelType)}
                      className="mt-1 rounded border-gray-300 shadow-sm px-2 py-1 border text-sm"
                    >
                      {Object.entries(travelTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500">Reference / URL</label>
                    <input
                      type="text"
                      value={editTravelRef}
                      onChange={e => setEditTravelRef(e.target.value)}
                      className="mt-1 w-full rounded border-gray-300 shadow-sm px-2 py-1 border text-sm"
                      placeholder="Booking ref or URL"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={saveEditTravel}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditTravel}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div key={t.id} className="flex items-center gap-2 text-sm bg-white p-2 rounded border">
                  <span className="font-medium text-gray-600">{travelTypeLabels[t.type]}</span>
                  <span className="text-gray-400">-</span>
                  {isUrl(t.reference) ? (
                    <a href={t.reference} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex-1">
                      {t.reference}
                    </a>
                  ) : (
                    <span className="text-gray-700 truncate flex-1">{t.reference}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => startEditTravel(t)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTravel(t.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )
            ))}
          </div>
        )}
        {showAddTravel && (
          <div className="flex gap-2 items-end bg-white p-2 rounded border">
            <div>
              <label className="block text-xs text-gray-500">Type</label>
              <select
                value={newTravelType}
                onChange={e => setNewTravelType(e.target.value as TravelType)}
                className="mt-1 rounded border-gray-300 shadow-sm px-2 py-1 border text-sm"
              >
                {Object.entries(travelTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500">Reference / URL</label>
              <input
                type="text"
                value={newTravelRef}
                onChange={e => setNewTravelRef(e.target.value)}
                className="mt-1 w-full rounded border-gray-300 shadow-sm px-2 py-1 border text-sm"
                placeholder="Booking ref or URL"
              />
            </div>
            <button
              type="button"
              onClick={addTravel}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowAddTravel(false); setNewTravelRef('') }}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        )}
        {travel.length === 0 && !showAddTravel && !eventHandlesTravel && (
          <p className="text-sm text-gray-400">No travel booked</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="eventHandlesTravel"
            checked={eventHandlesTravel}
            onChange={e => setEventHandlesTravel(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="eventHandlesTravel" className="text-sm text-gray-700">Event handles travel</label>
        </div>
        </div>}

        {/* Hotel Bookings */}
        {!remote && <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">Hotels</label>
          {!showAddHotel && (
            <button
              type="button"
              onClick={() => setShowAddHotel(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add hotel
            </button>
          )}
        </div>
        {hotels.length > 0 && (
          <div className="space-y-2 mb-2">
            {hotels.map(h => (
              editingHotelId === h.id ? (
                <div key={h.id} className="flex gap-2 items-end bg-white p-2 rounded border">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500">Hotel Name</label>
                    <input
                      type="text"
                      value={editHotelName}
                      onChange={e => setEditHotelName(e.target.value)}
                      className="mt-1 w-full rounded border-gray-300 shadow-sm px-2 py-1 border text-sm"
                      placeholder="Hotel name"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500">Reference / URL</label>
                    <input
                      type="text"
                      value={editHotelRef}
                      onChange={e => setEditHotelRef(e.target.value)}
                      className="mt-1 w-full rounded border-gray-300 shadow-sm px-2 py-1 border text-sm"
                      placeholder="Booking ref or URL (optional)"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={saveEditHotel}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditHotel}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div key={h.id} className="flex items-center gap-2 text-sm bg-white p-2 rounded border">
                  <span className="font-medium text-gray-700">{h.name}</span>
                  {h.reference && (
                    <>
                      <span className="text-gray-400">-</span>
                      {isUrl(h.reference) ? (
                        <a href={h.reference} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex-1">
                          {h.reference}
                        </a>
                      ) : (
                        <span className="text-gray-500 truncate flex-1">{h.reference}</span>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => startEditHotel(h)}
                    className="text-blue-500 hover:text-blue-700 ml-auto"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeHotel(h.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )
            ))}
          </div>
        )}
        {showAddHotel && (
          <div className="flex gap-2 items-end bg-white p-2 rounded border">
            <div className="flex-1">
              <label className="block text-xs text-gray-500">Hotel Name</label>
              <input
                type="text"
                value={newHotelName}
                onChange={e => setNewHotelName(e.target.value)}
                className="mt-1 w-full rounded border-gray-300 shadow-sm px-2 py-1 border text-sm"
                placeholder="Hotel name"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500">Reference / URL</label>
              <input
                type="text"
                value={newHotelRef}
                onChange={e => setNewHotelRef(e.target.value)}
                className="mt-1 w-full rounded border-gray-300 shadow-sm px-2 py-1 border text-sm"
                placeholder="Booking ref or URL (optional)"
              />
            </div>
            <button
              type="button"
              onClick={addHotel}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowAddHotel(false); setNewHotelName(''); setNewHotelRef('') }}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        )}
        {hotels.length === 0 && !showAddHotel && !eventHandlesHotel && (
          <p className="text-sm text-gray-400">No hotel booked</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="eventHandlesHotel"
            checked={eventHandlesHotel}
            onChange={e => setEventHandlesHotel(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="eventHandlesHotel" className="text-sm text-gray-700">Event handles hotel</label>
        </div>
        </div>}
      </div>

      <div className="flex gap-2 border-t pt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

import { useState, useEffect } from 'react'
import { Event, TravelBooking, HotelBooking, TravelType } from '../types'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  event?: Event
  initialData?: Omit<Event, 'id'>
  onSave: (data: Omit<Event, 'id'>) => void
  onCancel: () => void
}

const travelTypeLabels: Record<TravelType, string> = {
  flight: 'Flight',
  train: 'Train',
  bus: 'Bus',
  car: 'Car',
  other: 'Other'
}

export function EventForm({ event, initialData, onSave, onCancel }: Props) {
  // Use event first (for editing), then initialData (for import), then empty
  const source = event || initialData
  const [name, setName] = useState(source?.name || '')
  const [country, setCountry] = useState(source?.country || '')
  const [city, setCity] = useState(source?.city || '')
  const [dateStart, setDateStart] = useState(source?.dateStart || '')
  const [dateEnd, setDateEnd] = useState(source?.dateEnd || '')
  const [remote, setRemote] = useState(source?.remote || false)
  const [callForContentUrl, setCallForContentUrl] = useState(source?.callForContentUrl || '')
  const [callForContentLastDate, setCallForContentLastDate] = useState(source?.callForContentLastDate || '')
  const [loginTool, setLoginTool] = useState(source?.loginTool || '')
  const [travel, setTravel] = useState<TravelBooking[]>(source?.travel || [])
  const [hotels, setHotels] = useState<HotelBooking[]>(source?.hotels || [])
  const [mvpSubmission, setMvpSubmission] = useState(source?.mvpSubmission || false)

  // Add travel form state
  const [showAddTravel, setShowAddTravel] = useState(false)
  const [newTravelType, setNewTravelType] = useState<TravelType>('flight')
  const [newTravelRef, setNewTravelRef] = useState('')

  // Add hotel form state
  const [showAddHotel, setShowAddHotel] = useState(false)
  const [newHotelName, setNewHotelName] = useState('')
  const [newHotelRef, setNewHotelRef] = useState('')

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
      country,
      city,
      dateStart,
      dateEnd,
      remote,
      callForContentUrl,
      callForContentLastDate,
      loginTool,
      travel,
      hotels,
      mvpSubmission
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <input
            type="text"
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="remote"
            checked={remote}
            onChange={e => setRemote(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="remote" className="text-sm text-gray-700">Remote event</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="mvpSubmission"
            checked={mvpSubmission}
            onChange={e => setMvpSubmission(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="mvpSubmission" className="text-sm text-gray-700">MVP Submission</label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            value={dateStart}
            onChange={e => setDateStart(e.target.value)}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            value={dateEnd}
            onChange={e => setDateEnd(e.target.value)}
            min={dateStart}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Call for Content URL</label>
        <input
          type="url"
          value={callForContentUrl}
          onChange={e => setCallForContentUrl(e.target.value)}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Call for Content Last Date</label>
        <input
          type="date"
          value={callForContentLastDate}
          onChange={e => setCallForContentLastDate(e.target.value)}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Login Tool</label>
        <input
          type="text"
          value={loginTool}
          onChange={e => setLoginTool(e.target.value)}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border"
          placeholder="e.g., Sessionize, Papercall"
        />
      </div>

      {/* Travel Bookings */}
      <div className="border-t pt-4">
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
                  onClick={() => removeTravel(t.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
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
        {travel.length === 0 && !showAddTravel && (
          <p className="text-sm text-gray-400">No travel booked</p>
        )}
      </div>

      {/* Hotel Bookings */}
      <div className="border-t pt-4">
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
                  onClick={() => removeHotel(h.id)}
                  className="text-red-500 hover:text-red-700 ml-auto"
                >
                  Remove
                </button>
              </div>
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
        {hotels.length === 0 && !showAddHotel && (
          <p className="text-sm text-gray-400">No hotel booked</p>
        )}
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

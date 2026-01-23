export type SubmissionState = 'submitted' | 'selected' | 'rejected' | 'declined'

export type TravelType = 'flight' | 'train' | 'bus' | 'car' | 'other'

export interface TravelBooking {
  id: string
  type: TravelType
  reference: string
}

export interface HotelBooking {
  id: string
  name: string
  reference: string
}

export interface Event {
  id: string
  name: string
  country: string
  city: string
  dateStart: string
  dateEnd: string
  remote: boolean
  url: string
  callForContentUrl: string
  callForContentLastDate: string
  loginTool: string
  travel: TravelBooking[]
  hotels: HotelBooking[]
  mvpSubmission: boolean
  notes: string
}

export type TargetAudience = 'Developer' | 'IT Pro' | 'Business Decision Maker' | 'Technical Decision Maker' | 'Student' | 'Other'

export interface Session {
  id: string
  name: string
  alternateNames: string[]
  level: string
  abstract: string
  summary: string
  goals: string
  elevatorPitch: string
  retired: boolean
  materialsUrl: string
  targetAudience: TargetAudience[]
  primaryTechnology: string
  additionalTechnology: string
  equipmentNotes: string
}

export interface Submission {
  id: string
  sessionId: string
  eventId: string
  state: SubmissionState
  nameUsed: string
  notes: string
}

export type EventState = 'selected' | 'rejected' | 'declined' | 'pending' | 'none'

export type TourStatus = 'draft' | 'published'

export type TourRecord = {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  coverImageUrl: string
  description: string
  story: string
  itinerary: string
  travelDetails: string
  attendeeIds: string[]
  albumIds: string[]
  status: TourStatus
  legacyDateLabel?: string
  legacyImageKey?: string
  legacyAttendeeCount?: number
  legacyCostEstimate?: number
  recordedExpenseTotal?: number
  createdAt?: unknown
  updatedAt?: unknown
}

export type TourFriend = { id: string; name: string; nickname?: string }
export type TourAlbum = { id: string; title: string; tourId?: string }
export type TourExpense = { id: string; tourId: string; amount: number; title?: string; category?: string; paidBy?: string; date?: string }

export type AdminTourData = {
  tours: TourRecord[]
  friends: TourFriend[]
  albums: TourAlbum[]
  expenses: TourExpense[]
  mode: 'firebase' | 'demo'
}

export type LegacyTrip = {
  id: number | string
  title: string
  place: string
  date: string
  count: number
  color: string
  image: string
  description: string
  cost: number
}

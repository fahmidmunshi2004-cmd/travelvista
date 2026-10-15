import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'
import { firebaseConfigured, requireFirebaseApp } from './firebaseApp'
import type { AdminTourData, LegacyTrip, TourAlbum, TourExpense, TourFriend, TourRecord } from '../types/tour'

const readLocal = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function asTourRecord(value: Partial<TourRecord> & Record<string, unknown>, id: string): TourRecord {
  return {
    id,
    title: String(value.title ?? ''),
    destination: String(value.destination ?? value.place ?? ''),
    startDate: String(value.startDate ?? ''),
    endDate: String(value.endDate ?? ''),
    coverImageUrl: String(value.coverImageUrl ?? ''),
    description: String(value.description ?? ''),
    story: String(value.story ?? value.description ?? ''),
    itinerary: String(value.itinerary ?? ''),
    travelDetails: String(value.travelDetails ?? ''),
    attendeeIds: Array.isArray(value.attendeeIds) ? value.attendeeIds.map(String) : [],
    albumIds: Array.isArray(value.albumIds) ? value.albumIds.map(String) : [],
    status: value.status === 'draft' ? 'draft' : value.published === false ? 'draft' : 'published',
    legacyDateLabel: typeof value.legacyDateLabel === 'string' ? value.legacyDateLabel : undefined,
    legacyImageKey: typeof value.legacyImageKey === 'string' ? value.legacyImageKey : undefined,
    legacyAttendeeCount: Number(value.legacyAttendeeCount ?? value.count ?? 0) || 0,
    legacyCostEstimate: Number(value.legacyCostEstimate ?? value.cost ?? 0) || 0,
    recordedExpenseTotal: Number(value.recordedExpenseTotal ?? 0) || 0,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function fromLegacyTrip(trip: LegacyTrip): TourRecord {
  return asTourRecord({
    ...trip,
    id: String(trip.id),
    destination: trip.place,
    legacyDateLabel: trip.date,
    legacyImageKey: trip.image,
    legacyAttendeeCount: trip.count,
    legacyCostEstimate: trip.cost,
    story: trip.description,
    status: 'published',
  }, String(trip.id))
}

function getDemoData(legacyTrips: LegacyTrip[], fallbackFriends: TourFriend[]): AdminTourData {
  const storedTours = localStorage.getItem('tv-tours')
  const tours = storedTours
    ? readLocal<unknown[]>('tv-tours', []).map((item, index) => asTourRecord(item as Partial<TourRecord> & Record<string, unknown>, String((item as { id?: unknown }).id ?? index)))
    : legacyTrips.map(fromLegacyTrip)
  if (!storedTours) localStorage.setItem('tv-tours', JSON.stringify(tours))

  const localFriends = readLocal<TourFriend[]>('tv-friends', fallbackFriends)
  const localAlbums = readLocal<TourAlbum[]>('tv-albums', [])
  const oldExpenses = readLocal<Array<Record<string, unknown>>>('tv-expenses', [])
  const expenses: TourExpense[] = oldExpenses.map((item, index) => ({
    id: String(item.id ?? `local-${index}`),
    tourId: String(item.tourId ?? item.tripId ?? ''),
    amount: Number(item.amount) || 0,
    title: String(item.title ?? ''),
    category: String(item.category ?? ''),
    paidBy: String(item.paidBy ?? ''),
    date: String(item.date ?? ''),
  }))
  return { tours, friends: localFriends, albums: localAlbums, expenses, mode: 'demo' }
}

export async function loadAdminTourData(legacyTrips: LegacyTrip[], fallbackFriends: TourFriend[]): Promise<AdminTourData> {
  if (!firebaseConfigured) return getDemoData(legacyTrips, fallbackFriends)

  const db = getFirestore(requireFirebaseApp())
  const [tourDocs, friendDocs, albumDocs, expenseDocs] = await Promise.all([
    getDocs(collection(db, 'tours')),
    getDocs(collection(db, 'friends')),
    getDocs(collection(db, 'albums')),
    getDocs(collection(db, 'expenses')),
  ])

  const tours = tourDocs.docs.map((item) => asTourRecord(item.data() as Partial<TourRecord> & Record<string, unknown>, item.id))
  const friends: TourFriend[] = friendDocs.docs.map((item) => ({
    id: item.id,
    name: String(item.data().name ?? item.data().displayName ?? ''),
    nickname: typeof item.data().nickname === 'string' ? item.data().nickname : undefined,
  }))
  const albums: TourAlbum[] = albumDocs.docs.map((item) => ({
    id: item.id,
    title: String(item.data().title ?? item.data().name ?? ''),
    tourId: typeof item.data().tourId === 'string' ? item.data().tourId : undefined,
  }))
  const expenses: TourExpense[] = expenseDocs.docs.map((item) => ({
    id: item.id,
    tourId: String(item.data().tourId ?? item.data().tripId ?? ''),
    amount: Number(item.data().amount) || 0,
    title: typeof item.data().title === 'string' ? item.data().title : undefined,
    category: typeof item.data().category === 'string' ? item.data().category : undefined,
    paidBy: typeof item.data().paidBy === 'string' ? item.data().paidBy : undefined,
    date: typeof item.data().date === 'string' ? item.data().date : undefined,
  }))
  return { tours, friends, albums, expenses, mode: 'firebase' }
}

function persistDemoTours(tours: TourRecord[]) {
  localStorage.setItem('tv-tours', JSON.stringify(tours))
  const legacy = tours.filter((tour) => tour.status === 'published').map((tour) => ({
    id: Number(tour.id) || tour.id,
    title: tour.title,
    place: tour.destination,
    date: tour.legacyDateLabel || [tour.startDate, tour.endDate].filter(Boolean).join(' – '),
    count: tour.attendeeIds.length || tour.legacyAttendeeCount || 0,
    color: '#536b60',
    image: tour.legacyImageKey || 'sajek',
    description: tour.description,
    cost: tour.legacyCostEstimate || 0,
  }))
  localStorage.setItem('tv-trips', JSON.stringify(legacy))
  window.dispatchEvent(new Event('tv-tours-updated'))
}

export async function saveManagedTour(tour: TourRecord, currentTours: TourRecord[], mode: AdminTourData['mode']): Promise<TourRecord> {
  const { id, ...fields } = tour
  if (mode === 'demo') {
    const next = currentTours.some((item) => item.id === id)
      ? currentTours.map((item) => item.id === id ? tour : item)
      : [...currentTours, tour]
    persistDemoTours(next)
    return tour
  }

  const db = getFirestore(requireFirebaseApp())
  const payload = { ...fields, updatedAt: serverTimestamp() }
  if (currentTours.some((item) => item.id === id)) {
    await setDoc(doc(db, 'tours', id), payload, { merge: true })
  } else {
    const created = await addDoc(collection(db, 'tours'), { ...payload, createdAt: serverTimestamp() })
    return { ...tour, id: created.id }
  }
  return tour
}

export async function deleteManagedTour(tourId: string, currentTours: TourRecord[], mode: AdminTourData['mode']): Promise<void> {
  if (mode === 'demo') {
    persistDemoTours(currentTours.filter((tour) => tour.id !== tourId))
    return
  }
  await deleteDoc(doc(getFirestore(requireFirebaseApp()), 'tours', tourId))
}

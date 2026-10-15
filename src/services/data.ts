import {
  addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where,
  type DocumentData,
} from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { requireFirebaseApp } from './firebaseApp'

export type ContactMessage = { name: string; email: string; subject: string; message: string }
export type TourRecord = { title: string; slug: string; destination: string; published: boolean; updatedAt?: unknown }

function database() {
  return getFirestore(requireFirebaseApp())
}

export async function listPublishedTours(): Promise<DocumentData[]> {
  const result = await getDocs(query(collection(database(), 'tours'), where('status', '==', 'published')))
  const tours: DocumentData[] = result.docs.map((item) => ({ id: item.id, ...item.data() }))
  return tours
}

export async function saveTour(id: string | undefined, tour: TourRecord) {
  const dbInstance = database()
  const payload = { ...tour, updatedAt: serverTimestamp() }
  if (id) await updateDoc(doc(dbInstance, 'tours', id), payload)
  else await addDoc(collection(dbInstance, 'tours'), { ...payload, createdAt: serverTimestamp() })
}

export async function removeTour(id: string) {
  await deleteDoc(doc(database(), 'tours', id))
}

export async function submitContactMessage(message: ContactMessage) {
  await addDoc(collection(database(), 'contactSubmissions'), {
    ...message,
    createdAt: serverTimestamp(),
    status: 'unread',
  })
}

export async function listAdminRecords(collectionName: 'tours' | 'friends' | 'albums' | 'expenses' | 'contactSubmissions') {
  const result = await getDocs(collection(database(), collectionName))
  return result.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export async function updateContactStatus(id: string, status: 'read' | 'unread') {
  await updateDoc(doc(database(), 'contactSubmissions', id), { status })
}


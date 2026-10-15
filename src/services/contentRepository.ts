import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, serverTimestamp, setDoc, updateDoc,
  where, query, type DocumentData,
} from 'firebase/firestore'
import { requireFirebaseApp } from './firebaseApp'

const database = () => getFirestore(requireFirebaseApp())

export type SiteSettings = {
  title: string
  tagline: string
  heroTitle: string
  heroText: string
  aboutText: string
  heroImageUrl: string
  logoUrl: string
  accentColor: string
  socialLinks: { facebook: string; instagram: string; youtube: string; tiktok: string }
}

export const defaultSiteSettings: SiteSettings = {
  title: 'TravelVista', tagline: 'TRAVEL BUDDIES · SAME FRIENDS, NEW DESTINATIONS',
  heroTitle: 'আমাদের পথচলা,\nআমাদের স্মৃতি।',
  heroText: 'প্রতিটি বাঁকানো পথ আমাদের আরও কাছে এনেছে। এই পথের জায়গা, গল্প আর ছোট ছোট মুহূর্তগুলোই এখানে জমা রাখি।',
  aboutText: 'বন্ধুদের সঙ্গে নতুন পথ চেনা, গল্প ভাগ করা, আর মনে রাখার মতো মুহূর্তগুলোকে এক জায়গায় ধরে রাখাই TravelVista-র উদ্দেশ্য।',
  heroImageUrl: '/assets/img/rangamati-sunset.jpg', logoUrl: '/assets/img/logo-optimized.png', accentColor: '#ff014f',
  socialLinks: { facebook: '', instagram: '', youtube: '', tiktok: '' },
}

export async function loadPublicContent() {
  const db = database()
  const [settingsDoc, friends, albums, journal] = await Promise.all([
    getDoc(doc(db, 'publicSettings', 'main')),
    getDocs(query(collection(db, 'friends'), where('visibleToMembers', '==', true))),
    getDocs(query(collection(db, 'albums'), where('published', '==', true))),
    getDocs(query(collection(db, 'journalPosts'), where('published', '==', true))),
  ])
  const settings = settingsDoc.exists() ? settingsDoc.data() as Partial<SiteSettings> : {}
  return {
    settings: { ...defaultSiteSettings, ...settings, socialLinks: { ...defaultSiteSettings.socialLinks, ...settings.socialLinks } },
    friends: friends.docs.map(item => ({ id: item.id, ...item.data() })),
    albums: albums.docs.map(item => ({ id: item.id, ...item.data() })),
    journal: journal.docs.map(item => ({ id: item.id, ...item.data() })),
  }
}

export async function loadAdminContent() {
  const db = database()
  const [settingsDoc, friends, albums, journal] = await Promise.all([
    getDoc(doc(db, 'publicSettings', 'main')),
    getDocs(collection(db, 'friends')),
    getDocs(collection(db, 'albums')),
    getDocs(collection(db, 'journalPosts')),
  ])
  return {
    settings: settingsDoc.exists() ? { ...defaultSiteSettings, ...settingsDoc.data(), socialLinks: { ...defaultSiteSettings.socialLinks, ...settingsDoc.data().socialLinks } } as SiteSettings : defaultSiteSettings,
    friends: friends.docs.map(item => ({ id: item.id, ...item.data() })),
    albums: albums.docs.map(item => ({ id: item.id, ...item.data() })),
    journal: journal.docs.map(item => ({ id: item.id, ...item.data() })),
  }
}

export async function saveSiteSettings(settings: SiteSettings) {
  await setDoc(doc(database(), 'publicSettings', 'main'), { ...settings, updatedAt: serverTimestamp() }, { merge: true })
}

export async function saveContentRecord(collectionName: 'friends' | 'albums' | 'journalPosts', id: string | undefined, values: DocumentData) {
  const db = database()
  const payload = { ...values, updatedAt: serverTimestamp() }
  if (id) await updateDoc(doc(db, collectionName, id), payload)
  else await addDoc(collection(db, collectionName), { ...payload, createdAt: serverTimestamp() })
}

export async function deleteContentRecord(collectionName: 'friends' | 'albums' | 'journalPosts', id: string) {
  await deleteDoc(doc(database(), collectionName, id))
}

import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, ChevronDown, Compass, Eye, EyeOff, LockKeyhole, Mail, Menu, Mountain, Plus, Settings2, Trees, Users, Wallet, Waves, X } from 'lucide-react'
import AdminToursPage from './features/admin/AdminToursPage'
import AdminContentPage from './features/admin/AdminContentPage'
import { AboutPage, FriendsPage, GalleryPage, Home, JournalDetailPage, JournalPage, Journeys, TripPage } from './features/public/TravelPages'
import { firebaseConfigured, requireFirebaseApp } from './services/firebaseApp'
import { defaultSiteSettings, loadPublicContent, type SiteSettings } from './services/contentRepository'

type Trip = { id: number | string; title: string; place: string; date: string; count: number; color: string; image: string; description: string; cost: number; startDate?: string; endDate?: string; coverImageUrl?: string; story?: string; itinerary?: string; travelDetails?: string; attendeeIds?: string[]; albumIds?: string[]; source?: 'demo' | 'firebase'; recordedExpenseTotal?: number }
type Friend = { id?: string; name: string; nickname: string; initials: string; trips: number; color: string; avatarUrl?: string; bio?: string; source?: 'demo' | 'firebase' }
type JournalPost = { id: string; title: string; category: string; excerpt: string; story: string; coverImageUrl: string; published: boolean; source?: 'demo' | 'firebase' }
type GalleryMedia = { id: string; albumId?: string; url: string; kind: 'image' | 'video'; title: string; destination: string; caption: string; source?: 'demo' | 'firebase' }

const scenicImages = [
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=82',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
]
const initialTrips: Trip[] = [
  { id: 1, title: 'মেঘের দেশে কয়েকটা দিন', place: 'সাজেক, রাঙামাটি', date: '১২–১৫ ডিসেম্বর, ২০২৪', count: 6, color: '#536b60', image: 'sajek', description: 'পাহাড়ের চূড়ায় ভোরের মেঘ, একসাথে হাঁটা আর আগুন ঘিরে রাতের গল্প—এই সফরটা আমাদের সবার মনে আলাদা করে থেকে যাবে।', cost: 18500, source: 'demo', coverImageUrl: scenicImages[0] },
  { id: 2, title: 'চায়ের দেশে আমাদের ছুটি', place: 'শ্রীমঙ্গল, মৌলভীবাজার', date: '২১–২৩ জুন, ২০২৪', count: 5, color: '#78836a', image: 'sreemangal', description: 'সবুজ চা-বাগানের পথ ধরে সাইকেল, লাউয়াছড়ার নীরবতা আর সাতরঙা চায়ের আড্ডা।', cost: 12800, source: 'demo', coverImageUrl: scenicImages[4] },
  { id: 3, title: 'জলের কাছে, পাহাড়ের পাশে', place: 'কাপ্তাই, রাঙামাটি', date: '০৮–১০ ফেব্রুয়ারি, ২০২৪', count: 7, color: '#566f78', image: 'kaptai', description: 'লেকের নীল জল আর পাহাড়ি রাস্তা ধরে আমাদের প্রথম বড় দলীয় ভ্রমণ।', cost: 14600, source: 'demo', coverImageUrl: scenicImages[3] },
]
const demoFriends: Friend[] = [
  { name: 'আরিফ রহমান', nickname: 'আরিফ', initials: 'আ', trips: 0, color: '#b87e68', source: 'demo' },
  { name: 'নুসরাত জাহান', nickname: 'নুসু', initials: 'ন', trips: 0, color: '#738a76', source: 'demo' },
  { name: 'তানভীর হাসান', nickname: 'তানভীর', initials: 'ত', trips: 0, color: '#74839a', source: 'demo' },
  { name: 'মেহেদী হাসান', nickname: 'মেহেদী', initials: 'মে', trips: 0, color: '#9a8064', source: 'demo' },
]
const en = {
  nav: ['Home', 'Journeys', 'Friends', 'Journal', 'Gallery', 'About'], heroEyebrow: 'A PRIVATE JOURNAL OF OUR FRIEND GROUP', heroTitle: 'Our journeys,\nour memories.', heroText: 'Every winding road brought us closer. Here are the places, stories and little moments we collected along the way.', heroCta: 'Explore our journeys', secondary: 'Our story', trips: 'Journeys worth remembering', tripsSub: 'A few chapters from the road we have shared.', allTrips: 'All journeys', stats: ['Journeys together', 'Places explored', 'Friends on the road', 'Moments collected'], recent: 'Little moments, kept forever', recentSub: 'The candid frames that take us right back.', friends: 'The people behind every story', friendsSub: 'Every trip is better when we take the long way together.', timeline: 'A little history of us', timelineSub: 'One shared road, year after year.', journal: 'Notes from the road', footer: 'A small corner of the internet for the places we keep returning to.', admin: 'Admin', save: 'Save journey', close: 'Close', demo: 'Preview content — replace with your real memories', latest: 'Recent memories', noResults: 'No journeys found yet.', cost: 'Recorded trip total', attendees: 'friends went', date: 'Travel dates', location: 'Destination', story: 'Our story', expenses: 'Trip expenses', addTrip: 'Add a journey', search: 'Search destinations…', language: 'বাংলা', private: 'Friends only · Our travel journal', moments: 'shared moments', readStory: 'Read the story', back: 'Back to journeys', statFoot: 'Counts reflect the content currently saved to the site.', viewAll: 'View all', about: 'Made of long roads, missed turns and stories we still tell.'
}
const bn = {
  nav: ['হোম', 'ভ্রমণ', 'বন্ধুরা', 'জার্নাল', 'গ্যালারি', 'আমাদের গল্প'], heroEyebrow: 'বন্ধুদের ব্যক্তিগত ভ্রমণ-জার্নাল', heroTitle: 'আমাদের পথচলা,\nআমাদের স্মৃতি।', heroText: 'প্রতিটি বাঁকানো পথ আমাদের আরও কাছে এনেছে। এই পথের জায়গা, গল্প আর ছোট ছোট মুহূর্তগুলোই এখানে জমা রাখি।', heroCta: 'ভ্রমণগুলো দেখুন', secondary: 'আমাদের গল্প', trips: 'মনে রাখার মতো ভ্রমণ', tripsSub: 'একসঙ্গে পাড়ি দেওয়া পথের কয়েকটি অধ্যায়।', allTrips: 'সব ভ্রমণ', stats: ['একসাথে ভ্রমণ', 'ঘুরে দেখা জায়গা', 'পথের সঙ্গী', 'জমা স্মৃতি'], recent: 'ছোট মুহূর্ত, চিরদিনের জন্য', recentSub: 'এই ছবিগুলো আমাদের ফিরিয়ে নেয় সেই দিনগুলোতে।', friends: 'প্রতিটি গল্পের পেছনের মানুষগুলো', friendsSub: 'একসঙ্গে একটু ঘুরপথে গেলে প্রতিটি ভ্রমণ আরও সুন্দর হয়।', timeline: 'আমাদের পথচলার গল্প', timelineSub: 'একসাথে কাটানো ভ্রমণের গল্প।', journal: 'পথের ডায়েরি', footer: 'যেসব জায়গায় বারবার ফিরে যেতে ইচ্ছে করে, তাদের জন্য ছোট্ট একটি ঠিকানা।', admin: 'অ্যাডমিন', save: 'ভ্রমণ যোগ করুন', close: 'বন্ধ', demo: 'নমুনা তথ্য — নিজেদের স্মৃতি দিয়ে বদলে নিন', latest: 'সাম্প্রতিক স্মৃতি', noResults: 'এখনও কোনো ভ্রমণ যোগ করা হয়নি।', cost: 'রেকর্ড করা মোট খরচ', attendees: 'জন বন্ধু গিয়েছিল', date: 'ভ্রমণের তারিখ', location: 'গন্তব্য', story: 'আমাদের গল্প', expenses: 'ভ্রমণের খরচ', addTrip: 'ভ্রমণ যোগ করুন', search: 'জায়গা খুঁজুন…', language: 'English', private: 'শুধু বন্ধুদের জন্য · আমাদের ভ্রমণ-জার্নাল', moments: 'টি ভাগ করা মুহূর্ত', readStory: 'গল্প পড়ুন', back: 'ভ্রমণ তালিকায় ফিরুন', statFoot: 'সাইটে সংরক্ষিত তথ্যের ভিত্তিতে গণনা।', viewAll: 'সব দেখুন', about: 'দীর্ঘ পথ, ভুল মোড় আর বারবার বলা গল্পে গড়া।'
}
type Copy = typeof bn
const getStored = <T,>(key: string, fallback: T): T => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback } }
function App() {
  const [language, setLanguage] = useState<'bn'|'en'>(() => getStored('tv-language', 'bn'))
  const [access, setAccess] = useState<'checking'|'authenticated'|'signed-out'|'unconfigured'|'error'>('checking')
  const [trips, setTrips] = useState<Trip[]>(() => getStored('tv-trips', initialTrips))
  const [friends, setFriends] = useState<Friend[]>(demoFriends)
  const [journal, setJournal] = useState<JournalPost[]>([])
  const [galleryMedia, setGalleryMedia] = useState<GalleryMedia[]>([])
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [dataNotice, setDataNotice] = useState<'preview'|'cloud'|'error'>('preview')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const t: Copy = language === 'bn' ? bn : en
  const location = useLocation()
  useEffect(() => {
    if (!firebaseConfigured) {
      setAccess('unconfigured')
      return
    }
    let active = true
    let unsubscribe: (() => void) | undefined
    void import('firebase/auth').then(({ getAuth, onAuthStateChanged }) => {
      if (!active) return
      try {
        const auth = getAuth(requireFirebaseApp())
        unsubscribe = onAuthStateChanged(auth, user => {
          if (!active) return
          if (!user) {
            setAccess('signed-out')
            return
          }
          setAccess('authenticated')
          if (!active) return
          void Promise.all([
            import('./services/data').then(({ listPublishedTours }) => listPublishedTours()),
            loadPublicContent(),
          ]).then(([rawTours, content]) => {
            if (!active) return
            const liveTours: Trip[] = rawTours.map((tour: any, index: number) => {
              const startDate = String(tour.startDate || '')
              const endDate = String(tour.endDate || '')
              const date = startDate && endDate ? `${startDate} — ${endDate}` : String(tour.legacyDateLabel || '')
              return {
                id: String(tour.id), title: String(tour.title || ''), place: String(tour.destination || ''), date,
                count: Array.isArray(tour.attendeeIds) ? tour.attendeeIds.length : 0,
                color: '#536b60', image: String(tour.legacyImageKey || ['sajek','sreemangal','kaptai'][index % 3]),
                description: String(tour.description || ''), cost: 0, startDate, endDate,
                coverImageUrl: String(tour.coverImageUrl || ''), story: String(tour.story || ''),
                itinerary: String(tour.itinerary || ''), travelDetails: String(tour.travelDetails || ''),
                attendeeIds: Array.isArray(tour.attendeeIds) ? tour.attendeeIds : [],
                albumIds: Array.isArray(tour.albumIds) ? tour.albumIds : [],
                recordedExpenseTotal: Number(tour.recordedExpenseTotal) || 0, source: 'firebase',
              }
            })
            const liveFriends: Friend[] = content.friends.map((friend: any, index: number) => ({
              id: String(friend.id), name: String(friend.name || friend.displayName || ''), nickname: String(friend.nickname || ''),
              initials: String(friend.name || friend.displayName || '?').trim().slice(0, 1), trips: Number(friend.tripCount || 0),
              color: ['#b87e68','#738a76','#74839a','#9a8064'][index % 4], avatarUrl: String(friend.avatarUrl || ''),
              bio: String(friend.bio || ''), source: 'firebase',
            }))
            const liveJournal: JournalPost[] = content.journal.map((post: any) => ({
              id: String(post.id), title: String(post.title || ''), category: String(post.category || ''),
              excerpt: String(post.excerpt || ''), story: String(post.story || ''),
              coverImageUrl: String(post.coverImageUrl || ''), published: post.published === true, source: 'firebase',
            }))
            const liveMedia: GalleryMedia[] = content.albums.flatMap((album: any) => {
              const sources = Array.isArray(album.media) ? album.media : []
              const media = sources.length ? sources : (album.coverImageUrl ? [{ url: album.coverImageUrl, kind: 'image' }] : [])
              return media.map((item: any, index: number) => {
                const url = typeof item === 'string' ? item : String(item.url || '')
                const kind = (typeof item === 'object' && item.kind === 'video') || /\.(mp4|webm|mov)(\?.*)?$/i.test(url) ? 'video' : 'image'
                return { id: `${album.id}-${index}`, albumId: String(album.id), url, kind, title: String(album.title || ''), destination: String(album.destination || ''), caption: String(item.caption || album.caption || ''), source: 'firebase' as const }
              }).filter((item: GalleryMedia) => item.url)
            })
            setSettings(content.settings)
            setTrips(liveTours.length ? liveTours : getStored<Trip[]>('tv-trips', initialTrips).map(trip => ({ ...trip, source: 'demo' })))
            setFriends(liveFriends.length ? liveFriends : demoFriends)
            setJournal(liveJournal.length ? liveJournal : initialTrips.map((trip, index) => ({ id: `demo-${trip.id}`, title: trip.title, category: ['পথের গল্প','বন্ধুদের স্মৃতি','প্রকৃতি'][index], excerpt: trip.description, story: trip.description, coverImageUrl: trip.coverImageUrl || scenicImages[index], published: true, source: 'demo' })))
            setGalleryMedia(liveMedia.length ? liveMedia : initialTrips.map((trip, index) => ({ id: `demo-${trip.id}`, url: trip.coverImageUrl || scenicImages[index], kind: 'image', title: trip.title, destination: trip.place, caption: trip.description, source: 'demo' })))
            setDataNotice(liveTours.length || liveFriends.length || liveJournal.length || liveMedia.length ? 'cloud' : 'preview')
          }).catch(() => {
            if (!active) return
            setDataNotice('error')
            setTrips(getStored('tv-trips', initialTrips).map((trip: Trip) => ({ ...trip, source: 'demo' })))
            setFriends(demoFriends)
            setJournal(initialTrips.map((trip, index) => ({ id: `demo-${trip.id}`, title: trip.title, category: ['পথের গল্প','বন্ধুদের স্মৃতি','প্রকৃতি'][index], excerpt: trip.description, story: trip.description, coverImageUrl: trip.coverImageUrl || scenicImages[index], published: true, source: 'demo' })))
            setGalleryMedia(initialTrips.map((trip, index) => ({ id: `demo-${trip.id}`, url: trip.coverImageUrl || scenicImages[index], kind: 'image', title: trip.title, destination: trip.place, caption: trip.description, source: 'demo' })))
          })
        }, () => { if (active) setAccess('error') })
      } catch {
        setAccess('error')
      }
    }).catch(() => { if (active) setAccess('error') })
    return () => { active = false; unsubscribe?.() }
  }, [])
  useEffect(() => {
    const refreshLegacyTrips = () => setTrips(getStored('tv-trips', initialTrips))
    window.addEventListener('tv-tours-updated', refreshLegacyTrips)
    return () => window.removeEventListener('tv-tours-updated', refreshLegacyTrips)
  }, [])
  useEffect(() => {
    document.documentElement.lang = language
    document.title = language === 'bn' ? `${settings.title} — আমাদের পথচলা, আমাদের স্মৃতি` : `${settings.title} — Our Journeys, Our Memories`
  }, [language, settings.title])
  useEffect(() => {
    document.documentElement.dataset.theme = 'dark'
    document.documentElement.style.colorScheme = 'dark'
  }, [])
  const filtered = useMemo(() => trips.filter((trip) => `${trip.title} ${trip.place}`.toLowerCase().includes(search.toLowerCase())), [trips, search])
  const toggleLanguage = () => { const next = language === 'bn' ? 'en' : 'bn'; setLanguage(next); localStorage.setItem('tv-language', JSON.stringify(next)) }
  if (access !== 'authenticated') return <div className="site dark"><AccessWall language={language} access={access} toggleLanguage={toggleLanguage}/></div>
  const adminProps = { language, legacyTrips: trips.map(trip => ({ ...trip, place: trip.place })) as any, fallbackFriends: friends.map(friend => ({ id: friend.id || friend.name, name: friend.name, nickname: friend.nickname })) }
  const adminRoute = location.pathname.startsWith('/admin')
  return <div className="site dark" style={{ '--pink': settings.accentColor || '#ff014f', '--hero-image': `url("${settings.heroImageUrl || defaultSiteSettings.heroImageUrl}")` } as React.CSSProperties}>
    {adminRoute ? <Routes><Route path="/admin" element={<AdminFrame language={language}/> }><Route index element={<AdminToursPage {...adminProps}/>} /><Route path="tours/:tourId" element={<AdminToursPage {...adminProps}/>} /><Route path="content" element={<AdminContentPage language={language}/>} /></Route><Route path="*" element={<main className="not-found wrap"><h1>404</h1><Link className="button" to="/">{t.nav[0]}</Link></main>} /></Routes> : <>
      <Header t={t} language={language} toggleLanguage={toggleLanguage} menuOpen={menuOpen} setMenuOpen={setMenuOpen} active={location.pathname} settings={settings} />
      <DataNotice mode={dataNotice} language={language}/>
      <Routes>
        <Route path="/" element={<Home t={t} trips={filtered} friends={friends} journal={journal} gallery={galleryMedia} settings={settings} language={language}/>} />
        <Route path="/journeys" element={<Journeys t={t} trips={trips} search={search} setSearch={setSearch} language={language} />} />
        <Route path="/journeys/:id" element={<TripPage t={t} trips={trips} friends={friends} gallery={galleryMedia} language={language}/>} />
        <Route path="/friends" element={<FriendsPage t={t} friends={friends} trips={trips} language={language}/>} />
        <Route path="/journal" element={<JournalPage t={t} posts={journal} language={language}/>} />
        <Route path="/journal/:slug" element={<JournalDetailPage posts={journal} language={language}/>} />
        <Route path="/gallery" element={<GalleryPage t={t} media={galleryMedia} language={language}/>} />
        <Route path="/about" element={<AboutPage language={language} trips={trips} settings={settings}/>} />
        <Route path="/expenses" element={<ExpensesPage language={language} trips={trips} />} />
        <Route path="/contact" element={<ContactPage language={language} settings={settings}/>} />
        <Route path="/login" element={<Navigate to="/" replace/>} />
        <Route path="*" element={<main className="not-found wrap"><Compass size={34}/><h1>৪০৪</h1><Link className="button" to="/">{t.nav[0]} <ArrowRight size={16}/></Link></main>} />
      </Routes>
      <Footer t={t} settings={settings}/>
    </>}
  </div>
}

function Header({ t, language, toggleLanguage, menuOpen, setMenuOpen, active, settings }: { t: Copy; language: 'bn'|'en'; toggleLanguage: () => void; menuOpen: boolean; setMenuOpen: (v: boolean) => void; active: string; settings: SiteSettings }) {
  const links = ['/','/journeys','/friends','/journal','/gallery','/about']
  return <header className="header"><div className="nav-wrap wrap"><Link to="/" className="brand"><img src={settings.logoUrl||'/assets/img/logo-optimized.png'} alt={settings.title}/><span>{settings.title||'TravelVista'}<small>{settings.tagline||'TRAVEL BUDDIES'}</small></span></Link><button className="icon-button menu-toggle" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button><nav className={menuOpen ? 'nav-links open' : 'nav-links'}>{t.nav.map((label, index) => <Link key={label} onClick={() => setMenuOpen(false)} className={active === links[index] || (index === 1 && active.startsWith('/journeys/')) || (index===3 && active.startsWith('/journal')) ? 'active' : ''} to={links[index]}>{label}</Link>)}</nav><div className="nav-actions"><button className="lang-button" onClick={toggleLanguage}>{t.language} <ChevronDown size={14}/></button><Link className="nav-admin" to="/admin"><Settings2 size={15}/>{t.admin}</Link><button className="nav-admin sign-out-button" onClick={()=>void import('./services/auth').then(({logout})=>logout())}>{language==='bn'?'লগআউট':'Sign out'}</button></div></div></header>
}
function AdminFrame({language}:{language:'bn'|'en'}) {
  const isBn=language==='bn'
  const activePath=useLocation().pathname
  return <div className="admin-shell"><aside className="admin-sidebar"><Link to="/" className="admin-brand"><img src="/assets/img/logo-optimized.png" alt=""/><span>Travel<span className="pink">Vista</span><small>CONTROL ROOM</small></span></Link><span className="admin-side-label">{isBn?'ম্যানেজমেন্ট':'MANAGEMENT'}</span><Link to="/admin" className={`admin-side-link${activePath==='/admin'||activePath.includes('/tours/')?' active':''}`}><Compass size={17}/>{isBn?'ড্যাশবোর্ড ও ভ্রমণ':'Dashboard & tours'}</Link><Link to="/admin/content" className={`admin-side-link${activePath==='/admin/content'?' active':''}`}><Settings2 size={17}/>{isBn?'সাইট কনটেন্ট':'Site content'}</Link><div className="admin-sidebar-bottom"><Link to="/" className="admin-side-link"><ArrowLeft size={17}/>{isBn?'সাইটে ফিরে যান':'Back to website'}</Link><button className="admin-side-link" onClick={()=>void import('./services/auth').then(({logout})=>logout())}><X size={17}/>{isBn?'সাইন আউট':'Sign out'}</button></div></aside><section className="admin-workspace"><header className="admin-topbar"><span className="admin-top-path">TravelVista <span>/</span> {isBn?'ব্যবস্থাপনা':'Admin'}</span><span className="admin-secure-dot"><i/>{isBn?'সুরক্ষিত অ্যাক্সেস':'SECURE ACCESS'}</span></header><Outlet/></section></div>
}
function DataNotice({mode,language}:{mode:'preview'|'cloud'|'error';language:'bn'|'en'}) {
  if(mode==='cloud')return null
  return <div className={`data-notice ${mode}`} role="status"><span className="data-notice-dot"/><span>{mode==='error'?(language==='bn'?'Firebase-এর তথ্য আনা যায়নি; নিচে দেখানো বিষয়বস্তু নমুনা।':'Could not load Firebase data. Preview content is shown below.'):(language==='bn'?'প্রিভিউ মোড · নিচের ট্রিপ ও সদস্যের তথ্য নমুনা, Firestore-এ সংরক্ষিত নয়।':'Preview mode · sample journeys and people below are not stored in Firestore.')}</span></div>
}
function AccessWall({language,access,toggleLanguage}:{language:'bn'|'en';access:'checking'|'authenticated'|'signed-out'|'unconfigured'|'error';toggleLanguage:()=>void}) {
  const isBn=language==='bn'
  const [mode,setMode]=useState<'login'|'register'>('login')
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [confirmPassword,setConfirmPassword]=useState('')
  const [remember,setRemember]=useState(true)
  const [showPassword,setShowPassword]=useState(false)
  const [agree,setAgree]=useState(false)
  const [status,setStatus]=useState('')
  const [busy,setBusy]=useState(false)
  const unavailable=access==='unconfigured'||access==='error'
  const perform=async(action:()=>Promise<unknown>)=>{setStatus('');setBusy(true);try{await action()}catch(error){setStatus(error instanceof Error?error.message:(isBn?'লগইন করা যায়নি।':'Authentication failed.'))}finally{setBusy(false)}}
  const submit=(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault()
    if(mode==='register'){
      if(password!==confirmPassword){setStatus(isBn?'দুটি পাসওয়ার্ড মিলছে না।':'Passwords do not match.');return}
      if(!agree){setStatus(isBn?'আগে শর্তে সম্মতি দিন।':'Please accept the terms first.');return}
      void perform(()=>import('./services/auth').then(({registerWithEmail})=>registerWithEmail(name,email,password)))
    }else void perform(()=>import('./services/auth').then(({loginWithEmail})=>loginWithEmail(email,password,remember)))
  }
  const resetPassword=()=>{if(!email.trim()){setStatus(isBn?'আগে ইমেইল লিখুন, তারপর পাসওয়ার্ড রিসেট করুন।':'Enter your email first to reset your password.');return}void perform(()=>import('./services/auth').then(({requestPasswordReset})=>requestPasswordReset(email)))}
  const setAuthMode=(next:'login'|'register')=>{setMode(next);setStatus('')}
  return <main className="auth-wall"><header className="auth-topbar"><Link to="/" className="auth-brand"><img src="/assets/img/logo-optimized.png" alt=""/><span><strong>{isBn?'ভ্রমণসঙ্গী':'TravelVista'}</strong><small>TRAVEL BUDDIES</small></span></Link><div className="auth-top-actions"><span>{mode==='login'?(isBn?'নতুন অ্যাকাউন্ট তৈরি করবেন?':'New to TravelVista?'):(isBn?'আগে থেকেই অ্যাকাউন্ট আছে?':'Already have an account?')}</span><button type="button" className="auth-outline-link" onClick={()=>setAuthMode(mode==='login'?'register':'login')}>{mode==='login'?(isBn?'রেজিস্ট্রেশন':'Register'):(isBn?'লগইন':'Sign in')}</button><button type="button" className="auth-language" onClick={toggleLanguage}>{isBn?'EN':'বাংলা'}</button></div></header><section className="auth-main-grid"><div className="auth-story"><div className="auth-story-copy"><span className="auth-kicker">{isBn?'একই বন্ধুরা · নতুন নতুন গন্তব্য':'SAME FRIENDS · NEW DESTINATIONS'}</span><h1>{isBn?<>ভ্রমণ<span>সঙ্গী</span></>:<>Travel<span>Vista</span></>}</h1><h2>{isBn?'একই বন্ধুরা  •  নতুন নতুন গল্প':'Our journeys, our memories.'}</h2><p>{isBn?'চলুন একসাথে নতুন জায়গা দেখি, নতুন গল্প লিখি, আর স্মৃতিগুলোকে করে তুলি আরও সুন্দর।':'Explore new places together, write our stories, and keep every memory close.'}</p></div><div className="auth-landscape-badges"><span><Mountain size={20}/>{isBn?'পাহাড়':'Hills'}</span><span><Waves size={20}/>{isBn?'সমুদ্র':'Sea'}</span><span><Trees size={20}/>{isBn?'প্রকৃতি':'Nature'}</span><span><Users size={20}/>{isBn?'বন্ধুরা':'Friends'}</span></div></div><section className="auth-panel"><div className="auth-emblem"><img src="/assets/img/logo-optimized.png" alt="TravelVista"/></div><div className="auth-form-content"><span className="auth-kicker">{isBn?'বন্ধুদের ভ্রমণ-জার্নাল':'TRAVEL BUDDIES · PRIVATE JOURNAL'}</span><h2>{mode==='login'?(isBn?'লগইন করুন':'Welcome back'):(isBn?'অ্যাকাউন্ট তৈরি করুন':'Create your account')}</h2><p>{mode==='login'?(isBn?'আপনার অ্যাকাউন্টে প্রবেশ করুন':'Sign in to continue to your memories.'):(isBn?'বন্ধুদের সাথে ভ্রমণের স্মৃতি রাখতে যোগ দিন।':'Join your friends and keep the memories together.')}</p>{access==='checking'&&<p className="auth-status">{isBn?'অ্যাকাউন্ট যাচাই হচ্ছে…':'Checking your account…'}</p>}<form className="auth-form" onSubmit={submit}>{mode==='register'&&<label className="auth-input-wrap"><Users size={20}/><input type="text" autoComplete="name" placeholder={isBn?'আপনার পুরো নাম':'Full name'} value={name} onChange={event=>setName(event.target.value)} required minLength={2} maxLength={80}/></label>}<label className="auth-input-wrap"><Mail size={20}/><input type="email" autoComplete="username" placeholder={isBn?'ইমেইল ঠিকানা':'Email address'} value={email} onChange={event=>setEmail(event.target.value)} required/></label><label className="auth-input-wrap"><LockKeyhole size={20}/><input type={showPassword?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} placeholder={isBn?'পাসওয়ার্ড':'Password'} value={password} onChange={event=>setPassword(event.target.value)} required minLength={6}/><button type="button" className="password-visibility" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?(isBn?'পাসওয়ার্ড লুকান':'Hide password'):(isBn?'পাসওয়ার্ড দেখান':'Show password')}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></label>{mode==='register'&&<label className="auth-input-wrap"><LockKeyhole size={20}/><input type="password" autoComplete="new-password" placeholder={isBn?'পাসওয়ার্ড নিশ্চিত করুন':'Confirm password'} value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} required minLength={6}/></label>}{mode==='login'?<div className="auth-options"><label className="auth-remember"><input type="checkbox" checked={remember} onChange={event=>setRemember(event.target.checked)}/><span>{isBn?'আমাকে মনে রাখুন':'Remember me'}</span></label><button type="button" className="auth-text-button" onClick={resetPassword}>{isBn?'পাসওয়ার্ড ভুলে গেছেন?':'Forgot password?'}</button></div>:<label className="auth-remember auth-terms"><input type="checkbox" checked={agree} onChange={event=>setAgree(event.target.checked)}/><span>{isBn?'আমি বন্ধুদের ব্যক্তিগত ভ্রমণ-জার্নালের নিয়মে সম্মত':'I agree to use this friends travel journal respectfully'}</span></label>}<button className="auth-submit" disabled={busy||access==='checking'||unavailable}>{busy?(isBn?'অপেক্ষা করুন…':'Please wait…'):(mode==='login'?(isBn?'লগইন করুন':'Sign in'):(isBn?'রেজিস্ট্রেশন করুন':'Create account'))}<ArrowRight size={20}/></button></form><div className="auth-divider"><span>{isBn?'অথবা':'OR'}</span></div><div className="auth-social-row"><button className="auth-provider" disabled={busy||access==='checking'||unavailable} onClick={()=>void perform(()=>import('./services/auth').then(({loginWithGoogle})=>loginWithGoogle(remember)))}><b className="google-g">G</b>{isBn?'Google দিয়ে লগইন':'Continue with Google'}</button><button className="auth-provider" disabled={busy||access==='checking'||unavailable} onClick={()=>void perform(()=>import('./services/auth').then(({loginWithFacebook})=>loginWithFacebook(remember)))}><b className="facebook-f">f</b>{isBn?'Facebook দিয়ে লগইন':'Continue with Facebook'}</button></div>{unavailable&&<p className="auth-error">{access==='unconfigured'?(isBn?'Firebase config সেট করা নেই।':'Firebase is not configured.'):(isBn?'Firebase-এ সংযোগ করা যায়নি।':'Could not connect to Firebase.')}</p>}{status&&<p className="auth-error" role="alert">{status}</p>}<p className="auth-footnote">{isBn?'লগইন করা ব্যবহারকারীরা সাইট দেখতে পারবেন। Admin tools শুধু অ্যাডমিনের জন্য।':'Signed-in users can view the site. Admin tools remain admin-only.'}</p></div></section></section><footer className="auth-footer">© {new Date().getFullYear()} {isBn?'ভ্রমণসঙ্গী':'TravelVista'} <span>·</span> SAME FRIENDS · NEW DESTINATIONS <a href="https://commons.wikimedia.org/wiki/File:Sunset_at_Rangamati_2018.jpg" target="_blank" rel="noreferrer">Photo: Anvil Chakma / CC BY-SA 4.0</a></footer></main>
}function ContactPage({language,settings}:{language:'bn'|'en';settings:SiteSettings}) {
  const [status,setStatus]=useState(''); const [busy,setBusy]=useState(false); const isBn=language==='bn';
  const send=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();setStatus('');if(!firebaseConfigured){setStatus(isBn?'??????? ?????? ?????? Firebase config ??????':'Firebase must be configured before a message can be sent.');return}const formElement=e.currentTarget;const form=new FormData(formElement);setBusy(true);try{await import('./services/data').then(({submitContactMessage})=>submitContactMessage({name:String(form.get('name')||''),email:String(form.get('email')||''),subject:String(form.get('subject')||''),message:String(form.get('message')||'')}));formElement.reset();setStatus(isBn?'????? ?????? ??????? ???????':'Your message has been saved.')}catch(cause){setStatus(cause instanceof Error?cause.message:(isBn?'?????? ?????? ??????? ??? ???? ?????? ?????':'Could not send your message. Please try again.'))}finally{setBusy(false)}};
  const socials=Object.entries(settings.socialLinks).filter(([,url])=>safeExternalUrl(url));
  return <main className="subpage wrap contact-page"><div className="page-title"><span className="section-kicker">CONTACT THE GROUP</span><h1>{isBn?'??????? ????':'Leave us a note.'}</h1><p>{isBn?'?????? ?????-????????? ???? ???? ????????? ?????? ??????':'Send a private message to the travel group.'}</p></div><div className="contact-layout"><aside className="contact-intro panel-card"><span className="contact-emblem"><Mail/></span><h2>{isBn?'???? ?????? ?????':'Start a conversation.'}</h2><p>{isBn?'????????? ???? ?????? ??? ?????? ?????? ???????? ??? ???????? Social links-? ????????? ?????? ??? ???? ??????':'No phone or email address is invented here. The site administrator can add social links in Site content.'}</p>{socials.length>0&&<div className="contact-socials"><h3>{isBn?'???????':'Find us'}</h3>{socials.map(([name,url])=><a key={name} href={url} target="_blank" rel="noreferrer">{name}<ArrowUpRight size={15}/></a>)}</div>}</aside><form className="contact-form" onSubmit={send}><label>{isBn?'????? ???':'Your name'}<input name="name" required maxLength={120} autoComplete="name"/></label><label>{isBn?'?????':'Email'}<input name="email" type="email" required maxLength={254} autoComplete="email"/></label><label>{isBn?'?????':'Subject'}<input name="subject" required maxLength={180}/></label><label>{isBn?'??????':'Message'}<textarea name="message" required maxLength={5000} rows={6}/></label><button className="button button-pink" type="submit" disabled={busy}>{busy?(isBn?'?????? ??????':'Sending?'):(isBn?'?????? ?????':'Send message')}<ArrowRight size={16}/></button>{status&&<p className="form-status" role="status">{status}</p>}<p className="form-footnote">{isBn?'?????? ?????? ???? ??? ????? ???; ??? ???????? ??????? ???????? ????':'You must be signed in. The message is stored in the admin inbox.'}</p></form></div></main>
}
function safeExternalUrl(value:string){try{const parsed=new URL(value);return parsed.protocol==='https:'||parsed.protocol==='http:'?parsed.href:''}catch{return ''}}

export default App

function languageLabel(t:Copy,key:'contact'|'login'|'expenses'){return t===bn?(key==='contact'?'যোগাযোগ':key==='login'?'লগইন':'ভ্রমণ খরচ'):(key==='contact'?'Contact':key==='login'?'Sign in':'Trip costs')}
function Footer({t,settings}:{t:Copy;settings:SiteSettings}){const links=[['Facebook',settings.socialLinks.facebook],['Instagram',settings.socialLinks.instagram],['YouTube',settings.socialLinks.youtube],['TikTok',settings.socialLinks.tiktok]].filter(([,url])=>safeExternalUrl(url));return <footer className="footer"><div className="wrap footer-inner"><div className="footer-main"><Link to="/" className="brand"><img src={settings.logoUrl||'/assets/img/logo-optimized.png'} alt=""/><span>{settings.title||'TravelVista'}<small>{settings.tagline}</small></span></Link><p>{t.footer}</p><div className="footer-links"><Link to="/about">{t===bn?'?????? ????':'About'}</Link><Link to="/contact">{t===bn?'???????':'Contact'}</Link><Link to="/expenses">{languageLabel(t,'expenses')}</Link></div></div><div className="footer-bottom"><span className="footer-copy">? {new Date().getFullYear().toLocaleString('bn-BD')} ? ???????? ???? ??????</span><div className="footer-socials">{links.map(([name,url])=><a key={name} href={url} target="_blank" rel="noreferrer" aria-label={name}>{name}</a>)}</div></div></div></footer>}
type ExpenseRow={id:string;tripId:number|string;date:string;title:string;category:string;amount:number;paidBy:string;split:boolean}
function ExpensesPage({language,trips}:{language:'bn'|'en';trips:Trip[]}){const isBn=language==='bn';const queryTrip=new URLSearchParams(window.location.search).get('trip');const [tripId,setTripId]=useState(()=>queryTrip&&trips.some(trip=>String(trip.id)===queryTrip)?queryTrip:String(trips[0]?.id??''));const [rows,setRows]=useState<ExpenseRow[]>(()=>getStored('tv-expenses',[]));const selected=trips.find(trip=>String(trip.id)===String(tripId));const current=rows.filter(row=>String(row.tripId)===String(tripId));const total=current.reduce((sum,row)=>sum+row.amount,0);const [notice,setNotice]=useState('');const labels=isBn?{title:'ভ্রমণের খরচ',sub:'যা খরচ হয়েছে তা যোগ করুন; প্রতিটি অঙ্ক এই ব্রাউজারে সংরক্ষিত থাকবে।',journey:'ভ্রমণ বাছুন',amount:'টাকা (BDT)',paidBy:'কে দিয়েছেন',category:'খরচের ধরন',description:'খরচের বিবরণ',split:'সবার মধ্যে ভাগ হবে',add:'খরচ যোগ করুন',total:'রেকর্ড করা মোট',per:'জনপ্রতি ভাগ (সমান ভাগে)',export:'CSV নামান',empty:'এই ভ্রমণে এখনো কোনো খরচ লেখা হয়নি।',date:'তারিখ',remove:'খরচ মুছুন',local:'এই তথ্য শুধুই এই ব্রাউজারে থাকবে; Firebase সেটআপ হলে সিঙ্ক করা যাবে।'}:{title:'Trip expenses',sub:'Record actual costs. Entries are stored in this browser.',journey:'Choose a journey',amount:'Amount (BDT)',paidBy:'Paid by',category:'Category',description:'Expense description',split:'Split equally across attendees',add:'Add expense',total:'Recorded total',per:'Equal share per attendee',export:'Export CSV',empty:'No expenses recorded for this journey yet.',date:'Date',remove:'Delete expense',local:'These entries stay in this browser and do not sync to Firebase yet.'};const categories=isBn?['যাতায়াত','হোটেল ও থাকা','খাবার','টিকিট','কেনাকাটা','অন্যান্য']:['Transport','Accommodation','Food','Tickets','Shopping','Other'];const saveRows=(next:ExpenseRow[])=>{setRows(next);localStorage.setItem('tv-expenses',JSON.stringify(next))};const add= (e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const form=e.currentTarget;const data=new FormData(form);const amount=Number(data.get('amount'));if(!amount||amount<=0)return;const next=[{id:crypto.randomUUID(),tripId,date:String(data.get('date')||''),title:String(data.get('title')||''),category:String(data.get('category')||''),amount,paidBy:String(data.get('paidBy')||''),split:data.get('split')==='on'},...rows];saveRows(next);form.reset();setNotice(isBn?'খরচটি সংরক্ষণ হয়েছে।':'Expense saved.');window.setTimeout(()=>setNotice(''),2500)};const exportCsv=()=>{const columns=['Date','Journey','Category','Description','Amount BDT','Paid by','Split equally'];const lines=current.map(row=>[row.date,selected?.title??'',row.category,row.title,row.amount,row.paidBy,row.split?'yes':'no']);const csv=[columns,...lines].map(line=>line.map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\r\n');const link=document.createElement('a');link.href=URL.createObjectURL(new Blob(['\\uFEFF',csv],{type:'text/csv;charset=utf-8'}));link.download=`travelvista-${tripId}-expenses.csv`;link.click();URL.revokeObjectURL(link.href)};return <main className="subpage wrap"><div className="page-title"><span className="section-kicker">BDT · EXPENSE NOTES</span><h1>{labels.title}</h1><p>{labels.sub}</p></div><div className="expense-controls"><label>{labels.journey}<select value={tripId} onChange={event=>setTripId(event.target.value)}>{trips.map(trip=><option key={trip.id} value={trip.id}>{trip.title} · {trip.place}</option>)}</select></label><button className="button button-outline" onClick={exportCsv} disabled={!current.length}><ArrowDown size={16}/>{labels.export}</button></div><div className="expense-summary"><div><span>{labels.total}</span><strong>৳ {total.toLocaleString(isBn?'bn-BD':'en-BD')}</strong></div><div><span>{labels.per}</span><strong>৳ {selected?Math.round(total/Math.max(1,selected.count)).toLocaleString(isBn?'bn-BD':'en-BD'):'0'}</strong></div></div><div className="expense-layout"><form className="contact-form expense-form" onSubmit={add}><label>{labels.description}<input name="title" required maxLength={120}/></label><div className="form-row"><label>{labels.category}<select name="category">{categories.map(category=><option key={category}>{category}</option>)}</select></label><label>{labels.amount}<input name="amount" type="number" min="1" step="1" required/></label></div><div className="form-row"><label>{labels.paidBy}<input name="paidBy" required maxLength={80}/></label><label>{labels.date}<input name="date" type="date" required defaultValue={new Date().toISOString().slice(0,10)}/></label></div><label className="check-row"><input name="split" type="checkbox" defaultChecked/>{labels.split}</label><button className="button button-pink" type="submit"><Plus size={16}/>{labels.add}</button>{notice&&<p role="status" className="form-status">{notice}</p>}<p className="form-footnote">{labels.local}</p></form><div className="expense-list">{current.length?current.map(row=><article className="expense-row" key={row.id}><div className="expense-row-main"><span>{row.category} · {row.date}</span><strong>{row.title}</strong><small>{isBn?'দিয়েছেন':'Paid by'} {row.paidBy} · {row.split?(isBn?'সবার মধ্যে ভাগ':'shared equally'):(isBn?'ব্যক্তিগত':'individual')}</small></div><strong className="expense-amount">৳ {row.amount.toLocaleString(isBn?'bn-BD':'en-BD')}</strong><button className="icon-button" aria-label={labels.remove} title={labels.remove} onClick={()=>saveRows(rows.filter(expense=>expense.id!==row.id))}><X size={15}/></button></article>):<div className="empty-state"><Wallet/><p>{labels.empty}</p></div>}</div></div></main>}

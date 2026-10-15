import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpDown, Check, Compass, Edit3, Image, LoaderCircle, MapPin, Plus, Search, Trash2, Users, Wallet, X } from 'lucide-react'
import { firebaseConfigured, requireFirebaseApp } from '../../services/firebaseApp'
import type { AdminTourData, LegacyTrip, TourFriend, TourRecord, TourStatus } from '../../types/tour'

type Language = 'bn' | 'en'
type Props = { language: Language; legacyTrips: LegacyTrip[]; fallbackFriends: TourFriend[] }
type LoadState = 'loading' | 'demo' | 'firebase' | 'guest' | 'denied'
type TourFormValues = Omit<TourRecord, 'id' | 'createdAt' | 'updatedAt' | 'recordedExpenseTotal'>

const blankTour = (): TourFormValues => ({
  title: '', destination: '', startDate: '', endDate: '', coverImageUrl: '', description: '', story: '',
  itinerary: '', travelDetails: '', attendeeIds: [], albumIds: [], status: 'draft',
})

const labels = {
  bn: {
    title: 'অ্যাডমিন ড্যাশবোর্ড', subtitle: 'আমাদের ভ্রমণ, মানুষ, অ্যালবাম ও রেকর্ড করা খরচ এক জায়গায়।',
    tours: 'মোট ভ্রমণ', destinations: 'গন্তব্য', friends: 'বন্ধু', albums: 'অ্যালবাম', expenses: 'রেকর্ড করা খরচ',
    add: 'নতুন ভ্রমণ', search: 'নাম বা গন্তব্য খুঁজুন', filterStatus: 'প্রকাশের অবস্থা', all: 'সব', draft: 'খসড়া', published: 'প্রকাশিত', sort: 'সাজান', startNewest: 'সাম্প্রতিক তারিখ আগে', startOldest: 'পুরোনো তারিখ আগে', titleAZ: 'নাম: ক থেকে য়', expensesHigh: 'খরচ: বেশি আগে', destination: 'গন্তব্য', date: 'ভ্রমণের তারিখ', attendees: 'সঙ্গী', recorded: 'খরচ', actions: 'কাজ', view: 'বিস্তারিত', edit: 'সম্পাদনা', remove: 'মুছুন', empty: 'এই ফিল্টারে কোনো ভ্রমণ নেই।', loading: 'ভ্রমণের তথ্য আনা হচ্ছে…', loadError: 'তথ্য আনা যায়নি। Firebase অনুমতি ও সংযোগ যাচাই করুন।', retry: 'আবার চেষ্টা করুন', demo: 'লোকাল ডেমো মোড', demoNote: 'এই ব্রাউজারে সংরক্ষিত। Firebase-এ সিঙ্ক হচ্ছে না।', cloud: 'Firebase / Firestore', cloudNote: 'অ্যাডমিন অ্যাক্সেস Firebase custom claim দিয়ে যাচাই করা হচ্ছে।', localCRUD: 'ডেমো মোডে সম্পাদনাগুলো শুধু এই ব্রাউজারে থাকবে।', loginTitle: 'অ্যাডমিন হিসেবে প্রবেশ করুন', loginText: 'এই ড্যাশবোর্ড দেখতে অনুমোদিত অ্যাডমিন অ্যাকাউন্ট প্রয়োজন।', login: 'লগইন', denied: 'এই অ্যাকাউন্টে অ্যাডমিন অনুমতি নেই।', back: 'ড্যাশবোর্ডে ফিরুন', itinerary: 'ভ্রমণসূচি', details: 'যাতায়াত ও থাকার তথ্য', description: 'সংক্ষিপ্ত বিবরণ', story: 'ভ্রমণের গল্প', cover: 'কভার ছবির URL', album: 'সংযুক্ত অ্যালবাম', status: 'অবস্থা', createTitle: 'নতুন ভ্রমণ', save: 'সংরক্ষণ করুন', cancel: 'বাতিল', start: 'শুরুর তারিখ', end: 'শেষের তারিখ', selectFriends: 'যেসব বন্ধু গিয়েছিলেন', selectAlbums: 'অ্যালবাম বাছুন', noFriends: 'বন্ধু রেকর্ড নেই। বন্ধুর নাম না জানলে কোনো নাম যোগ করা হবে না।', noAlbums: 'অ্যালবাম রেকর্ড নেই।', required: 'শিরোনাম, গন্তব্য ও দুইটি তারিখ দিন।', dateError: 'শেষের তারিখ শুরুর তারিখের আগে হতে পারবে না।', urlError: 'কভার ছবির জন্য একটি সঠিক HTTP/HTTPS URL দিন।', deleteTitle: 'ভ্রমণ মুছবেন?', deletePrompt: 'এই ভ্রমণটি মুছে ফেললে এর রেকর্ড আর ফিরিয়ে আনা যাবে না।', deleted: 'ভ্রমণ মুছে ফেলা হয়েছে।', saved: 'ভ্রমণ সংরক্ষিত হয়েছে।', saveError: 'সংরক্ষণ করা যায়নি।', deleteError: 'মুছে ফেলা যায়নি।', validation: 'ফর্মের তথ্য ঠিক করে আবার চেষ্টা করুন।', itineraryEmpty: 'ভ্রমণসূচি যোগ করা হয়নি।', noAttendees: 'সঙ্গী বন্ধু নির্দিষ্ট করা হয়নি।', noStory: 'এই ভ্রমণের গল্প এখনো যোগ করা হয়নি।', recordedTotal: 'মোট রেকর্ড করা খরচ', estimate: 'পুরোনো নমুনা খরচ (রেকর্ড করা খরচ নয়)', close: 'বন্ধ', saving: 'সংরক্ষণ হচ্ছে…', allDestinations: 'সব গন্তব্য', loadingTitle: 'অ্যাডমিন অনুমতি যাচাই হচ্ছে…',
  },
  en: {
    title: 'Admin dashboard', subtitle: 'Manage our journeys, people, albums and recorded costs in one place.',
    tours: 'Total tours', destinations: 'Destinations', friends: 'Friends', albums: 'Albums', expenses: 'Recorded expenses',
    add: 'New tour', search: 'Search title or destination', filterStatus: 'Publication status', all: 'All', draft: 'Draft', published: 'Published', sort: 'Sort', startNewest: 'Newest date first', startOldest: 'Oldest date first', titleAZ: 'Title A–Z', expensesHigh: 'Highest costs', destination: 'Destination', date: 'Travel dates', attendees: 'Attendees', recorded: 'Recorded', actions: 'Actions', view: 'Details', edit: 'Edit', remove: 'Delete', empty: 'No tours match these filters.', loading: 'Loading tour records…', loadError: 'Could not load records. Check Firebase access and connection.', retry: 'Try again', demo: 'Local demo mode', demoNote: 'Stored in this browser only. Nothing is synced to Firebase.', cloud: 'Firebase / Firestore', cloudNote: 'Administrator access is checked through a Firebase custom claim.', localCRUD: 'Demo edits are stored in this browser only.', loginTitle: 'Administrator sign-in required', loginText: 'An approved administrator account is required to view this dashboard.', login: 'Sign in', denied: 'This account does not have administrator access.', back: 'Back to dashboard', itinerary: 'Itinerary', details: 'Transport and accommodation', description: 'Short description', story: 'Trip story', cover: 'Cover image URL', album: 'Linked albums', status: 'Status', createTitle: 'Create a tour', save: 'Save tour', cancel: 'Cancel', start: 'Start date', end: 'End date', selectFriends: 'Friends who attended', selectAlbums: 'Choose albums', noFriends: 'No friend records yet. We will not invent attendee names.', noAlbums: 'No album records yet.', required: 'Enter a title, destination, start date and end date.', dateError: 'The end date cannot be before the start date.', urlError: 'Enter a valid HTTP or HTTPS image URL.', deleteTitle: 'Delete this tour?', deletePrompt: 'Deleting this tour removes its record permanently.', deleted: 'Tour deleted.', saved: 'Tour saved.', saveError: 'Could not save the tour.', deleteError: 'Could not delete the tour.', validation: 'Correct the form details and try again.', itineraryEmpty: 'No itinerary has been added.', noAttendees: 'No attending friends have been assigned.', noStory: 'A trip story has not been added yet.', recordedTotal: 'Total recorded expenses', estimate: 'Legacy sample cost (not a recorded expense)', close: 'Close', saving: 'সংরক্ষণ হচ্ছে…', allDestinations: 'সব গন্তব্য', loadingTitle: 'অ্যাডমিন অনুমতি যাচাই হচ্ছে…',
  },
} as const

type Copy = (typeof labels)[Language]

function getFriendName(friend: TourFriend) {
  return friend.nickname ? `${friend.name} (${friend.nickname})` : friend.name
}

function calcExpenseTotal(data: AdminTourData, tourId: string) {
  return data.expenses.filter((expense) => expense.tourId === tourId).reduce((sum, expense) => sum + expense.amount, 0)
}

function DisplayCover({ tour, className = '' }: { tour: TourRecord; className?: string }) {
  const [failed, setFailed] = useState(false)
  return tour.coverImageUrl && !failed
    ? <img className={`tour-cover-image ${className}`} src={tour.coverImageUrl} alt={tour.title} loading="lazy" onError={() => setFailed(true)} />
    : <div className={`tour-cover-fallback art-${tour.legacyImageKey || 'sajek'} ${className}`} aria-label={tour.title}><span className="image-sun"/><span className="mountain mountain-back"/><span className="mountain mountain-front"/><span className="art-grass"/></div>
}

export default function AdminToursPage({ language, legacyTrips, fallbackFriends }: Props) {
  const t = labels[language]
  const navigate = useNavigate()
  const { tourId } = useParams()
  const [access, setAccess] = useState<LoadState>(() => firebaseConfigured ? 'loading' : 'demo')
  const [data, setData] = useState<AdminTourData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TourStatus>('all')
  const [destinationFilter, setDestinationFilter] = useState('all')
  const [sort, setSort] = useState('start-newest')
  const [editor, setEditor] = useState<TourRecord | null | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!firebaseConfigured) return
    let unsubscribe = () => {}
    let live = true
    void import('firebase/auth').then(({ getAuth, getIdTokenResult, onAuthStateChanged }) => {
        unsubscribe = onAuthStateChanged(getAuth(requireFirebaseApp()), (user) => {
          if (!live) return
          if (!user) { setAccess('guest'); setData(null); return }
          void getIdTokenResult(user).then((token) => {
            if (!live) return
            const isAdmin = token.claims.admin === true
            setAccess(isAdmin ? 'firebase' : 'denied')
            if (!isAdmin) setData(null)
          }).catch(() => { if (live) setAccess('denied') })
        })
    }).catch(() => { if (live) setAccess('denied') })
    return () => { live = false; unsubscribe() }
  }, [])

  const refresh = async () => {
    if (access !== 'demo' && access !== 'firebase') return
    setLoading(true)
    setError('')
    try {
      const repository = await import('../../services/tourRepository')
      const result = await repository.loadAdminTourData(legacyTrips, fallbackFriends)
      setData(result)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t.loadError
      setError(message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (access === 'demo' || access === 'firebase') void refresh()
    // refresh intentionally follows auth/mode changes; source data remains stable during this page visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access])

  const destinations = useMemo(() => [...new Set((data?.tours ?? []).map((tour) => tour.destination).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [data?.tours])
  const filteredTours = useMemo(() => {
    if (!data) return []
    const needle = query.trim().toLocaleLowerCase()
    const result = data.tours.filter((tour) => {
      const matchesSearch = !needle || `${tour.title} ${tour.destination}`.toLocaleLowerCase().includes(needle)
      return matchesSearch && (statusFilter === 'all' || tour.status === statusFilter) && (destinationFilter === 'all' || tour.destination === destinationFilter)
    })
    return result.sort((a, b) => {
      if (sort === 'start-oldest') return a.startDate.localeCompare(b.startDate)
      if (sort === 'title') return a.title.localeCompare(b.title)
      if (sort === 'expense') return calcExpenseTotal(data, b.id) - calcExpenseTotal(data, a.id)
      return b.startDate.localeCompare(a.startDate)
    })
  }, [data, query, statusFilter, destinationFilter, sort])

  const selectedTour = data?.tours.find((tour) => tour.id === tourId)
  const save = async (values: TourFormValues) => {
    if (!data) return
    setSaving(true)
    setError('')
    try {
      const repository = await import('../../services/tourRepository')
      const id = editor?.id ?? `local-${crypto.randomUUID()}`
      const saved = await repository.saveManagedTour({ ...values, id }, data.tours, data.mode)
      setNotice(t.saved)
      setEditor(undefined)
      if (data.mode === 'firebase') await refresh()
      else setData({ ...data, tours: data.tours.some((tour) => tour.id === saved.id) ? data.tours.map((tour) => tour.id === saved.id ? saved : tour) : [...data.tours, saved] })
      if (tourId) navigate(`/admin/tours/${saved.id}`)
      window.setTimeout(() => setNotice(''), 3200)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.saveError)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (tour: TourRecord) => {
    if (!data) return
    const accepted = window.confirm(`${t.deleteTitle}\n\n${tour.title}\n${t.deletePrompt}`)
    if (!accepted) return
    setError('')
    try {
      const repository = await import('../../services/tourRepository')
      await repository.deleteManagedTour(tour.id, data.tours, data.mode)
      setData({ ...data, tours: data.tours.filter((item) => item.id !== tour.id) })
      if (tourId === tour.id) navigate('/admin')
      setNotice(t.deleted)
      window.setTimeout(() => setNotice(''), 3200)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.deleteError)
    }
  }

  if (access === 'loading') return <main className="subpage wrap admin-state"><LoaderCircle className="spin"/><h1>{t.loadingTitle}</h1></main>
  if (access === 'guest') return <main className="subpage wrap admin-state"><span className="section-kicker">PRIVATE CONTROL ROOM</span><h1>{t.loginTitle}</h1><p>{t.loginText}</p><Link to="/login" className="button button-pink">{t.login}<ArrowRight size={16}/></Link></main>
  if (access === 'denied') return <main className="subpage wrap admin-state"><span className="section-kicker">403 · FORBIDDEN</span><h1>{t.denied}</h1><Link to="/" className="text-link">{t.back}<ArrowRight size={15}/></Link></main>

  if (loading && !data) return <main className="subpage wrap admin-state"><LoaderCircle className="spin"/><h1>{t.loading}</h1></main>
  if (error && !data) return <main className="subpage wrap admin-state"><p className="admin-error" role="alert">{t.loadError}<br/><small>{error}</small></p><button className="button button-outline" onClick={() => void refresh()}>{t.retry}</button></main>
  if (!data) return null

  if (tourId) {
    if (!selectedTour) return <main className="subpage wrap admin-state"><p>{loading ? t.loading : t.empty}</p><Link to="/admin" className="text-link"><ArrowLeft size={15}/>{t.back}</Link></main>
    return <>
      <TourDetail tour={selectedTour} data={data} t={t} onBack={() => navigate('/admin')} onEdit={() => setEditor(selectedTour)} />
      {editor !== undefined && <TourEditor tour={editor} friends={data.friends} albums={data.albums} t={t} language={language} saving={saving} error={error} onClose={() => { setEditor(undefined); setError('') }} onSave={save} />}
      {error && <div className="tour-toast error-toast" role="alert">{error}</div>}
    </>
  }

  const recordedTotal = data.expenses.reduce((sum, item) => sum + item.amount, 0)
  const summary = [
    { label: t.tours, value: data.tours.length, icon: Compass },
    { label: t.destinations, value: destinations.length, icon: MapPin },
    { label: t.friends, value: data.friends.length, icon: Users },
    { label: t.albums, value: data.albums.length, icon: Image },
    { label: t.expenses, value: `৳ ${recordedTotal.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-BD')}`, icon: Wallet },
  ]

  return <main className="subpage wrap tour-admin-page">
    <div className="admin-heading-row"><div className="page-title"><span className="section-kicker">TRAVELVISTA · CONTROL ROOM</span><h1>{t.title}</h1><p>{t.subtitle}</p></div><button className="button button-pink" onClick={() => setEditor(null)}><Plus size={16}/>{t.add}</button></div>
    <div className={`mode-banner ${data.mode}`}><span className="mode-indicator"/><div><strong>{data.mode === 'demo' ? t.demo : t.cloud}</strong><p>{data.mode === 'demo' ? t.demoNote : t.cloudNote}</p></div></div>
    <section className="admin-summary tour-summary" aria-label={t.title}>{summary.map(({ label, value, icon: Icon }) => <article key={label}><Icon/><span>{label}</span><strong>{value}</strong></article>)}</section>
    <section className="tour-management-panel"><div className="tour-panel-heading"><div><h2>{t.tours}</h2><span>{data.tours.length} · {filteredTours.length} {language === 'bn' ? 'দেখানো হচ্ছে' : 'shown'}</span></div><button className="button button-outline" onClick={() => void refresh()} disabled={loading}><ArrowDown size={15}/>{loading ? t.loading : t.retry}</button></div>
      <div className="tour-toolbar"><label className="search-box"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search}/></label><label><span>{t.destination}</span><select value={destinationFilter} onChange={(event) => setDestinationFilter(event.target.value)}><option value="all">{t.allDestinations}</option>{destinations.map((destination) => <option key={destination}>{destination}</option>)}</select></label><label><span>{t.filterStatus}</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | TourStatus)}><option value="all">{t.all}</option><option value="draft">{t.draft}</option><option value="published">{t.published}</option></select></label><label><span><ArrowUpDown size={13}/>{t.sort}</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="start-newest">{t.startNewest}</option><option value="start-oldest">{t.startOldest}</option><option value="title">{t.titleAZ}</option><option value="expense">{t.expensesHigh}</option></select></label></div>
      {error && <div className="admin-error" role="alert">{t.saveError} {error}</div>}{notice && <div className="admin-success" role="status"><Check size={15}/>{notice}</div>}
      {loading ? <div className="admin-loading"><LoaderCircle className="spin"/>{t.loading}</div> : filteredTours.length === 0 ? <div className="empty-state tour-empty"><Compass/><p>{t.empty}</p></div> : <div className="tour-table-wrap"><table className="tour-table"><thead><tr><th>{t.destination}</th><th>{t.date}</th><th>{t.attendees}</th><th>{t.recorded}</th><th>{t.status}</th><th>{t.actions}</th></tr></thead><tbody>{filteredTours.map((tour) => <TourTableRow key={tour.id} tour={tour} data={data} t={t} language={language} onEdit={() => setEditor(tour)} onDelete={() => void remove(tour)} />)}</tbody></table></div>}{filteredTours.some((tour) => tour.legacyCostEstimate) && <p className="demo-footnote">* {t.estimate}</p>}
    </section>
    {data.mode === 'demo' && <p className="demo-footnote">{t.localCRUD}</p>}
    {editor !== undefined && <TourEditor tour={editor} friends={data.friends} albums={data.albums} t={t} language={language} saving={saving} error={error} onClose={() => { setEditor(undefined); setError('') }} onSave={save} />}
  </main>
}

function TourTableRow({ tour, data, t, language, onEdit, onDelete }: { tour: TourRecord; data: AdminTourData; t: Copy; language: Language; onEdit: () => void; onDelete: () => void }) {
  const attendeeNames = tour.attendeeIds.map((id) => data.friends.find((friend) => friend.id === id)?.name).filter(Boolean)
  const total = calcExpenseTotal(data, tour.id)
  return <tr>
    <td><div className="tour-table-title"><Link to={`/admin/tours/${tour.id}`}><DisplayCover tour={tour} className="tour-table-cover"/><span><strong>{tour.title}</strong><small><MapPin size={12}/>{tour.destination}</small></span></Link></div></td>
    <td>{tour.startDate && tour.endDate ? `${tour.startDate} — ${tour.endDate}` : tour.legacyDateLabel || '—'}</td>
    <td>{attendeeNames.length ? attendeeNames.join(', ') : tour.legacyAttendeeCount ? `${tour.legacyAttendeeCount} ${language === 'bn' ? 'জন' : 'people'} · ${t.noAttendees}` : '—'}</td>
    <td className="table-cost">৳ {total.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-BD')}{tour.legacyCostEstimate ? <small title={t.estimate}>+ {tour.legacyCostEstimate.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-BD')}*</small> : null}</td>
    <td><span className={`status-pill ${tour.status}`}>{tour.status === 'draft' ? t.draft : t.published}</span></td>
    <td><div className="tour-row-actions"><Link className="icon-button" to={`/admin/tours/${tour.id}`} aria-label={t.view} title={t.view}><ArrowRight size={15}/></Link><button className="icon-button" onClick={onEdit} aria-label={t.edit} title={t.edit}><Edit3 size={15}/></button><button className="icon-button danger-action" onClick={onDelete} aria-label={t.remove} title={t.remove}><Trash2 size={15}/></button></div></td>
  </tr>
}

function TourEditor({ tour, friends, albums, t, language, saving, error, onClose, onSave }: { tour: TourRecord | null; friends: TourFriend[]; albums: AdminTourData['albums']; t: Copy; language: Language; saving: boolean; error: string; onClose: () => void; onSave: (values: TourFormValues) => Promise<void> }) {
  const [values, setValues] = useState<TourFormValues>(() => tour ? { ...tour, attendeeIds: [...tour.attendeeIds], albumIds: [...tour.albumIds] } : blankTour())
  const [validation, setValidation] = useState('')
  const update = <K extends keyof TourFormValues>(key: K, value: TourFormValues[K]) => setValues((previous) => ({ ...previous, [key]: value }))
  const toggleId = (key: 'attendeeIds' | 'albumIds', id: string) => update(key, values[key].includes(id) ? values[key].filter((item) => item !== id) : [...values[key], id])
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setValidation('')
    if (!values.title.trim() || !values.destination.trim() || !values.startDate || !values.endDate) { setValidation(t.required); return }
    if (values.endDate < values.startDate) { setValidation(t.dateError); return }
    if (values.coverImageUrl) {
      try { const url = new URL(values.coverImageUrl); if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error() } catch { setValidation(t.urlError); return }
    }
    void onSave({ ...values, title: values.title.trim(), destination: values.destination.trim() })
  }
  return <AnimatePresence><div className="tour-editor-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}><motion.section className="tour-editor" role="dialog" aria-modal="true" aria-labelledby="tour-editor-title" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
    <header className="tour-editor-header"><div><span className="section-kicker">TOUR MANAGEMENT</span><h2 id="tour-editor-title">{tour ? `${t.edit}: ${tour.title}` : t.createTitle}</h2></div><button className="icon-button" onClick={onClose} disabled={saving} aria-label={t.close}><X size={17}/></button></header>
    <form className="tour-editor-form" onSubmit={submit}>
      <div className="editor-grid"><label>{language === 'bn' ? 'ভ্রমণের শিরোনাম' : 'Tour title'}<input autoFocus maxLength={120} value={values.title} onChange={(event) => update('title', event.target.value)} required/></label><label>{t.destination}<input maxLength={120} value={values.destination} onChange={(event) => update('destination', event.target.value)} required/></label><label>{t.start}<input type="date" value={values.startDate} onChange={(event) => update('startDate', event.target.value)} required/></label><label>{t.end}<input type="date" min={values.startDate || undefined} value={values.endDate} onChange={(event) => update('endDate', event.target.value)} required/></label><label className="editor-span-two">{t.cover}<input type="url" maxLength={2048} value={values.coverImageUrl} onChange={(event) => update('coverImageUrl', event.target.value)} placeholder="https://…"/><small>{language === 'bn' ? 'ছবির URL দিন; খালি রাখলে নমুনা কভার দেখা যাবে।' : 'Enter an image URL. Leave blank to use the sample cover.'}</small></label><label>{t.status}<select value={values.status} onChange={(event) => update('status', event.target.value as TourStatus)}><option value="draft">{t.draft}</option><option value="published">{t.published}</option></select></label><label>{t.description}<input maxLength={300} value={values.description} onChange={(event) => update('description', event.target.value)}/></label><label className="editor-span-two">{t.story}<textarea rows={4} maxLength={10000} value={values.story} onChange={(event) => update('story', event.target.value)}/></label><label className="editor-span-two">{t.itinerary}<textarea rows={4} maxLength={6000} value={values.itinerary} onChange={(event) => update('itinerary', event.target.value)} placeholder={language === 'bn' ? 'প্রতি দিনের পরিকল্পনা আলাদা লাইনে লিখুন' : 'Put each day or stop on a separate line'}/></label><label className="editor-span-two">{t.details}<textarea rows={3} maxLength={3000} value={values.travelDetails} onChange={(event) => update('travelDetails', event.target.value)}/></label></div>
      <fieldset className="editor-choice"><legend>{t.selectFriends}</legend>{friends.length ? <div className="editor-check-grid">{friends.map((friend) => <label key={friend.id}><input type="checkbox" checked={values.attendeeIds.includes(friend.id)} onChange={() => toggleId('attendeeIds', friend.id)}/><span>{getFriendName(friend)}</span></label>)}</div> : <p>{t.noFriends}</p>}</fieldset>
      <fieldset className="editor-choice"><legend>{t.selectAlbums}</legend>{albums.length ? <div className="editor-check-grid">{albums.map((album) => <label key={album.id}><input type="checkbox" checked={values.albumIds.includes(album.id)} onChange={() => toggleId('albumIds', album.id)}/><span>{album.title}</span></label>)}</div> : <p>{t.noAlbums}</p>}</fieldset>
      {(validation || error) && <div className="admin-error" role="alert">{validation || error}</div>}
      <footer className="tour-editor-footer"><button type="button" className="button button-outline" onClick={onClose} disabled={saving}>{t.cancel}</button><button className="button button-pink" type="submit" disabled={saving}>{saving && <LoaderCircle className="spin" size={15}/>} {saving ? t.saving : t.save}</button></footer>
    </form>
  </motion.section></div></AnimatePresence>
}

function TourDetail({ tour, data, t, onBack, onEdit }: { tour: TourRecord; data: AdminTourData; t: Copy; onBack: () => void; onEdit: () => void }) {
  const attendeeNames = tour.attendeeIds.map((id) => data.friends.find((friend) => friend.id === id)).filter((friend): friend is TourFriend => Boolean(friend))
  const linkedAlbums = tour.albumIds.map((id) => data.albums.find((album) => album.id === id)).filter((album): album is AdminTourData['albums'][number] => Boolean(album))
  const total = calcExpenseTotal(data, tour.id)
  return <main className="subpage wrap tour-detail-page"><button className="back-link" onClick={onBack}><ArrowLeft size={15}/>{t.back}</button><div className="admin-detail-cover"><DisplayCover tour={tour}/><div className="admin-detail-cover-overlay"><span className={`status-pill ${tour.status}`}>{tour.status === 'draft' ? t.draft : t.published}</span><h1>{tour.title}</h1><span><MapPin size={15}/>{tour.destination}</span></div></div><div className="admin-detail-heading"><div><span className="section-kicker">{tour.startDate && tour.endDate ? `${tour.startDate} — ${tour.endDate}` : tour.legacyDateLabel}</span><h2>{tour.destination}</h2></div><button className="button button-pink" onClick={onEdit}><Edit3 size={15}/>{t.edit}</button></div><div className="admin-detail-grid"><section className="tour-content-card"><span className="section-kicker">{t.description}</span><p>{tour.description || '—'}</p><h3>{t.story}</h3><p className="preserve-lines">{tour.story || t.noStory}</p><h3>{t.itinerary}</h3><p className="preserve-lines">{tour.itinerary || t.itineraryEmpty}</p><h3>{t.details}</h3><p className="preserve-lines">{tour.travelDetails || '—'}</p></section><aside className="tour-facts-card"><h3><Users size={17}/>{t.attendees}</h3>{attendeeNames.length ? <ul className="attendee-list">{attendeeNames.map((friend) => <li key={friend.id}><span>{friend.name.slice(0, 1)}</span><div><strong>{friend.name}</strong>{friend.nickname && <small>{friend.nickname}</small>}</div></li>)}</ul> : <p>{tour.legacyAttendeeCount ? `${tour.legacyAttendeeCount} ${t.attendees} · ${t.noAttendees}` : t.noAttendees}</p>}<h3><Image size={17}/>{t.album}</h3>{linkedAlbums.length ? <ul>{linkedAlbums.map((album) => <li key={album.id}>{album.title}</li>)}</ul> : <p>{t.noAlbums}</p>}<h3><Wallet size={17}/>{t.recordedTotal}</h3><strong className="detail-total">৳ {total.toLocaleString()}</strong>{tour.legacyCostEstimate ? <small className="legacy-estimate">{t.estimate}: ৳ {tour.legacyCostEstimate.toLocaleString()}</small> : null}</aside></div></main>
}

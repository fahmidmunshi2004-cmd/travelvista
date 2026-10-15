import { useEffect, useState, type FormEvent } from 'react'
import { Check, Edit3, Image, LoaderCircle, Plus, Save, Settings2, Trash2, Users, Video, BookOpen } from 'lucide-react'
import { getAuth, onAuthStateChanged, getIdTokenResult } from 'firebase/auth'
import { firebaseConfigured, requireFirebaseApp } from '../../services/firebaseApp'
import { defaultSiteSettings, loadAdminContent, saveSiteSettings, saveContentRecord, deleteContentRecord, type SiteSettings } from '../../services/contentRepository'

type Language = 'bn' | 'en'
type ContentItem = { id: string; [key: string]: unknown }
type CollectionName = 'friends' | 'albums' | 'journalPosts'
type Section = 'site' | 'friends' | 'albums' | 'journal'
const labels = {
  bn: { title: 'সাইট কনটেন্ট ও সেটিংস', subtitle: 'Firestore-এ সংরক্ষিত তথ্য এখান থেকে সম্পাদনা করুন।', site: 'সাইট পরিচিতি', friends: 'বন্ধুরা', albums: 'গ্যালারি ও ভিডিও', journal: 'জার্নাল', save: 'পরিবর্তন সংরক্ষণ', saved: 'Firestore-এ সংরক্ষিত হয়েছে।', add: 'নতুন যোগ করুন', edit: 'সম্পাদনা', remove: 'মুছুন', name: 'নাম', nickname: 'ডাকনাম', avatar: 'প্রোফাইল ছবির URL', bio: 'পরিচিতি', titleField: 'শিরোনাম', tagline: 'ট্যাগলাইন', heroTitle: 'হোম হেডিং', heroText: 'হোম পরিচিতি', about: 'আমাদের সম্পর্কে', heroImage: 'হিরো ছবির URL', logo: 'লোগোর URL', accent: 'অ্যাকসেন্ট রং', social: 'সোশ্যাল লিংক', facebook: 'Facebook URL', instagram: 'Instagram URL', youtube: 'YouTube URL', tiktok: 'TikTok URL', destination: 'গন্তব্য', cover: 'কভার ছবির URL', caption: 'বর্ণনা', media: 'ছবি/ভিডিও URL — প্রতি লাইনে একটি', visible: 'সদস্যদের দেখান', published: 'প্রকাশিত', category: 'বিভাগ', excerpt: 'সংক্ষিপ্ত লেখা', story: 'সম্পূর্ণ গল্প', loading: 'তথ্য লোড হচ্ছে…', denied: 'এই account-এ admin permission নেই।', loadError: 'Firestore থেকে তথ্য আনা যায়নি। Rules ও connection পরীক্ষা করুন।', empty: 'এখনো কোনো রেকর্ড নেই।', required: 'প্রয়োজনীয় তথ্য পূরণ করুন।' },
  en: { title: 'Site content & settings', subtitle: 'Edit content stored in Firestore.', site: 'Site identity', friends: 'Friends', albums: 'Gallery & video', journal: 'Journal', save: 'Save changes', saved: 'Saved to Firestore.', add: 'Add new', edit: 'Edit', remove: 'Delete', name: 'Name', nickname: 'Nickname', avatar: 'Profile image URL', bio: 'Bio', titleField: 'Title', tagline: 'Tagline', heroTitle: 'Home heading', heroText: 'Home introduction', about: 'About us', heroImage: 'Hero image URL', logo: 'Logo URL', accent: 'Accent color', social: 'Social links', facebook: 'Facebook URL', instagram: 'Instagram URL', youtube: 'YouTube URL', tiktok: 'TikTok URL', destination: 'Destination', cover: 'Cover image URL', caption: 'Caption', media: 'Image/video URLs — one per line', visible: 'Visible to members', published: 'Published', category: 'Category', excerpt: 'Short excerpt', story: 'Full story', loading: 'Loading content…', denied: 'This account does not have administrator access.', loadError: 'Could not load Firestore content. Check rules and connection.', empty: 'No records yet.', required: 'Complete the required fields.' },
} as const

export default function AdminContentPage({ language }: { language: Language }) {
  const t = labels[language]
  const [section, setSection] = useState<Section>('site')
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied'>('checking')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [friends, setFriends] = useState<ContentItem[]>([])
  const [albums, setAlbums] = useState<ContentItem[]>([])
  const [journal, setJournal] = useState<ContentItem[]>([])
  const [editing, setEditing] = useState<ContentItem | null>(null)

  const refresh = async () => {
    setLoading(true); setError('')
    try {
      const data = await loadAdminContent()
      setSettings(data.settings); setFriends(data.friends as ContentItem[]); setAlbums(data.albums as ContentItem[]); setJournal(data.journal as ContentItem[])
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!firebaseConfigured) { setAccess('denied'); setLoading(false); return }
    return onAuthStateChanged(getAuth(requireFirebaseApp()), user => {
      if (!user) { setAccess('denied'); setLoading(false); return }
      void getIdTokenResult(user).then(token => {
        const admin = token.claims.admin === true
        setAccess(admin ? 'allowed' : 'denied')
        if (admin) void refresh()
        else setLoading(false)
      }).catch(() => { setAccess('denied'); setLoading(false) })
    })
  }, [])

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    if (![settings.heroImageUrl, settings.logoUrl].every(isAllowedAssetUrl)) { setSaving(false); setError(language === 'bn' ? 'ছবি ও লোগোর URL HTTP/HTTPS বা /assets/ path হতে হবে।' : 'Image and logo URLs must use HTTP/HTTPS or a local /assets/ path.'); return }
    try { await saveSiteSettings(settings); setNotice(t.saved); window.setTimeout(() => setNotice(''), 3000) }
    catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError) }
    finally { setSaving(false) }
  }

  const saveRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!section || section === 'site') return
    const form = event.currentTarget
    const values = new FormData(form)
    const required = section === 'friends' ? ['name'] : ['title']
    if (required.some(key => !String(values.get(key) || '').trim())) { setError(t.required); return }
    const imageFields = ['avatarUrl', 'coverImageUrl']
    if (imageFields.some(key => !isAllowedAssetUrl(String(values.get(key) || ''))) || (section === 'albums' && String(values.get('media') || '').split(/\r?\n/).some(url => url.trim() && !isAllowedAssetUrl(url.trim())))) { setError(language === 'bn' ? 'ছবি/ভিডিও URL HTTP বা HTTPS হতে হবে।' : 'Image and video URLs must use HTTP or HTTPS.'); return }
    setSaving(true); setError(''); setNotice('')
    try {
      let collectionName: CollectionName
      let record: Record<string, unknown>
      if (section === 'friends') {
        collectionName = 'friends'
        record = { name: String(values.get('name')).trim(), nickname: String(values.get('nickname') || '').trim(), avatarUrl: String(values.get('avatarUrl') || '').trim(), bio: String(values.get('bio') || '').trim(), visibleToMembers: values.get('visible') === 'on' }
      } else if (section === 'albums') {
        collectionName = 'albums'
        const media = String(values.get('media') || '').split(/\r?\n/).map(url => url.trim()).filter(Boolean).map(url => ({ url, kind: /\.(mp4|webm|mov)(\?.*)?$/i.test(url) ? 'video' : 'image' }))
        record = { title: String(values.get('title')).trim(), destination: String(values.get('destination') || '').trim(), coverImageUrl: String(values.get('coverImageUrl') || '').trim(), caption: String(values.get('caption') || '').trim(), media, published: values.get('published') === 'on' }
      } else {
        collectionName = 'journalPosts'
        const title = String(values.get('title')).trim()
        record = { title, slug: title.toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]+/g, '-').replace(/^-|-$/g, ''), category: String(values.get('category') || '').trim(), excerpt: String(values.get('excerpt') || '').trim(), story: String(values.get('story') || '').trim(), coverImageUrl: String(values.get('coverImageUrl') || '').trim(), published: values.get('published') === 'on', publishedAt: new Date().toISOString() }
      }
      await saveContentRecord(collectionName, editing?.id, record)
      setEditing(null); form.reset(); setNotice(t.saved); await refresh(); window.setTimeout(() => setNotice(''), 3000)
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError) }
    finally { setSaving(false) }
  }

  const remove = async (collectionName: CollectionName, item: ContentItem) => {
    if (!window.confirm(`${t.remove}: ${String(item.name || item.title || item.id)}?`)) return
    setError('')
    try { await deleteContentRecord(collectionName, item.id); await refresh(); setNotice(t.saved) }
    catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError) }
  }

  const startEdit = (item: ContentItem) => { setEditing(item); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const sections: { id: Section; label: string; icon: typeof Settings2 }[] = [{ id: 'site', label: t.site, icon: Settings2 }, { id: 'friends', label: t.friends, icon: Users }, { id: 'albums', label: t.albums, icon: Image }, { id: 'journal', label: t.journal, icon: BookOpen }]
  const items = section === 'friends' ? friends : section === 'albums' ? albums : journal
  const collectionName: CollectionName = section === 'friends' ? 'friends' : section === 'albums' ? 'albums' : 'journalPosts'

  if (access === 'checking' || loading) return <main className="admin-loading-page"><LoaderCircle className="spin"/>{t.loading}</main>
  if (access === 'denied') return <main className="admin-loading-page"><span className="section-kicker">403 · FORBIDDEN</span><h1>{t.denied}</h1></main>

  return <main className="admin-content-page">
    <header className="admin-content-heading"><div><span className="section-kicker">TRAVELVISTA · CONTENT STUDIO</span><h1>{t.title}</h1><p>{t.subtitle}</p></div><span className="mode-pill"><i/>FIRESTORE · LIVE CONTENT</span></header>
    <nav className="content-tabs" aria-label={t.title}>{sections.map(item => <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => { setSection(item.id); setEditing(null); setError('') }}><item.icon size={16}/>{item.label}</button>)}</nav>
    {error && <div className="admin-error" role="alert">{error}</div>}{notice && <div className="admin-success" role="status"><Check size={15}/>{notice}</div>}
    {section === 'site' ? <form className="content-editor" onSubmit={saveSettings}>
      <div className="content-editor-head"><div><h2>{t.site}</h2><p>Updates here are loaded by the public site after save.</p></div><button className="button button-pink" disabled={saving}><Save size={15}/>{saving ? '…' : t.save}</button></div>
      <div className="editor-grid content-grid">
        <Field label={t.titleField} value={settings.title} onChange={value => setSettings({ ...settings, title: value })}/><Field label={t.tagline} value={settings.tagline} onChange={value => setSettings({ ...settings, tagline: value })}/>
        <Field label={t.heroTitle} value={settings.heroTitle} multiline onChange={value => setSettings({ ...settings, heroTitle: value })}/><Field label={t.heroText} value={settings.heroText} multiline onChange={value => setSettings({ ...settings, heroText: value })}/>
        <Field label={t.about} value={settings.aboutText} multiline onChange={value => setSettings({ ...settings, aboutText: value })}/><Field label={t.heroImage} value={settings.heroImageUrl} onChange={value => setSettings({ ...settings, heroImageUrl: value })}/>
        <Field label={t.logo} value={settings.logoUrl} onChange={value => setSettings({ ...settings, logoUrl: value })}/><label>{t.accent}<input type="color" value={settings.accentColor} onChange={event => setSettings({ ...settings, accentColor: event.target.value })}/></label>
      </div><h3>{t.social}</h3><div className="editor-grid content-grid">{(['facebook','instagram','youtube','tiktok'] as const).map(key => <Field key={key} label={t[key]} value={settings.socialLinks[key]} onChange={value => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, [key]: value } })}/>)}</div>
    </form> : <section className="content-manager"><div className="content-editor-head"><div><h2>{t[section]}</h2><p>{items.length} {items.length === 1 ? 'record' : 'records'} · saved in Firestore</p></div><button className="button button-pink" onClick={() => setEditing({} as ContentItem)}><Plus size={15}/>{t.add}</button></div>
      {editing && <form className="record-editor editor-grid content-grid" onSubmit={saveRecord} key={editing.id || 'new'}>
        {section === 'friends' ? <>
          <Field name="name" label={t.name} defaultValue={String(editing.name || '')} required/><Field name="nickname" label={t.nickname} defaultValue={String(editing.nickname || '')}/><Field name="avatarUrl" label={t.avatar} defaultValue={String(editing.avatarUrl || '')}/><Field name="bio" label={t.bio} defaultValue={String(editing.bio || '')}/><label className="check-row"><input type="checkbox" name="visible" defaultChecked={editing.visibleToMembers !== false}/>{t.visible}</label>
        </> : section === 'albums' ? <>
          <Field name="title" label={t.titleField} defaultValue={String(editing.title || '')} required/><Field name="destination" label={t.destination} defaultValue={String(editing.destination || '')}/><Field name="coverImageUrl" label={t.cover} defaultValue={String(editing.coverImageUrl || '')}/><Field name="caption" label={t.caption} defaultValue={String(editing.caption || '')}/><Field name="media" label={t.media} defaultValue={Array.isArray(editing.media) ? editing.media.map((item: any) => typeof item === 'string' ? item : item.url).join('\n') : ''} multiline/><label className="check-row"><input type="checkbox" name="published" defaultChecked={editing.published === true}/>{t.published}</label>
        </> : <>
          <Field name="title" label={t.titleField} defaultValue={String(editing.title || '')} required/><Field name="category" label={t.category} defaultValue={String(editing.category || '')}/><Field name="coverImageUrl" label={t.cover} defaultValue={String(editing.coverImageUrl || '')}/><Field name="excerpt" label={t.excerpt} defaultValue={String(editing.excerpt || '')} multiline/><Field name="story" label={t.story} defaultValue={String(editing.story || '')} multiline/><label className="check-row"><input type="checkbox" name="published" defaultChecked={editing.published === true}/>{t.published}</label>
        </>}
        <div className="editor-actions"><button type="button" className="button button-outline" onClick={() => setEditing(null)}>{t.remove === 'Delete' ? 'Cancel' : 'বাতিল'}</button><button className="button button-pink" disabled={saving}><Save size={15}/>{saving ? '…' : t.save}</button></div>
      </form>}
      {items.length ? <div className="content-record-grid">{items.map(item => <article className="content-record" key={item.id}><div className="content-record-preview" style={{ backgroundImage: `linear-gradient(0deg,rgba(5,9,14,.75),transparent),url("${String(item.avatarUrl || item.coverImageUrl || '')}")` }}>{section === 'albums' && Array.isArray(item.media) && item.media.some((media: any) => media.kind === 'video') && <Video/>}</div><div className="content-record-body"><span className="section-kicker">{String(item.category || item.destination || (item.visibleToMembers ? 'VISIBLE' : item.published ? 'PUBLISHED' : 'HIDDEN'))}</span><h3>{String(item.name || item.title || 'Untitled')}</h3><p>{String(item.bio || item.excerpt || item.caption || item.nickname || '')}</p><div className="content-record-actions"><button className="icon-button" title={t.edit} onClick={() => startEdit(item)}><Edit3 size={15}/></button><button className="icon-button danger-action" title={t.remove} onClick={() => void remove(collectionName, item)}><Trash2 size={15}/></button></div></div></article>)}</div> : <div className="empty-state"><Image/><p>{t.empty}</p></div>}
    </section>}
  </main>
}

function Field({ label, value, onChange, name, defaultValue, multiline, required }: { label: string; value?: string; onChange?: (value: string) => void; name?: string; defaultValue?: string; multiline?: boolean; required?: boolean }) {
  const props = onChange ? { value: value ?? '', onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value) } : { defaultValue }
  return <label>{label}{multiline ? <textarea name={name} {...props} required={required} rows={4}/> : <input name={name} {...props} required={required}/>}</label>
}

function isAllowedAssetUrl(value: string) {
  if (!value.trim()) return true
  if (value.startsWith('/assets/')) return true
  try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' } catch { return false }
}

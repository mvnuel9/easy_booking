import { useEffect, useState, type FormEvent } from 'react'
import { Armchair, ArrowRight, CalendarDays, Check, Clock3, DoorOpen, LogOut, MapPin, Plus, Users, X } from 'lucide-react'
import { api, type Booking, type Room } from './api'

type AuthMode = 'login' | 'register'
type View = 'rooms' | 'bookings'

function localDate(daysFromNow = 0) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function availabilityParams(capacity: string, equipment: string, date: string, startTime: string, endTime: string) {
  const params = new URLSearchParams()
  if (capacity) params.set('capacity', capacity)
  if (equipment) params.set('equipment', equipment)
  if (date && startTime && endTime) {
    params.set('available_from', new Date(`${date}T${startTime}`).toISOString())
    params.set('available_to', new Date(`${date}T${endTime}`).toISOString())
  }
  return params
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('easybooking.token'))
  const [email, setEmail] = useState(() => localStorage.getItem('easybooking.email') ?? '')
  const [view, setView] = useState<View>('rooms')
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('easybooking.token')))
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [capacity, setCapacity] = useState('')
  const [equipment, setEquipment] = useState('')
  const [date, setDate] = useState(() => localDate(1))
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')

  useEffect(() => {
    if (!token) return
    const query = availabilityParams(capacity, equipment, date, startTime, endTime)
    Promise.all([
      api<Room[]>(`/rooms/?${query.toString()}`, token),
      api<Booking[]>('/bookings/', token),
    ])
      .then(([roomData, bookingData]) => {
        setRooms(roomData)
        setError('')
        setEquipmentOptions((current) => [...new Set([...current, ...roomData.flatMap((room) => room.equipment)])].sort())
        setBookings(bookingData)
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false))
  }, [token, capacity, equipment, date, startTime, endTime])

  async function authenticate(event: FormEvent<HTMLFormElement>, mode: AuthMode) {
    event.preventDefault()
    setError('')
    setNotice('')
    const form = new FormData(event.currentTarget)
    const userEmail = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    try {
      if (mode === 'register') {
        await api('/auth/register/', undefined, {
          method: 'POST',
          body: JSON.stringify({ email: userEmail, username: String(form.get('username') ?? ''), password }),
        })
      }
      const tokens = await api<{ access: string; refresh: string }>('/token/', undefined, {
        method: 'POST',
        body: JSON.stringify({ email: userEmail, password }),
      })
      localStorage.setItem('easybooking.token', tokens.access)
      localStorage.setItem('easybooking.refresh', tokens.refresh)
      localStorage.setItem('easybooking.email', userEmail)
      setEmail(userEmail)
      setLoading(true)
      setToken(tokens.access)
      setNotice(mode === 'register' ? 'Votre compte est prêt. Bienvenue !' : '')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Une erreur est survenue.')
    }
  }

  async function createBooking(room: Room) {
    setError('')
    setNotice('')
    try {
      await api('/bookings/', token, {
        method: 'POST',
        body: JSON.stringify({
          room_id: room.id,
          starts_at: new Date(`${date}T${startTime}`).toISOString(),
          ends_at: new Date(`${date}T${endTime}`).toISOString(),
        }),
      })
      setNotice(`${room.name} est réservée pour le ${new Date(`${date}T${startTime}`).toLocaleDateString('fr-FR')}.`)
      const params = availabilityParams(capacity, equipment, date, startTime, endTime)
      const [roomData, bookingData] = await Promise.all([
        api<Room[]>(`/rooms/?${params}`, token),
        api<Booking[]>('/bookings/', token),
      ])
      setRooms(roomData)
      setEquipmentOptions((current) => [...new Set([...current, ...roomData.flatMap((item) => item.equipment)])].sort())
      setBookings(bookingData)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'La réservation a échoué.')
    }
  }

  async function cancelBooking(booking: Booking) {
    setError('')
    setNotice('')
    try {
      await api(`/bookings/${booking.id}/cancel/`, token, { method: 'PATCH' })
      setBookings((items) => items.map((item) => item.id === booking.id ? { ...item, status: 'cancelled' } : item))
      setNotice('La réservation a été annulée.')
      const params = availabilityParams(capacity, equipment, date, startTime, endTime)
      const availableRooms = await api<Room[]>(`/rooms/?${params.toString()}`, token)
      setRooms(availableRooms)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'L’annulation a échoué.')
    }
  }

  function signOut() {
    localStorage.removeItem('easybooking.token')
    localStorage.removeItem('easybooking.refresh')
    localStorage.removeItem('easybooking.email')
    setToken(null)
    setRooms([])
    setBookings([])
  }

  if (!token) return <AuthScreen onSubmit={authenticate} error={error} />

  const upcoming = bookings.filter((booking) => booking.status === 'confirmed' && new Date(booking.ends_at) >= new Date())

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#202822]">
      <header className="border-b border-[#e4e8e1] bg-white">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a className="flex items-center gap-3" href="#rooms" onClick={() => setView('rooms')}>
            <span className="grid size-10 place-items-center rounded-xl bg-[#183d31] text-white"><CalendarDays size={20} /></span>
            <span className="text-[19px] font-semibold">easy<span className="text-[#64806e]">booking</span></span>
          </a>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-[#69736c] sm:block">{email}</span>
            <button className="icon-button" type="button" title="Se déconnecter" aria-label="Se déconnecter" onClick={signOut}><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-16 pt-9 sm:px-8 sm:pt-12">
        <div className="mb-9 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#718078]"><MapPin size={15} /> Votre espace de travail</div>
            <h1 className="text-[32px] font-semibold leading-tight sm:text-[38px]">Réservez votre espace</h1>
            <p className="mt-2 text-[15px] text-[#758078]">Trouvez la salle idéale et organisez votre prochaine réunion.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#e4e8e1] bg-white px-4 py-3 text-sm text-[#58645c]">
            <span className="grid size-8 place-items-center rounded-lg bg-[#edf3ec] text-[#42614d]"><CalendarDays size={16} /></span>
            <span><strong className="font-semibold text-[#26342b]">{upcoming.length}</strong> réservation{upcoming.length !== 1 ? 's' : ''} à venir</span>
            <ArrowRight className="ml-2 text-[#98a39a]" size={15} />
          </div>
        </div>

        <nav className="mb-7 flex gap-7 border-b border-[#e1e6df]" aria-label="Navigation principale">
          <button className={`tab-button ${view === 'rooms' ? 'tab-active' : ''}`} onClick={() => setView('rooms')} type="button">Salles disponibles <span className="tab-count">{rooms.length}</span></button>
          <button className={`tab-button ${view === 'bookings' ? 'tab-active' : ''}`} onClick={() => setView('bookings')} type="button">Mes réservations <span className="tab-count">{bookings.length}</span></button>
        </nav>

        {notice && <div className="mb-5 flex items-center gap-2 rounded-lg border border-[#cfe1d0] bg-[#eff7ef] px-4 py-3 text-sm text-[#315d3b]" role="status"><Check size={17} />{notice}<button className="ml-auto" onClick={() => setNotice('')} aria-label="Fermer le message"><X size={16} /></button></div>}
        {error && <div className="mb-5 rounded-lg border border-[#f0d1cb] bg-[#fff4f1] px-4 py-3 text-sm text-[#a64132]" role="alert">{error}</div>}

        {view === 'rooms' ? (
          <>
            <section className="mb-7 rounded-xl border border-[#e4e8e1] bg-white p-4 sm:p-5" aria-label="Filtres de recherche">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><span className="grid size-7 place-items-center rounded-md bg-[#f0f3ef] text-[#526c59]"><Plus size={16} /></span>Affiner la recherche</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <label className="field-label">Date<input className="field-input" type="date" min={localDate()} value={date} onChange={(event) => setDate(event.target.value)} /></label>
                <label className="field-label">Début<input className="field-input" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
                <label className="field-label">Fin<input className="field-input" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label>
                <label className="field-label">Capacité minimale<input className="field-input" type="number" min="1" placeholder="Toutes" value={capacity} onChange={(event) => setCapacity(event.target.value)} /></label>
                <label className="field-label">Équipement<select className="field-input" value={equipment} onChange={(event) => setEquipment(event.target.value)}><option value="">Tous les équipements</option>{equipmentOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              </div>
              {startTime >= endTime && <p className="mt-3 text-sm text-[#a64132]" role="alert">L’heure de fin doit être après l’heure de début.</p>}
            </section>

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Salles <span className="ml-1 text-sm font-normal text-[#869088]">({rooms.length})</span></h2>
              <span className="text-sm text-[#7b857d]">{date ? new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Choisissez une date'} · {startTime} – {endTime}</span>
            </div>
            {loading ? <div className="py-16 text-center text-sm text-[#7b857d]">Chargement des salles…</div> : rooms.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {rooms.map((room, index) => <RoomCard key={room.id} room={room} onBook={createBooking} disabled={startTime >= endTime || !date} index={index} />)}
              </div>
            ) : <EmptyState title="Aucune salle disponible" description="Modifiez vos filtres ou choisissez un autre créneau." />}
          </>
        ) : (
          <section>
            <div className="mb-4 flex items-end justify-between"><div><h2 className="text-lg font-semibold">Votre historique</h2><p className="mt-1 text-sm text-[#7b857d]">Consultez et gérez vos réservations.</p></div></div>
            {bookings.length ? <div className="overflow-hidden rounded-xl border border-[#e4e8e1] bg-white">
              <div className="hidden grid-cols-[1.4fr_1fr_1fr_auto] gap-4 border-b border-[#edf0eb] bg-[#fbfcfa] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#859087] sm:grid"><span>Salle</span><span>Date</span><span>Horaire</span><span>Statut</span></div>
              {bookings.map((booking) => <BookingRow key={booking.id} booking={booking} onCancel={cancelBooking} />)}
            </div> : <EmptyState title="Aucune réservation pour le moment" description="Les réservations que vous effectuerez apparaîtront ici." />}
          </section>
        )}
      </main>
    </div>
  )
}

function RoomCard({ room, onBook, disabled, index }: { room: Room; onBook: (room: Room) => void; disabled: boolean; index: number }) {
  const tones = ['bg-[#e9f0e9] text-[#49644e]', 'bg-[#f7eee3] text-[#9a6b36]', 'bg-[#e9edf0] text-[#536777]']
  return (
    <article className="room-card overflow-hidden rounded-xl border border-[#e4e8e1] bg-white" style={{ animationDelay: `${index * 55}ms` }}>
      <div className="flex items-start justify-between p-5 pb-4">
        <div className={`grid size-11 place-items-center rounded-lg ${tones[index % tones.length]}`}><DoorOpen size={21} /></div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eff6ee] px-2.5 py-1 text-xs font-medium text-[#49704e]"><span className="size-1.5 rounded-full bg-[#6c9c66]" />Disponible</span>
      </div>
      <div className="px-5">
        <h3 className="text-[17px] font-semibold">{room.name}</h3>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-[#78827a]">{room.description || 'Un espace confortable pour vos échanges et vos réunions.'}</p>
        <div className="mt-4 flex items-center gap-4 border-y border-[#edf0eb] py-3 text-sm text-[#5f6b62]"><span className="inline-flex items-center gap-1.5"><Users size={15} />{room.capacity} personnes</span><span className="inline-flex items-center gap-1.5"><Armchair size={15} />Salle de réunion</span></div>
        <div className="flex min-h-[56px] flex-wrap content-center gap-1.5 py-3">{room.equipment.map((item) => <span className="rounded-md bg-[#f4f6f2] px-2 py-1 text-xs text-[#667168]" key={item}>{item}</span>)}</div>
      </div>
      <div className="flex items-center justify-between border-t border-[#edf0eb] bg-[#fcfdfb] px-5 py-3.5">
        <span className="inline-flex items-center gap-1.5 text-xs text-[#7c877e]"><Clock3 size={14} />Créneau sélectionné</span>
        <button className="primary-button" disabled={disabled} onClick={() => onBook(room)} type="button">Réserver <ArrowRight size={15} /></button>
      </div>
    </article>
  )
}

function BookingRow({ booking, onCancel }: { booking: Booking; onCancel: (booking: Booking) => void }) {
  const canCancel = booking.status === 'confirmed' && new Date(booking.starts_at) > new Date()
  const statusLabel = booking.status === 'confirmed' ? 'Confirmée' : booking.status === 'cancelled' ? 'Annulée' : 'Terminée'
  return (
    <div className="grid gap-3 border-b border-[#edf0eb] px-5 py-4 last:border-0 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center sm:gap-4">
      <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#f1f4ef] text-[#58705c]"><DoorOpen size={17} /></span><div><div className="font-medium">{booking.room.name}</div><div className="text-xs text-[#8a948c]">{booking.room.capacity} personnes</div></div></div>
      <div className="text-sm text-[#5f6b62]">{new Date(booking.starts_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      <div className="text-sm text-[#5f6b62]">{new Date(booking.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} – {new Date(booking.ends_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
      <div className="flex items-center justify-between gap-3 sm:justify-end"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${booking.status === 'confirmed' ? 'bg-[#eff6ee] text-[#49704e]' : booking.status === 'cancelled' ? 'bg-[#f2f3f1] text-[#7f8780]' : 'bg-[#f7eee3] text-[#9a6b36]'}`}>{statusLabel}</span>{canCancel && <button className="text-xs font-medium text-[#a34c3c] hover:underline" onClick={() => onCancel(booking)} type="button">Annuler</button>}</div>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-dashed border-[#dce3db] bg-white px-6 py-16 text-center"><span className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-[#f0f3ef] text-[#677d6b]"><CalendarDays size={22} /></span><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-[#7b857d]">{description}</p></div>
}

function AuthScreen({ onSubmit, error }: { onSubmit: (event: FormEvent<HTMLFormElement>, mode: AuthMode) => void; error: string }) {
  const [mode, setMode] = useState<AuthMode>('login')
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-5 py-12">
      <div className="w-full max-w-[430px]">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid size-12 place-items-center rounded-[14px] bg-[#183d31] text-white"><CalendarDays size={22} /></span>
          <div className="text-xl font-semibold">easy<span className="text-[#64806e]">booking</span></div>
          <p className="mt-2 text-sm text-[#778179]">Les espaces de travail, en toute simplicité.</p>
        </div>
        <section className="rounded-xl border border-[#e4e8e1] bg-white p-6 shadow-[0_12px_36px_-28px_rgba(27,53,35,.25)] sm:p-8">
          <div className="mb-6"><h1 className="text-[23px] font-semibold">{mode === 'login' ? 'Ravi de vous revoir' : 'Créer votre compte'}</h1><p className="mt-1.5 text-sm text-[#7b857d]">{mode === 'login' ? 'Connectez-vous pour gérer vos réservations.' : 'Inscrivez-vous pour réserver une salle.'}</p></div>
          <div className="mb-5 grid grid-cols-2 rounded-lg bg-[#f3f5f2] p-1"><button type="button" onClick={() => setMode('login')} className={`rounded-md py-2 text-sm font-medium ${mode === 'login' ? 'bg-white text-[#24352a] shadow-sm' : 'text-[#778179]'}`}>Connexion</button><button type="button" onClick={() => setMode('register')} className={`rounded-md py-2 text-sm font-medium ${mode === 'register' ? 'bg-white text-[#24352a] shadow-sm' : 'text-[#778179]'}`}>Inscription</button></div>
          {error && <div className="mb-4 rounded-lg border border-[#f0d1cb] bg-[#fff4f1] px-3 py-2.5 text-sm text-[#a64132]" role="alert">{error}</div>}
          <form className="space-y-4" onSubmit={(event) => onSubmit(event, mode)}>
            {mode === 'register' && <label className="field-label">Nom d’utilisateur<input className="field-input" name="username" autoComplete="username" required minLength={2} pattern={'[A-Za-z0-9._+\\-]+'} title="Utilisez des lettres, chiffres, points, tirets ou underscores, sans espace." placeholder="camille_martin" /></label>}
            <label className="field-label">Adresse e-mail<input className="field-input" name="email" type="email" autoComplete="email" required placeholder="vous@entreprise.fr" /></label>
            <label className="field-label">Mot de passe<input className="field-input" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} placeholder="8 caractères minimum" /></label>
            <button className="primary-button mt-2 w-full justify-center py-3" type="submit">{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}<ArrowRight size={16} /></button>
          </form>
          <p className="mt-5 text-center text-xs leading-5 text-[#89928b]">En continuant, vous acceptez que vos informations soient utilisées pour gérer vos réservations.</p>
        </section>
        <p className="mt-6 text-center text-xs text-[#9aa29b]">EasyBooking · Réservation de salles</p>
      </div>
    </main>
  )
}

export default App

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { notify } from '../components/notify'

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const apiUrl = (url) => (API_BASE ? `${API_BASE}${url}` : url)

function Section({ title, children, theme }) {
  const baseCls = theme === 'dark' ? 'bg-blue-900 border-blue-800' : 'bg-white border-gray-100'
  const titleCls = theme === 'dark' ? 'text-blue-200' : 'text-gray-900'
  return (
    <section className={`${baseCls} rounded-[2.5rem] shadow-sm p-8 mb-8 border`}>
      <h2 className={`${titleCls} text-2xl font-black mb-6 uppercase tracking-tight`}>{title}</h2>
      {children}
    </section>
  )
}

function Badge({ tier, active }) {
  const map = {
    Bronze: { bg: 'bg-amber-200', text: 'text-amber-900', label: 'Bronce' },
    Silver: { bg: 'bg-gray-200', text: 'text-gray-900', label: 'Plata' },
    Gold: { bg: 'bg-yellow-200', text: 'text-yellow-900', label: 'Oro' },
  }
  const s = map[tier] || map.Bronze
  return (
    <span className={`px-2 py-1 rounded ${s.bg} ${s.text} border ${active ? 'border-blue-500' : 'border-transparent'}`}>{s.label}</span>
  )
}

function NavIcon({ name }) {
  const common = 'w-5 h-5'
  switch (name) {
    case 'closet':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path d="M12 6c0-1.2 1-2 2.2-2 1.2 0 2.2.8 2.2 2 0 1.1-.9 2-2 2h-1.2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 15l8-4 8 4v4H4v-4z" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    case 'tryon':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path d="M7 7l2-2h6l2 2" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="4" y="7" width="16" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    case 'inicio':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" stroke="currentColor" strokeWidth="1.5"/></svg>
      )
    case 'pedidos':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h12" stroke="currentColor" strokeWidth="1.5"/></svg>
      )
    case 'favoritos':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none"><path d="M12 21s-6.5-4.35-8.5-7.4C1.5 10.6 3.5 7 7 7c2.1 0 3.5 1.2 5 2.5C13.5 8.2 14.9 7 17 7c3.5 0 5.5 3.6 3.5 6.6C18.5 16.65 12 21 12 21z" stroke="currentColor" strokeWidth="1.5"/></svg>
      )
    case 'datos':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zM4 21a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.5"/></svg>
      )
    case 'actividad':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none"><path d="M3 13l4-4 4 6 5-8 5 6" stroke="currentColor" strokeWidth="1.5"/></svg>
      )
    case 'fidelidad':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none"><path d="M12 2l3 7h7l-5.5 4 2 8-6.5-4.5L6.5 21l2-8L3 9h7l2-7z" stroke="currentColor" strokeWidth="1.5"/></svg>
      )
    case 'notificaciones':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none"><path d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm7-6V11a7 7 0 10-14 0v5l-2 2h18l-2-2z" stroke="currentColor" strokeWidth="1.5"/></svg>
      )
    case 'config':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 100-6 3 3 0 000 6zm8.94-3a7.96 7.96 0 00-.2-1.5l2.02-1.57-2-3.46-2.45.98a8.07 8.07 0 00-1.3-.75l-.37-2.6h-4l-.37 2.6c-.45.2-.88.45-1.3.75l-2.45-.98-2 3.46 2.02 1.57c-.08.49-.15 1-.2 1.5l-2.02 1.57 2 3.46 2.45-.98c.42.3.85.55 1.3.75l.37 2.6h4l.37-2.6c.45-.2.88-.45 1.3-.75l2.45.98 2-3.46-2.02-1.57z" stroke="currentColor" strokeWidth="1.5"/></svg>
      )
    default:
      return null
  }
}

function Sidebar({ tab, setTab, theme }) {
  const items = [
    ['inicio','Inicio'],
    ['pedidos','Mis pedidos'],
    ['favoritos','Mis favoritos'],
    ['closet','Mi guardarropa'],
    ['tryon','Prueba en vivo'],
    ['datos','Mis datos'],
    ['actividad','Mi actividad'],
    ['fidelidad','Programa de fidelidad'],
    ['comentarios','Comentarios'],
    ['notificaciones','Notificaciones'],
    ['config','Configuraciones'],
  ]
  const base = theme === 'dark' ? 'bg-blue-900 text-blue-50 border-blue-800' : 'bg-white text-blue-800 border-blue-100'
  const active = theme === 'dark' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-900'
  return (
    <aside className={`w-56 shrink-0 rounded-xl border ${base} p-3`}> 
      <nav className="flex flex-col gap-1">
        {items.map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${tab===key ? active : ''} hover:bg-blue-50`}
          >
            <span className="text-blue-700"><NavIcon name={key} /></span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default function UserPanel() {
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(() => {
    const params = new URLSearchParams(location.search)
    return params.get('tab') || 'inicio'
  })
  const userId = useMemo(() => (localStorage.getItem('userId') || 'guest'), [])

  // Sincronizar tab con URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const t = params.get('tab')
    if (t && t !== tab) setTab(t)
  }, [location.search, tab])

  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [favorites, setFavorites] = useState([])
  const [activity, setActivity] = useState({ totalSpent: 0, byMonth: [], mostBought: [] })
  const [loyalty, setLoyalty] = useState({ points: 0, tier: 'Bronze' })
  const [notifications, setNotifications] = useState([])
  const [theme, setTheme] = useState('light')
  const [orderQuery, setOrderQuery] = useState('')
  const [isSpinning, setIsSpinning] = useState(false)
  // Nuevas experiencias interactivas
  const [closet, setCloset] = useState(() => {
    try { return JSON.parse(localStorage.getItem('closet') || '[]') } catch { return [] }
  })
  
  const [tryOnTint, setTryOnTint] = useState('#00000000')
  const [tryOnActive, setTryOnActive] = useState(false)

  // Envíos: pasos y helpers de estado
  const statusSteps = ['pendiente','preparando','enviado','entregado']
  const statusIndex = (s) => Math.max(0, statusSteps.indexOf((s||'').toLowerCase()))

  const qUser = `?user=${encodeURIComponent(userId)}`

  function goToStore() { navigate('/productos') }
  function goToCart() { navigate('/carrito') }
  function logout() {
    try {
      const id = (localStorage.getItem('userId') || 'guest').toLowerCase()
      fetch(apiUrl(`/api/cart?user=${encodeURIComponent(id)}`), { method: 'DELETE' }).catch(() => void 0)
      localStorage.removeItem('userId')
      localStorage.removeItem('cart')
    } catch { void 0 }
    navigate('/usuarios', { replace: true })
  }

  // Mover repeatOrder dentro del componente para acceder a navigate y qUser
  async function repeatOrder(o) {
    try {
      const items = Array.isArray(o.items) ? o.items : []
      for (const it of items) {
        const payload = {
          id: it.id,
          name: it.name,
          price: Number(it.price) || 0,
          quantity: Number(it.qty || it.quantity || 1) || 1,
        }
        await fetch(apiUrl(`/api/cart${qUser}`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      notify('Pedido agregado al carrito', 'success')
      navigate('/carrito')
    } catch (err) {
      console.error(err)
      notify('No se pudo repetir el pedido', 'error')
    }
  }

  function trackOrder(o) {
    const tr = o?.shipping?.tracking
    if (!tr) {
      notify('Tu pedido aún no tiene guía de envío. Estado: ' + (o.status||'pendiente'), 'warning')
      return
    }
    const url = `https://www.correoargentino.com.ar/track/${encodeURIComponent(tr)}`
    window.open(url, '_blank')
  }

  async function fetchAll() {
    try {
      const [pRes, oRes, fRes, aRes, lRes, nRes] = await Promise.all([
        fetch(apiUrl(`/api/user/me${qUser}`)),
        fetch(apiUrl(`/api/user/orders${qUser}`)),
        fetch(apiUrl(`/api/user/favorites${qUser}`)),
        fetch(apiUrl(`/api/user/activity${qUser}`)),
        fetch(apiUrl(`/api/user/loyalty${qUser}`)),
        fetch(apiUrl(`/api/user/notifications${qUser}`)),
      ])
      const [p, o, f, a, l, n] = await Promise.all([
        pRes.json(), oRes.json(), fRes.json(), aRes.json(), lRes.json(), nRes.json()
      ])
      
      if (p && p.email !== 'guest' && !p.is_verified) {
        notify('Tu cuenta no está verificada. Redirigiendo...', 'warning')
        localStorage.removeItem('userId')
        navigate('/usuarios', { replace: true })
        return
      }

      setProfile(p)
      setOrders(Array.isArray(o) ? o : [])
      setFavorites(Array.isArray(f) ? f : [])
      setActivity(a || { totalSpent: 0, byMonth: [], mostBought: [] })
      setLoyalty(l || { points: 0, tier: 'Bronze' })
      setNotifications(Array.isArray(n) ? n : [])
    } catch (err) {
      console.error(err)
    }
  }

  async function earnPoints(type) {
    try {
      const res = await fetch(apiUrl(`/api/user/loyalty/earn${qUser}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      const data = await res.json()
      if (data?.ok && data.loyalty) {
        setLoyalty(data.loyalty)
        // Refrescar notificaciones para mostrar mensaje nuevo
        const nRes = await fetch(apiUrl(`/api/user/notifications${qUser}`))
        const n = await nRes.json()
        setNotifications(Array.isArray(n) ? n : [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function spinWheel() {
    try {
      if (isSpinning) return
      if (loyalty?.flags && loyalty.flags.canSpin === false) {
        // Aún así pedir al backend para obtener el mensaje de bloqueo y refrescar estado
        await earnPoints('spin')
        return
      }
      setIsSpinning(true)
      // 1) Solicitar resultado al backend
      const res = await fetch(apiUrl(`/api/user/loyalty/earn${qUser}`), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'spin' })
      })
      const data = await res.json()
      // 2) Calcular ángulo objetivo según puntos obtenidos
      const options = [0, 5, 10, 15, 20]
      const idx = Math.max(0, options.indexOf(Number(data?.earned ?? 0)))
      const segments = options.length
      const base = 360 * 4 // giros completos para animar
      const segmentSize = 360 / segments
      // Pequeño offset aleatorio dentro del segmento para naturalidad
      const jitter = (Math.random() * 0.6 - 0.3) * segmentSize
      const targetCenter = (idx + 0.5) * segmentSize + jitter
      void (base + targetCenter)
      // 3) Finalizar animación y refrescar estado
      setTimeout(async () => {
        setIsSpinning(false)
        if (data?.ok && data.loyalty) {
          setLoyalty(data.loyalty)
          const nRes = await fetch(apiUrl(`/api/user/notifications${qUser}`))
          const n = await nRes.json()
          setNotifications(Array.isArray(n) ? n : [])
        }
      }, 1800)
    } catch {
      setIsSpinning(false)
      void 0
    }
  }


  useEffect(() => {
    fetchAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Si no hay sesión activa o no está verificado, redirigir al login
  useEffect(() => {
    const id = (localStorage.getItem('userId') || 'guest').trim().toLowerCase()
    if (!id || id === 'guest') {
      navigate('/usuarios', { replace: true })
    } else if (profile && !profile.is_verified) {
      localStorage.removeItem('userId')
      navigate('/usuarios', { replace: true })
    }
  }, [location.pathname, navigate, profile])

  // Abrir pestaña según query/hash (p.ej. /mi-espacio?tab=comunidad o #comunidad)
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search)
      const qTab = params.get('tab') || params.get('t') || ''
      const hashTab = (location.hash || '').replace('#','')
      const target = (qTab || hashTab || '').toLowerCase()
      const valid = ['inicio','pedidos','favoritos','closet','tryon','datos','actividad','fidelidad','notificaciones','config','comentarios']
      if (target && valid.includes(target)) setTab(target)
    } catch {
      void 0
    }
  }, [location])

  useEffect(() => { localStorage.setItem('closet', JSON.stringify(closet)) }, [closet])

  async function saveProfile(e) {
    e.preventDefault()
    try {
      const form = new FormData(e.currentTarget)
      const addressesStr = form.get('addresses') || ''
      const payload = {
        name: form.get('name') || profile?.name || '',
        phone: form.get('phone') || '',
        avatar: form.get('avatar') || '',
        addresses: addressesStr ? addressesStr.split(',').map(s => s.trim()).filter(Boolean) : [],
      }
      const res = await fetch(apiUrl(`/api/user/me${qUser}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const ok = await res.json()
      if (ok?.ok) fetchAll()
    } catch (err) {
      console.error(err)
    }
  }

  async function toggleFavorite(productId, add = true) {
    try {
      if (add) {
        await fetch(apiUrl(`/api/user/favorites${qUser}`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) })
      } else {
        await fetch(apiUrl(`/api/user/favorites/${productId}${qUser}`), { method: 'DELETE' })
      }
      const fRes = await fetch(apiUrl(`/api/user/favorites${qUser}`))
      setFavorites(await fRes.json())
    } catch (err) {
      console.error(err)
    }
  }

  function addToClosetFromFavorites() {
    const items = favorites.slice(0, 6).map(p => ({ id: p.id, name: p.name, image: p.image, ts: Date.now() }))
    setCloset(c => {
      const merged = [...items, ...c]
      notify(`Agregamos ${items.length} prendas a tu guardarropa`, 'success')
      return merged.slice(0, 24)
    })
  }

  const filteredOrders = orders.filter(o => {
    const term = orderQuery.trim().toLowerCase()
    if (!term) return true
    return String(o.id).includes(term) || (o.status || '').toLowerCase().includes(term)
  })

  return (
    <div className={theme === 'dark' ? 'bg-blue-950 min-h-screen text-blue-50' : 'bg-blue-50 min-h-screen text-blue-900'}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          <Sidebar tab={tab} setTab={setTab} theme={theme} />
          <div className="flex-1">
            <header className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
              <div className="space-y-1 text-center md:text-left">
                <p className="text-blue-600 font-black uppercase tracking-widest text-xs">Panel de Usuario</p>
                <p className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-blue-200' : 'text-gray-500'}`}>
                  {profile?.name || 'Invitado'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
                <button
                  className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 transition-all ${theme === 'dark' ? 'bg-blue-800 border-blue-700 text-white' : 'bg-white border-gray-100 text-gray-900 hover:bg-gray-50'}`}
                  onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
                >
                  {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
                </button>
                <button
                  className="px-6 py-3 rounded-2xl bg-[#1E3A8A] text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-800 transition-all shadow-xl hover:scale-105 active:scale-95"
                  onClick={goToStore}
                >
                  Tienda
                </button>
                <button
                  className="px-6 py-3 rounded-2xl bg-white border-2 border-gray-100 text-gray-900 font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all hover:scale-105 active:scale-95"
                  onClick={goToCart}
                >
                  Carrito
                </button>
                <button
                  className="px-6 py-3 rounded-2xl bg-red-50 text-red-600 font-black uppercase tracking-widest text-[10px] hover:bg-red-100 transition-all active:scale-95"
                  onClick={logout}
                >
                  Salir
                </button>
                <div className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center border-2 ${theme === 'dark' ? 'bg-blue-800 border-blue-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <svg className={`w-7 h-7 ${theme === 'dark' ? 'text-blue-300' : 'text-[#1E3A8A]'}`} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.5"/></svg>
                  )}
                </div>
              </div>
            </header>


        {tab === 'inicio' && (
          <Section title="Resumen" theme={theme}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`${theme === 'dark' ? 'bg-blue-800 border-blue-700 text-white' : 'bg-white border-blue-200'} border rounded-xl p-4 shadow-sm`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>Última compra</p>
                <p className="text-lg font-semibold mt-1">{orders.length ? (orders[orders.length-1].items?.[0]?.name || 'Compra reciente') : '—'}</p>
                <p className="text-sm">{orders.length ? new Date(orders[orders.length-1].ts).toLocaleDateString() : ''}</p>
              </div>
              <div className={`${theme === 'dark' ? 'bg-blue-800 border-blue-700 text-white' : 'bg-white border-blue-200'} border rounded-xl p-4 shadow-sm`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>Estado del pedido</p>
                <p className="text-xl font-semibold mt-1 capitalize">{orders.length ? orders[orders.length-1].status : '—'}</p>
              </div>
              <div className={`${theme === 'dark' ? 'bg-blue-800 border-blue-700 text-white' : 'bg-white border-blue-200'} border rounded-xl p-4 shadow-sm`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>Puntos de fidelidad</p>
                <p className="text-2xl font-bold mt-1">{loyalty.points}</p>
              </div>
            </div>
            <div className="mt-6">
              <p className={`font-semibold mb-2 ${theme === 'dark' ? 'text-blue-200' : ''}`}>Recomendaciones</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(favorites.slice(0,3)).map(p => (
                  <div key={p.id} className={`rounded-xl overflow-hidden border ${theme === 'dark' ? 'bg-blue-800 border-blue-700 text-white' : 'bg-white border-blue-200'} shadow-sm`}>
                    <img src={p.image} alt={p.name} className="w-full h-32 object-cover" />
                    <div className="p-3 text-sm">
                      <p className="font-medium">{p.name}</p>
                    </div>
                  </div>
                ))}
                {favorites.length === 0 && (
                  <div className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>Agregá favoritos para recibir mejores recomendaciones.</div>
                )}
              </div>
            </div>
          </Section>
        )}

        {tab === 'pedidos' && (
          <Section title="Mis pedidos" theme={theme}>
            <div className="flex flex-col gap-4">
              <div className="relative">
                <input
                  placeholder="Buscar pedidos"
                  value={orderQuery}
                  onChange={e=>setOrderQuery(e.target.value)}
                  className={`w-full border rounded-lg px-10 py-2 ${theme === 'dark' ? 'bg-blue-800 border-blue-700 text-white' : 'bg-white border-blue-300'}`}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                </span>
              </div>
              {filteredOrders.length === 0 && <p className="text-sm opacity-60">No hay pedidos registrados.</p>}
              {filteredOrders.map(o => (
                <div key={o.id} className={`border rounded p-4 ${theme === 'dark' ? 'bg-blue-800 border-blue-700 text-white' : 'bg-white border-blue-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-bold text-lg">Pedido #{o.id}</p>
                      <p className="text-sm opacity-70">{new Date(o.ts).toLocaleString()} • <span className="uppercase font-bold text-blue-500">{o.status}</span></p>
                      {o?.shipping?.tracking && (
                        <p className="text-xs text-emerald-500 mt-1 font-medium">📦 Tracking: {o.shipping.tracking} ({o.shipping.carrier||'Envío'})</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs px-3 py-2 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700" onClick={() => trackOrder(o)}>Rastrear</button>
                      <button className="text-xs px-3 py-2 rounded-full bg-blue-100 text-blue-800 font-bold hover:bg-blue-200" onClick={() => repeatOrder(o)}>Repetir</button>
                    </div>
                  </div>
                  <div className="mt-6 relative">
                    {/* Línea de progreso de fondo */}
                    <div className="absolute top-4 left-0 w-full h-1 bg-gray-200 rounded-full"></div>
                    {/* Línea de progreso activa */}
                    <div 
                      className="absolute top-4 left-0 h-1 bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.4)]" 
                      style={{ width: `${(statusIndex(o.status) / (statusSteps.length - 1)) * 100}%` }}
                    ></div>

                    <div className="relative flex justify-between">
                      {statusSteps.map((st, i) => {
                        const active = i <= statusIndex(o.status)
                        const current = i === statusIndex(o.status)
                        return (
                          <div key={st} className="flex flex-col items-center group">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${
                              active 
                                ? 'bg-blue-600 text-white shadow-lg scale-110' 
                                : 'bg-white text-gray-400 border-2 border-gray-200'
                            } ${current ? 'ring-4 ring-blue-100 animate-pulse' : ''}`}>
                              {i === 0 && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                              {i === 1 && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>}
                              {i === 2 && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>}
                              {i === 3 && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>}
                            </div>
                            <span className={`mt-3 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${
                              active ? 'text-blue-700' : 'text-gray-400'
                            }`}>
                              {st}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className={`mt-4 p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-50'}`}>
                    <ul className="space-y-1">
                      {(o.items||[]).map((it, idx) => (
                        <li key={idx} className="flex justify-between items-center">
                          <span>{it.name} <span className="opacity-60">×{it.qty || 1}</span></span>
                          <span className="font-bold">${(it.price || 0) * (it.qty || 1)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 pt-2 border-t border-blue-200/30 flex justify-between items-center font-black text-lg">
                      <span>Total</span>
                      <span>${o.total || (o.items?.reduce((s,i)=>s+(i.price*i.qty),0)||0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {tab === 'favoritos' && (
          <Section title="Mis favoritos" theme={theme}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {favorites.map(p => (
                <div key={p.id} className={`${theme === 'dark' ? 'bg-blue-800 border-blue-700 text-white' : 'bg-white border-blue-200'} border rounded-xl overflow-hidden shadow-sm transition-transform hover:scale-[1.02]`}>
                  <img src={p.image} alt={p.name} className="w-full h-36 object-cover" />
                  <div className="p-3">
                    <p className="font-bold text-sm truncate">{p.name}</p>
                    <p className="text-blue-500 font-black mt-1">${p.price}</p>
                    <div className="mt-3 flex gap-2">
                      <button className="flex-1 text-[10px] font-black uppercase py-2 rounded bg-red-50 text-red-600 hover:bg-red-100" onClick={() => toggleFavorite(p.id, false)}>Quitar</button>
                      <button className="flex-1 text-[10px] font-black uppercase py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Comprar</button>
                    </div>
                  </div>
                </div>
              ))}
              {favorites.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <p className="text-4xl mb-4">❤️</p>
                  <p className="text-sm opacity-60">Aún no tenés favoritos guardados.</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {tab === 'closet' && (
          <Section title="Mi guardarropa virtual" theme={theme}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm opacity-70">Combiná tus prendas con nuestros productos.</p>
              <button className="px-4 py-2 rounded-full bg-blue-600 text-white font-bold text-xs" onClick={addToClosetFromFavorites}>Importar favoritos</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {closet.map(item => (
                <div key={item.id} className={`${theme === 'dark' ? 'bg-blue-800 border-blue-700' : 'bg-white border-blue-100'} border rounded-xl overflow-hidden shadow-sm`}>
                  <img src={item.image} alt={item.name} className="w-full h-36 object-cover" />
                  <div className="p-3">
                    <p className="font-medium text-xs truncate">{item.name}</p>
                  </div>
                </div>
              ))}
              <button className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${theme === 'dark' ? 'border-blue-700 text-blue-400 hover:bg-blue-800' : 'border-blue-200 text-blue-400 hover:bg-blue-50'}`}>
                <span className="text-3xl">+</span>
                <span className="text-[10px] font-bold uppercase mt-1">Subir prenda</span>
              </button>
            </div>
          </Section>
        )}

        {tab === 'tryon' && (
          <Section title="Prueba en vivo (AR)" theme={theme}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${theme === 'dark' ? 'bg-blue-900' : 'bg-gray-100'} rounded-2xl overflow-hidden relative aspect-video flex items-center justify-center`}>
                <video id="jj_tryon_video" className="w-full h-full object-cover" autoPlay playsInline muted style={{ filter: tryOnTint ? `drop-shadow(0 0 0 ${tryOnTint})` : 'none' }} />
                {!tryOnActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/40 backdrop-blur-sm text-white">
                    <p className="text-4xl mb-4">📷</p>
                    <p className="font-bold text-lg mb-2">Activá tu cámara</p>
                    <p className="text-xs opacity-80 mb-6">Probate nuestras prendas en tiempo real usando Realidad Aumentada.</p>
                    <button className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg" onClick={async()=>{
                      try {
                        const v = document.getElementById('jj_tryon_video')
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                        v.srcObject = stream
                        setTryOnActive(true)
                        notify('Cámara activada', 'success')
                      } catch { notify('No se pudo activar la cámara', 'error') }
                    }}>Empezar prueba</button>
                  </div>
                )}
                {tryOnActive && (
                  <button className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full shadow-lg" onClick={()=>{
                    const v = document.getElementById('jj_tryon_video')
                    const s = v && v.srcObject
                    if (s && s.getTracks) s.getTracks().forEach(t=>t.stop())
                    if (v) v.srcObject = null
                    setTryOnActive(false)
                  }}>✕</button>
                )}
              </div>
              <div className="space-y-4">
                <p className="font-bold text-sm uppercase opacity-60 tracking-wider">Ajustes de prueba</p>
                <div className="grid grid-cols-3 gap-2">
                  {['#00000000','#ff000033','#00ff0033','#0000ff33','#ffff0033','#ff00ff33'].map(c => (
                    <button key={c} className="h-10 rounded-lg border border-white/20 shadow-sm" style={{ backgroundColor: c }} onClick={()=>setTryOnTint(c)} />
                  ))}
                </div>
                <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-blue-800/50' : 'bg-blue-50'}`}>
                  <p className="text-xs leading-relaxed opacity-80">Seleccioná un filtro de color para simular cómo se verían diferentes tonos sobre tu piel o ropa actual.</p>
                </div>
              </div>
            </div>
          </Section>
        )}

        {tab === 'comentarios' && (
          <Section title="Dejanos tu opinión" theme={theme}>
            <div className="max-w-2xl">
              <p className="text-sm opacity-80 mb-6 italic">Tu opinión es fundamental para que JJ Indumentaria siga creciendo.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Tu calificación</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} className="text-3xl text-yellow-400 hover:scale-125 transition-transform active:scale-90">★</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Comentario</label>
                  <textarea 
                    className={`w-full p-4 border rounded-2xl resize-none h-40 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${theme === 'dark' ? 'bg-blue-800 border-blue-700 text-white placeholder-blue-400 shadow-inner' : 'bg-white border-blue-200'}`}
                    placeholder="Contanos qué te gustaría ver en la página, qué mejorarías o qué es lo que más te gusta..."
                  ></textarea>
                </div>
                <button 
                  onClick={() => notify('¡Muchas gracias por tu valioso feedback!', 'success')}
                  className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl active:translate-y-1"
                >
                  Enviar Comentario
                </button>
              </div>
            </div>
          </Section>
        )}

        {tab === 'datos' && (
          <Section title="Mis datos" theme={theme}>
            <form onSubmit={saveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <div>
                <label className="block text-xs font-bold uppercase opacity-60 mb-2">Nombre</label>
                <input name="name" defaultValue={profile?.name || ''} className={`w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all ${theme === 'dark' ? 'bg-blue-800 border-blue-700 text-white' : 'bg-white border-blue-200'}`} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase opacity-60 mb-2">Teléfono</label>
                <input name="phone" defaultValue={profile?.phone || ''} className={`w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all ${theme === 'dark' ? 'bg-blue-800 border-blue-700 text-white' : 'bg-white border-blue-200'}`} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase opacity-60 mb-2">Avatar (URL)</label>
                <input name="avatar" defaultValue={profile?.avatar || ''} className={`w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all ${theme === 'dark' ? 'bg-blue-800 border-blue-700 text-white' : 'bg-white border-blue-200'}`} />
              </div>
              <button className="md:col-span-2 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg">
                Guardar Cambios
              </button>
            </form>
          </Section>
        )}

        {tab === 'actividad' && (
          <Section title="Mi actividad" theme={theme}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className={`${theme === 'dark' ? 'bg-blue-800/50' : 'bg-blue-50'} rounded-2xl p-6 text-center border border-blue-200/20`}>
                <p className="text-xs font-bold uppercase opacity-60 mb-1">Gasto total</p>
                <p className="text-3xl font-black text-green-500">${activity.totalSpent}</p>
              </div>
              <div className={`${theme === 'dark' ? 'bg-blue-800/50' : 'bg-blue-50'} rounded-2xl p-6 md:col-span-2 border border-blue-200/20`}>
                <p className="text-xs font-bold uppercase opacity-60 mb-4">Actividad por mes</p>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {activity.byMonth.map(m => (
                    <div key={m.month} className={`${theme === 'dark' ? 'bg-blue-900' : 'bg-white'} border border-blue-200/30 rounded-xl p-3 min-w-[120px] shadow-sm`}>
                      <p className="text-[10px] font-bold opacity-60 uppercase">{m.month}</p>
                      <p className="text-sm font-bold mt-1">${m.amount}</p>
                      <p className="text-[10px] opacity-60">{m.orders} pedidos</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={`${theme === 'dark' ? 'bg-blue-800/20' : 'bg-gray-50'} p-6 rounded-2xl`}>
              <p className="font-bold text-sm uppercase opacity-60 mb-4">Productos más comprados</p>
              <div className="space-y-3">
                {activity.mostBought.map(m => (
                  <div key={m.name} className="flex items-center justify-between text-sm">
                    <span>{m.name}</span>
                    <span className="font-bold bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs">{m.count} veces</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {tab === 'fidelidad' && (
          <Section title="JJ Rewards" theme={theme}>
            <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-blue-800 to-indigo-900' : 'bg-gradient-to-br from-blue-600 to-indigo-700'} p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden`}>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Nivel Actual</p>
                  <p className="text-4xl font-black mt-2 tracking-tighter">{loyalty.tier?.toUpperCase() || 'BRONZE'}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-xl p-4 rounded-2xl text-center border border-white/30 shadow-inner">
                  <p className="text-[10px] font-black uppercase tracking-widest">Tus Puntos</p>
                  <p className="text-3xl font-black">{loyalty.points ?? 0}</p>
                </div>
              </div>
              <div className="mt-12 relative z-10">
                <div className="flex justify-between text-[10px] font-black uppercase mb-3 tracking-widest">
                  <span>Siguiente Nivel: {loyalty.progress?.nextTier || 'MAX'}</span>
                  <span>{loyalty.points} / {loyalty.progress?.nextThreshold || loyalty.points} pts</span>
                </div>
                <div className="h-4 bg-black/20 rounded-full p-1 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full shadow-[0_0_15px_rgba(253,224,71,0.5)] transition-all duration-1000" style={{width: `${Math.min(100, loyalty.progress?.percent ?? 0)}%`}}></div>
                </div>
                <p className="text-xs mt-4 text-blue-100 italic">“Cada compra te acerca a beneficios exclusivos.”</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className={`${theme === 'dark' ? 'bg-blue-800/50' : 'bg-blue-50'} p-6 rounded-2xl border border-blue-200/20`}>
                <p className="font-bold text-xs uppercase opacity-60 mb-4">Beneficios de tu nivel</p>
                <ul className="text-sm space-y-2 opacity-80">
                  <li>✨ Regalo sorpresa en tu cumpleaños</li>
                </ul>
              </div>
              <div className={`${theme === 'dark' ? 'bg-blue-800/50' : 'bg-blue-50'} p-6 rounded-2xl border border-blue-200/20`}>
                <p className="font-bold text-xs uppercase opacity-60 mb-4">¿Cómo sumar más?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button className="text-[10px] font-bold uppercase p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={spinWheel} disabled={isSpinning || (Number(loyalty?.flags?.spinCredits||0) <= 0)}>
                    Ruleta ({loyalty?.flags?.spinCredits || 0})
                  </button>
                  <button className="text-[10px] font-bold uppercase p-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200" onClick={()=>earnPoints('referral')}>Referir</button>
                </div>
              </div>
            </div>
          </Section>
        )}

        {tab === 'notificaciones' && (
          <Section title="Notificaciones" theme={theme}>
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className={`${theme === 'dark' ? 'bg-blue-800 border-blue-700' : 'bg-white border-blue-100'} border rounded-2xl p-4 flex items-start gap-4 transition-all hover:border-blue-300`}>
                  <div className="w-2 h-2 rounded-full mt-2 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{n.message}</p>
                    <p className="text-[10px] opacity-40 mt-2 font-bold uppercase tracking-widest">{new Date(n.ts).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="py-20 text-center opacity-40">
                  <p className="text-4xl mb-2">🔔</p>
                  <p className="text-sm italic">No tenés notificaciones nuevas.</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {tab === 'config' && (
          <Section title="Configuraciones" theme={theme}>
            <div className="space-y-4 max-w-md">
              <div className={`p-4 rounded-2xl flex items-center justify-between ${theme === 'dark' ? 'bg-blue-800' : 'bg-gray-50'}`}>
                <div>
                  <p className="font-bold text-sm">Modo Oscuro</p>
                  <p className="text-[10px] opacity-60 uppercase font-black">Visualización de la interfaz</p>
                </div>
                <button className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`} onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme === 'dark' ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              <div className={`p-4 rounded-2xl flex items-center justify-between ${theme === 'dark' ? 'bg-blue-800' : 'bg-gray-50'}`}>
                <div>
                  <p className="font-bold text-sm">Notificaciones Push</p>
                  <p className="text-[10px] opacity-60 uppercase font-black">Alertas en tiempo real</p>
                </div>
                <button className="w-12 h-6 rounded-full bg-blue-600 relative">
                  <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full"></div>
                </button>
              </div>
            </div>
          </Section>
        )}

          </div>
        </div>
      </div>
    </div>
  )
}

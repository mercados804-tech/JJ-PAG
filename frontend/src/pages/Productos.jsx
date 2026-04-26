import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { notify } from '../components/notify'

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const apiUrl = (url) => (API_BASE ? `${API_BASE}${url}` : url)

const productTemplates = [
  { id: 101, name: 'Remera JJ', price: 35990, image: '/img/promo9.webp', quantity: 20 },
  { id: 102, name: 'Chomba JJ', price: 25000, image: '/img/chomba.webp', quantity: 20 },
  { id: 103, name: 'Pantalón Jeans JJ', price: 31700, image: '/img/promo7.webp', quantity: 20 },
  { id: 104, name: 'Pantalón JJ', price: 30000, image: '/img/bermuda.webp', quantity: 20 },
  { id: 105, name: 'Remera Negra JJ', price: 23000, image: '/img/ima1.webp', quantity: 20 },
  { id: 106, name: 'Remera Negra JJ', price: 21000, image: '/img/ima2.webp', quantity: 20 },
  { id: 107, name: 'Remera Azul C++ JJ', price: 15000, image: '/img/c++.webp', quantity: 20 },
  { id: 108, name: 'Remera Negro JJ', price: 20000, image: '/img/gptr,1265x,front,black-c,330,402,600,600-bg,f8f8f8.u3.jpg', quantity: 20 },
  { id: 109, name: 'Remera Blanca JJ', price: 22000, image: '/img/promo16.webp', quantity: 20 },
  { id: 110, name: 'Remera Blanca JJ', price: 23000, image: '/img/promo17.webp', quantity: 20 },
  { id: 111, name: 'Remera Negra JJ', price: 20000, image: '/img/promo12.webp', quantity: 20 },
  { id: 112, name: 'Buzo Celeste JJ', price: 45000, image: '/img/promo15.webp', quantity: 20 },
  { id: 113, name: 'Buzo Tricolor JJ', price: 37000, image: '/img/promo3.webp', quantity: 20 },
  { id: 114, name: 'Remera Negro JJ', price: 16000, image: '/img/promo14.webp', quantity: 20 },
  { id: 115, name: 'Chomba Azul JJ', price: 20000, image: '/img/ima3.webp', quantity: 20 },
  { id: 116, name: 'Chomba Negra JJ', price: 20000, image: '/img/ima2.webp', quantity: 20 },
  { id: 117, name: 'Buzo Negro JJ', price: 32000, image: '/img/promo13.webp', quantity: 20 },
  { id: 118, name: 'Chomba JJ', price: 25000, image: '/img/ima1.webp', quantity: 20 },
]

const productTemplateMap = new Map(productTemplates.map((product) => [Number(product.id), product]))

function isCatalogProduct(raw) {
  if (!raw || typeof raw !== 'object') return false
  if (raw.product_id != null || raw.productId != null) return false
  if (raw.discount != null) return false
  return raw.id != null && (raw.name || raw.title)
}

function parsePrice(value) {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return 0
  const normalized = value
    .replace(/ARS/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '')
  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : 0
}

function formatPrice(value) {
  const amount = parsePrice(value)
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount)
}

function normalizeProduct(raw) {
  const numericId = Number(raw?.id)
  const template = productTemplateMap.get(numericId)
  const quantity = Number(raw?.quantity)
  const price = raw?.price ?? template?.price ?? 0
  return {
    id: numericId,
    name: raw?.name || template?.name || 'Producto JJ',
    price,
    priceLabel: formatPrice(price),
    image: template?.image || raw?.image || '/img/promo9.webp',
    quantity: Number.isFinite(quantity) ? quantity : (template?.quantity ?? 0),
  }
}

function buildProductsList(list) {
  const apiMap = new Map(
    (Array.isArray(list) ? list : [])
      .filter((item) => isCatalogProduct(item))
      .map((item) => normalizeProduct(item))
      .filter((item) => Number.isFinite(item.id))
      .map((item) => [item.id, item])
  )

  const ordered = productTemplates.map((template) => normalizeProduct(template))

  const extras = Array.from(apiMap.values())
    .filter((item) => !productTemplateMap.has(Number(item.id)))
    .filter((item) => Number(item.id) > 118 || String(item.image || '').startsWith('data:'))
    .sort((a, b) => Number(b.id) - Number(a.id))

  const merged = [...extras, ...ordered]
  const deduped = new Map()
  merged.forEach((item) => {
    if (!item || item.id == null) return
    if (!deduped.has(item.id)) deduped.set(item.id, item)
  })
  return Array.from(deduped.values())
}

export default function Productos() {
  const [products, setProducts] = useState(() => buildProductsList(productTemplates))
  const [favIds, setFavIds] = useState([])
  const [hiddenProductIds, setHiddenProductIds] = useState([])
  const userId = localStorage.getItem('userId')
  const qUser = userId ? `?user=${encodeURIComponent(userId)}` : ''
  const visibleProducts = (() => {
    const shouldHide = (product) => {
      const id = Number(product?.id)
      if (Number.isFinite(id) && hiddenProductIds.includes(id)) return true
      const name = String(product?.name || '').trim().toLowerCase()
      return /^(short|pantal[oó]n)$/.test(name)
    }
    const templateOrder = productTemplates.slice(2).map(p => Number(p.id)).filter(Number.isFinite)
    const templateIdSet = new Set(templateOrder)
    const byId = new Map((Array.isArray(products) ? products : []).map(p => [Number(p.id), p]))
    const orderedTemplates = templateOrder.map(id => byId.get(id)).filter(Boolean).filter(p => !shouldHide(p))
    const extras = (Array.isArray(products) ? products : [])
      .filter(p => !templateIdSet.has(Number(p.id)))
      .filter(p => !shouldHide(p))
      .sort((a, b) => Number(b.id) - Number(a.id))
    const extraSlots = Math.max(20 - orderedTemplates.length, 0)
    return [...extras.slice(0, extraSlots), ...orderedTemplates].slice(0, 20)
  })()

  useEffect(() => {
    let mounted = true
    fetch(apiUrl('/api/products/all'))
      .then(r => r.json())
      .then(data => {
        if (!mounted) return
        setProducts(buildProductsList(data))
      })
      .catch(() => {
        if (!mounted) return
        setProducts(buildProductsList(productTemplates))
      })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!userId) return
    fetch(apiUrl(`/api/user/favorites${qUser}`))
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setFavIds(data.map(p => p.id))
      })
      .catch(() => void 0)
  }, [userId, qUser])

  const toggleFavorite = async (product) => {
    if (!userId) {
      notify('Inicia sesión para guardar favoritos', 'warning')
      return
    }
    const isFav = favIds.includes(product.id)
    try {
      if (isFav) {
        await fetch(apiUrl(`/api/user/favorites/${product.id}${qUser}`), { method: 'DELETE' })
        setFavIds(prev => prev.filter(id => id !== product.id))
        notify('Eliminado de favoritos', 'info')
      } else {
        await fetch(apiUrl(`/api/user/favorites${qUser}`), { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ productId: product.id }) 
        })
        setFavIds(prev => [...prev, product.id])
        notify('Agregado a favoritos', 'success')
      }
      window.dispatchEvent(new CustomEvent('favs-updated'))
    } catch {
      notify('Error al actualizar favoritos', 'error')
    }
  }

  const isFavorite = (id) => favIds.includes(id)

  return (
    <main className="max-w-7xl mx-auto py-12 px-6">
      <div className="mb-12 text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">
          Nuestra colección <span className="text-[#1E3A8A]">2026</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {visibleProducts.map(p => (
          <div key={p.id} className="bg-white rounded-[2.5rem] p-3 shadow-sm hover:shadow-2xl transition-all duration-500 group border border-gray-100/50 flex flex-col h-full">
            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-gray-100">
              {/* Botón Favoritos */}
              <button 
                onClick={() => toggleFavorite(p)}
                className={`absolute top-4 right-4 z-20 p-3 rounded-2xl backdrop-blur-md transition-all duration-500 ${isFavorite(p.id) ? 'bg-red-500 text-white scale-110 shadow-lg' : 'bg-white/90 text-gray-400 hover:text-red-500 hover:scale-110 shadow-md'}`}
              >
                <svg className="w-5 h-5" fill={isFavorite(p.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              <img 
                src={p.image} 
                alt={p.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                onError={() => {
                  const id = Number(p?.id)
                  if (!Number.isFinite(id)) return
                  setHiddenProductIds(prev => (prev.includes(id) ? prev : [...prev, id]))
                }}
              />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
              
              {/* Overlay on Hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
                <Link 
                  to={`/comprar/${p.id}`} 
                  className="bg-white text-[#1E3A8A] p-4 rounded-full shadow-xl hover:scale-110 transition-transform active:scale-95"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                </Link>
              </div>
            </div>

            {/* Info del producto */}
            <div className="p-5 flex flex-col flex-grow text-center space-y-2">
              <h3 className="text-gray-900 font-bold text-lg group-hover:text-[#1E3A8A] transition-colors line-clamp-1">{p.name}</h3>
              <p className="text-[#1E3A8A] font-black text-xl">{p.priceLabel}</p>
              
              <div className="pt-4 mt-auto">
                <Link 
                  to={`/comprar/${p.id}`} 
                  className="block w-full bg-[#1E3A8A] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-800 transform active:scale-95 transition-all duration-300 shadow-xl"
                >
                  Comprar ahora
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

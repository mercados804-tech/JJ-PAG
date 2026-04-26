import { useEffect, useState } from 'react'
import { notify } from '../components/notify'
import { Link } from 'react-router-dom'

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const apiUrl = (url) => (API_BASE ? `${API_BASE}${url}` : url)

// Tarjetas estáticas tal como en promociones.html
const legacyPromos = [
  { id: 1, image: '/img/promo1.webp', title: 'Buzo', price: 'ARS 30.000,00', discount: 'AGOTADO', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 2, image: '/img/promo2.webp', title: 'Campera', price: 'ARS 37.300,00', discount: 'AGOTADO', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 3, image: '/img/promo3.webp', title: 'Campera', price: 'ARS 50.000,00', discount: '29 OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 4, image: '/img/promo4.webp', title: 'Buzo', price: 'ARS 50.000,00', discount: '20% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 5, image: '/img/promo5.webp', title: 'Campera', price: 'ARS 56.500,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 6, image: '/img/promo6.webp', title: 'Campera', price: 'ARS 50.000,00', discount: '29% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 7, image: '/img/promo7.webp', title: 'Pantalon', price: 'ARS 32.000,00', discount: '29% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 8, image: '/img/promo8.webp', title: 'Remera', price: 'ARS 24.300,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 9, image: '/img/promo9.webp', title: 'Remera', price: 'ARS 24.300,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 10, image: '/img/promo10.webp', title: 'Remera', price: 'ARS 24.300,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 11, image: '/img/promo11.webp', title: 'Buzo', price: 'ARS 50.000,00', discount: '20% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 12, image: '/img/promo12.webp', title: 'Remera', price: 'ARS 24.000,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 13, image: '/img/promo13.webp', title: 'Buzo', price: 'ARS 50.000,00', discount: '20% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 14, image: '/img/promo14.webp', title: 'Remera', price: 'ARS 24.300,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 15, image: '/img/promo15.webp', title: 'Remera', price: 'ARS 24.300,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 16, image: '/img/promo16.webp', title: 'Buzo', price: 'ARS 39.000,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 17, image: '/img/promo17.webp', title: 'Remera', price: 'ARS 33.000,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 18, image: '/img/promo18.webp', title: 'Remera', price: 'ARS 24.300,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
]

const LEGACY_PROMOTION_STORAGE_KEY = 'jjLegacyPromotionOverrides'

function dedupeById(list) {
  const merged = new Map()
  ;(Array.isArray(list) ? list : []).forEach((item) => {
    if (!item || item.id == null) return
    const current = merged.get(item.id) || {}
    merged.set(item.id, { ...current, ...item })
  })
  return Array.from(merged.values())
}

function readStoredLegacyPromotionOverrides() {
  try {
    const raw = localStorage.getItem(LEGACY_PROMOTION_STORAGE_KEY)
    const parsed = JSON.parse(raw || '[]')
    return dedupeById(Array.isArray(parsed) ? parsed : [])
  } catch {
    return []
  }
}

function buildLocalLegacyFallbacks() {
  return readStoredLegacyPromotionOverrides().map((item) => {
    const base = legacyPromos.find((promo) => Number(promo.id) === Number(item.id)) || {}
    const state = item.deleted ? 'eliminada' : (item.estado || 'potencial')
    return {
      ...base,
      ...item,
      title: item.title || base.title,
      description: item.description || base.description,
      image: item.image || base.image,
      price: item.price || base.price,
      sizes: item.sizes || base.sizes,
      discount: state === 'agotada' ? 'AGOTADO' : (state === 'eliminada' ? 'ELIMINADA' : (item.discount || base.discount)),
      estado: state,
      isLegacy: true,
      deleted: !!item.deleted,
    }
  })
}

function getPromoBadgeClasses(label) {
  const value = String(label || '').toUpperCase()
  if (value.includes('AGOTADO') || value.includes('FIN')) {
    return 'bg-gray-900 text-white'
  }
  return 'bg-red-600 text-white'
}

function getStockText(promo) {
  if (typeof promo?.stockPromocionRestante !== 'number') return null
  if (promo.estado === 'agotada') return 'Stock promocional agotado'
  if (promo.estado === 'finalizada') return 'Promocion finalizada'
  return `Stock promo disponible: ${promo.stockPromocionRestante}`
}

function formatPrice(price) {
  if (typeof price === 'string') return price
  if (typeof price !== 'number') return ''
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(price)
}

function isForcedSoldOutPromotion(title) {
  const normalized = String(title || '').trim().toLowerCase()
  return normalized === 'promo 10%' || normalized === '2x1 remeras'
}


export default function Promociones() {
  const [items, setItems] = useState([])
  const userId = (localStorage.getItem('userId') || 'guest')
  const qUser = `?user=${encodeURIComponent(userId)}`
  const isLoggedIn = !!userId && userId.toLowerCase() !== 'guest'

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const promosResp = await fetch(apiUrl('/api/promotions/all'))
        const text = await promosResp.text()
        let promos = []
        try {
          promos = JSON.parse(text)
        } catch {
          promos = []
        }
        const activePromos = dedupeById([...(Array.isArray(promos) ? promos : []), ...buildLocalLegacyFallbacks()])
        
        // Mapeamos las legacyPromos para asegurar que todas estén presentes
        const merged = legacyPromos.map(lp => {
          const active = activePromos.find(ap =>
            Number(ap?.id) === Number(lp.id) && (ap?.isLegacy || ap?.productId == null)
          ) || activePromos.find(ap =>
            (ap?.title && ap.title.toLowerCase() === lp.title.toLowerCase()) ||
            (ap?.image && ap.image === lp.image)
          )
          // Si hay active, usamos su productId (camelCase del backend) o su id. Si no, usamos el id de legacy.
          const productId = active ? (active.productId || active.product_id || active.id) : lp.id
          if (active?.deleted || active?.estado === 'eliminada') return null
          if (active) {
            if (active.isLegacy || active.productId == null) {
              return {
                ...lp,
                ...active,
                title: lp.title,
                description: lp.description,
                image: lp.image,
                price: lp.price,
                sizes: lp.sizes,
                isLegacy: true,
                detailHref: `/comprar/${lp.id}`,
              }
            }
            return { ...lp, ...active, isLegacy: false, detailHref: `/comprar/${productId}` }
          }
          return { ...lp, isLegacy: true, estado: 'potencial', detailHref: `/comprar/${lp.id}` }
        }).filter(Boolean)

        // También agregamos promociones que no están en legacy
        activePromos.forEach(ap => {
          if (ap?.deleted || ap?.estado === 'eliminada') return
          if (!merged.find(m => m.id === ap.id)) {
            const productId = ap.product_id || ap.id
            merged.push({ ...ap, isLegacy: false, detailHref: `/comprar/${productId}` })
          }
        })

        setItems(merged)
      } catch {
        const activePromos = buildLocalLegacyFallbacks()
        const merged = legacyPromos.map((lp) => {
          const active = activePromos.find((ap) => Number(ap.id) === Number(lp.id))
          if (active?.deleted || active?.estado === 'eliminada') return null
          return active
            ? { ...lp, ...active, isLegacy: false, detailHref: `/comprar/${lp.id}` }
            : { ...lp, isLegacy: true, estado: 'potencial', detailHref: '/productos' }
        }).filter(Boolean)
        setItems(merged)
      }
    }
    fetchPromos()
  }, [isLoggedIn, qUser])

  const [favIds, setFavIds] = useState([])

  useEffect(() => {
    if (!isLoggedIn) return
    fetch(apiUrl(`/api/user/favorites${qUser}`))
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setFavIds(data.map(p => p.id))
      })
      .catch(() => void 0)
  }, [isLoggedIn, qUser])

  const toggleFavorite = async (product) => {
    if (!isLoggedIn) {
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
    <section className="max-w-7xl mx-auto p-5">
      {isLoggedIn && (
        <div className="flex justify-end mb-6">
          <Link 
            to="/mi-espacio" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white rounded-xl font-bold text-sm hover:bg-brandNav transition-all shadow-md active:scale-95" 
            title="Volver al panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al panel
          </Link>
        </div>
      )}

      <h1 className="text-3xl text-[#1E3A8A] text-center font-bold mb-8 uppercase tracking-wider">Promociones</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {items.length === 0 && (
          <p className="text-gray-500 text-center col-span-full italic py-10">No hay promociones disponibles en este momento.</p>
        )}
        {items.map((p, idx) => {
          const isPotencial = p.estado === 'potencial'
          const href = p.detailHref || `/comprar/${p.id}`
          const title = p.title || p.name || 'Promoción'
          const forcedSoldOut = isForcedSoldOutPromotion(title)
          const effectiveState = forcedSoldOut ? 'agotada' : p.estado
          const badge = forcedSoldOut
            ? 'AGOTADO'
            : (p.discount || (p.isLegacy ? 'Próximamente' : null))
          const stockText = forcedSoldOut ? 'Stock promocional agotado' : getStockText({ ...p, estado: effectiveState })
          const isPromoActive = effectiveState === 'activa'
          const isSoldOut = effectiveState === 'agotada'
          const isFinished = effectiveState === 'finalizada'
          const isDeleted = effectiveState === 'eliminada'
          const priceStr = formatPrice(p.price)
          const normalPriceStr = formatPrice(p.normalPrice || p.precio_normal)
          
          return (
            <div key={p.id ? `p-${p.id}` : `idx-${idx}`} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 relative group flex flex-col h-full ${isPotencial ? 'opacity-90 grayscale-[0.2] hover:grayscale-0' : ''}`}>
              {/* Botón Favoritos */}
              <button 
                onClick={() => toggleFavorite(p)}
                className={`absolute top-4 right-4 z-10 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${isFavorite(p.id) ? 'bg-red-500 text-white scale-110 shadow-lg' : 'bg-white/90 text-gray-400 hover:text-red-500 hover:scale-110 shadow-md'}`}
              >
                <svg className="w-5 h-5" fill={isFavorite(p.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              {/* Etiqueta de Descuento / Estado */}
              {badge && (
                <div className="absolute top-4 left-4 z-10">
                  <span className={`${getPromoBadgeClasses(badge)} text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-widest shadow-lg`}>
                    {badge}
                  </span>
                </div>
              )}

              {/* Imagen con zoom */}
              <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                <img 
                  src={p.image} 
                  alt={title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col flex-grow text-center">
                <h3 className="text-gray-900 font-bold text-lg mb-1 truncate group-hover:text-brandBlue transition-colors">{title}</h3>
                <div className="flex flex-col gap-1 mb-4">
                  {priceStr && <p className="text-brandBlue font-black text-xl">{priceStr}</p>}
                  {isPromoActive && normalPriceStr && normalPriceStr !== priceStr && (
                    <p className="text-sm text-gray-400 line-through">{normalPriceStr}</p>
                  )}
                  {p.sizes && (
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      Talles: {p.sizes}
                    </p>
                  )}
                  {stockText && (
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      {stockText}
                    </p>
                  )}
                  {p.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{p.description}</p>
                  )}
                </div>

                <div className="mt-auto space-y-2">
                  {isDeleted ? null : isSoldOut ? (
                    <span className="inline-flex items-center justify-center w-full bg-red-600 text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-md">
                      AGOTADO
                    </span>
                  ) : isFinished ? (
                    <span className="inline-flex items-center justify-center w-full bg-gray-700 text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-md">
                      FINALIZADA
                    </span>
                  ) : (
                    <Link 
                      to={href} 
                      className="inline-flex items-center justify-center w-full bg-[#1E3A8A] text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brandNav transform active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      COMPRAR AHORA
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

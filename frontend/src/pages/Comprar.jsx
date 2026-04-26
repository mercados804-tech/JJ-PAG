import { useEffect, useState } from 'react'
import { notify } from '../components/notify'
import { useParams, useNavigate } from 'react-router-dom'

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const apiUrl = (url) => (API_BASE ? `${API_BASE}${url}` : url)

function parseMoney(value) {
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

function formatMoney(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(parseMoney(value))
}

const productImageTemplates = {
  101: '/img/promo9.webp',
  102: '/img/chomba.webp',
  103: '/img/promo7.webp',
  104: '/img/bermuda.webp',
  105: '/img/ima1.webp',
  106: '/img/ima2.webp',
  107: '/img/c++.webp',
  108: '/img/gptr,1265x,front,black-c,330,402,600,600-bg,f8f8f8.u3.jpg',
  109: '/img/promo16.webp',
  110: '/img/promo17.webp',
  111: '/img/promo12.webp',
  112: '/img/promo15.webp',
  113: '/img/promo3.webp',
  114: '/img/promo14.webp',
  115: '/img/ima3.webp',
  116: '/img/ima2.webp',
  117: '/img/promo13.webp',
  118: '/img/ima1.webp',
}

export default function Comprar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selColor, setSelColor] = useState('')
  const [selTalle, setSelTalle] = useState('')
  const [selQty, setSelQty] = useState(1)
  const userId = (localStorage.getItem('userId') || 'guest')
  const qUser = `?user=${encodeURIComponent(userId)}`
  const sizes = item?.sizes
    ? String(item.sizes).split(',').map(s => s.trim()).filter(Boolean)
    : ['S', 'M', 'L', 'XL']
  const itemTitle = item?.title || item?.name || 'Producto JJ'
  const visiblePrice = formatMoney(item?.price)
  const isPromotionItem = item?.productId != null
    || item?.product_id != null
    || item?.normalPrice != null
    || item?.discount != null
    || typeof item?.stockPromocionRestante === 'number'
    || typeof item?.stockPromocion === 'number'
  const availableStock = typeof item?.stockPromocionRestante === 'number'
    ? item.stockPromocionRestante
    : (typeof item?.quantity === 'number' ? item.quantity : null)
  const isSoldOut = isPromotionItem && (item?.estado === 'agotada' || item?.estado === 'finalizada' || availableStock === 0)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    const pid = parseInt(id, 10)
    // Fallback: tarjetas estáticas tal como en promociones.html
    const legacy = [
          { id: 1, image: '/img/promo1.webp', title: 'Buzo', price: 'ARS 30.000,00', discount: '33% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
          { id: 2, image: '/img/promo2.webp', title: 'Campera', price: 'ARS 37.300,00', discount: '40% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
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
    // Fallback adicional: productos estáticos tal como en productos.html
    const productsLegacy = [
          { id: 101, image: '/img/promo9.webp', title: 'Remera JJ', price: 'ARS 35.990,00', sizes: 'S, M, L, XL', description: 'Remera Regular Fit', quantity: 20 },
          { id: 102, image: '/img/chomba.webp', title: 'Chomba JJ', price: 'ARS 25.000,00', sizes: 'S, M, L, XL', description: 'Chomba Catania (GRIS)', quantity: 20 },
          { id: 103, image: '/img/promo7.webp', title: 'Pantalón Sport JJ', price: 'ARS 31.700,00', sizes: 'S, M, L, XL', description: 'Pantalón Sport Beige', quantity: 20 },
          { id: 104, image: '/img/bermuda.webp', title: 'Pantalón JJ', price: 'ARS 30.000,00', sizes: 'S, M, L, XL', description: 'Bermuda/Pantalón', quantity: 20 },
          { id: 105, image: '/img/ima1.webp', title: 'Remera Negra JJ', price: 'ARS 23.000,00', sizes: 'S, M, L, XL', description: 'Remera', quantity: 20 },
          { id: 106, image: '/img/ima2.webp', title: 'Remera Negra JJ', price: 'ARS 21.000,00', sizes: 'S, M, L, XL', description: 'Remera', quantity: 20 },
          { id: 107, image: '/img/c++.webp', title: 'Remera Azul C++ JJ', price: 'ARS 15.000,00', sizes: 'S, M, L, XL', description: 'Remera', quantity: 20 },
          { id: 108, image: '/img/gptr,1265x,front,black-c,330,402,600,600-bg,f8f8f8.u3.jpg', title: 'Remera Negro JJ', price: 'ARS 20.000,00', sizes: 'S, M, L, XL', description: 'Remera', quantity: 20 },
          { id: 109, image: '/img/promo16.webp', title: 'Remera Blanca JJ', price: 'ARS 22.000,00', sizes: 'S, M, L, XL', description: 'Remera', quantity: 20 },
          { id: 110, image: '/img/promo17.webp', title: 'Remera Blanca JJ', price: 'ARS 23.000,00', sizes: 'S, M, L, XL', description: 'Remera', quantity: 20 },
          { id: 111, image: '/img/promo12.webp', title: 'Remera Negra JJ', price: 'ARS 20.000,00', sizes: 'S, M, L, XL', description: 'Remera', quantity: 20 },
          { id: 112, image: '/img/promo15.webp', title: 'Buzo Celeste JJ', price: 'ARS 45.000,00', sizes: 'S, M, L, XL', description: 'Buzo', quantity: 20 },
          { id: 113, image: '/img/promo3.webp', title: 'Buzo Tricolor JJ', price: 'ARS 37.000,00', sizes: 'S, M, L, XL', description: 'Buzo', quantity: 20 },
          { id: 114, image: '/img/promo14.webp', title: 'Remera Negro JJ', price: 'ARS 16.000,00', sizes: 'S, M, L, XL', description: 'Remera', quantity: 20 },
          { id: 115, image: '/img/ima3.webp', title: 'Chomba Azul JJ', price: 'ARS 20.000,00', sizes: 'S, M, L, XL', description: 'Chomba', quantity: 20 },
          { id: 116, image: '/img/ima2.webp', title: 'Chomba Negra JJ', price: 'ARS 20.000,00', sizes: 'S, M, L, XL', description: 'Chomba', quantity: 20 },
          { id: 117, image: '/img/promo13.webp', title: 'Buzo Negro JJ', price: 'ARS 32.000,00', sizes: 'S, M, L, XL', description: 'Buzo', quantity: 20 },
          { id: 118, image: '/img/ima1.webp', title: 'Chomba JJ', price: 'ARS 25.000,00', sizes: 'S, M, L, XL', description: 'Chomba', quantity: 20 },
        ]
    const normalizeProduct = (product) => {
      if (!product) return null
      return {
        ...product,
        title: product.title || product.name,
        image: productImageTemplates[Number(product.id)] || product.image,
        price: typeof product.price === 'number' ? formatMoney(product.price) : product.price,
        quantity: typeof product.quantity === 'number' ? product.quantity : Number(product.quantity || 0),
      }
    }
    const resolveFrom = (promoList, productList) => {
      const foundBackend = Array.isArray(promoList) ? promoList.find(p => p.id === pid || p.productId === pid || p.product_id === pid) : null
      const foundPromo = legacy.find(p => p.id === pid) || null
      const foundProductApi = normalizeProduct(Array.isArray(productList) ? productList.find(p => Number(p.id) === pid) : null)
      const foundProduct = productsLegacy.find(p => p.id === pid) || null
      return foundBackend || foundPromo || foundProductApi || foundProduct || null
    }
    Promise.all([
      fetch(apiUrl('/api/promotions/all')).then(r => r.json()).catch(() => []),
      fetch(apiUrl('/api/products/all')).then(r => r.json()).catch(() => []),
    ])
      .then(([promoList, productList]) => {
        if (!mounted) return
        setItem(resolveFrom(promoList, productList))
      })
      .catch(() => { if (!mounted) return; setItem(resolveFrom(null, null)) })
      .finally(() => setLoading(false))
    return () => { mounted = false }
  }, [id])

  const addToCart = async () => {
    if (!item) return
    if (isSoldOut) {
      notify('Este producto está agotado en este momento', 'warning')
      return
    }
    if (!selColor || !selTalle || selQty <= 0) {
    notify('Selecciona color, talle y una cantidad válida', 'warning')
      return
    }
    try {
      const payload = {
        id: item.productId || item.id,
        name: itemTitle,
        price: parseMoney(item.price),
        image: item.image,
        quantity: selQty,
        color: selColor,
        talle: selTalle,
        description: item.description,
      }
      
      // Intentar guardar en backend
      try {
        const resp = await fetch(apiUrl(`/api/cart${qUser}`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const data = await resp.json()
        if (!resp.ok || data.ok === false) {
          console.warn('Backend cart save failed, using local only')
        }
      } catch {
        console.warn('Backend cart fetch failed, using local only')
      }

      // Guardar siempre en localStorage para persistencia guest
      const raw = localStorage.getItem('cart')
      const cart = raw ? JSON.parse(raw) : []
      const existingIdx = cart.findIndex(it => it.id === payload.id && it.color === payload.color && it.talle === payload.talle)
      if (existingIdx >= 0) {
        cart[existingIdx].quantity += payload.quantity
      } else {
        cart.push(payload)
      }
      localStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new CustomEvent('cart-updated'))

      notify('Agregado al carrito', 'success')
      navigate('/carrito')
    } catch {
      notify('No se pudo añadir al carrito', 'error')
    }
  }

  if (loading) {
    return <section className="p-5"><p className="text-center text-gray-600">Cargando producto...</p></section>
  }

  if (!item) {
    return <section className="p-5"><p className="text-center text-red-600">Producto no encontrado.</p></section>
  }

  return (
    <section className="py-12 px-6 max-w-6xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
        <div className="space-y-2 text-center md:text-left w-full">
          <p className="text-blue-600 font-black uppercase tracking-widest text-xs">Detalle de Producto</p>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">
            Personalizá tu <span className="text-[#1E3A8A]">Elección</span>
          </h1>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start group hover:shadow-2xl transition-all duration-500">
        {/* Imagen del Producto */}
        <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-gray-50 shadow-inner">
          <img 
            src={item.image} 
            alt={item.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
          />
          {item.discount && (
            <span className="absolute top-6 left-6 z-10 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
              {item.discount}
            </span>
          )}
        </div>

        {/* Información y Opciones */}
        <div className="space-y-8 flex flex-col h-full justify-center">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight leading-tight">
              {itemTitle}
            </h2>
            <p className="text-3xl font-black text-[#1E3A8A]">{visiblePrice}</p>
            {item.estado === 'activa' && item.normalPrice && item.normalPrice !== item.price && (
              <p className="text-lg font-bold text-gray-400 line-through">{item.normalPrice}</p>
            )}
            {isPromotionItem && item.estado && (
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                Estado: {item.estado === 'activa' ? 'Oferta vigente' : item.estado === 'agotada' ? 'Stock promocional agotado' : 'Promocion finalizada'}
              </p>
            )}
          </div>

          {item.description && (
            <p className="text-gray-500 font-medium leading-relaxed">
              {item.description}
            </p>
          )}

          <div className="space-y-6">
            {/* Selector de Color */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Color Disponible</label>
              <div className="flex flex-wrap gap-3">
                {['Negro', 'Blanco', 'Azul', 'Rojo'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelColor(color)}
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                      selColor === color 
                        ? 'border-[#1E3A8A] bg-blue-50 text-[#1E3A8A]' 
                        : 'border-gray-50 text-gray-400 hover:border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Talle */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Seleccionar Talle</label>
              <div className="flex flex-wrap gap-3">
                {sizes.map((talle) => (
                  <button
                    key={talle}
                    onClick={() => setSelTalle(talle)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xs font-black uppercase border-2 transition-all ${
                      selTalle === talle 
                        ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white shadow-xl scale-110' 
                        : 'border-gray-50 text-gray-400 hover:border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    {talle}
                  </button>
                ))}
              </div>
            </div>

            {/* Cantidad */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cantidad</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100">
                  <button 
                    onClick={() => setSelQty(Math.max(1, selQty - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[#1E3A8A] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"/></svg>
                  </button>
                  <input 
                    type="number" 
                    min="1" 
                    value={selQty} 
                    onChange={e => setSelQty(parseInt(e.target.value, 10) || 1)} 
                    className="w-12 text-center bg-transparent border-none text-sm font-black text-[#1E3A8A] focus:ring-0" 
                  />
                  <button 
                    onClick={() => setSelQty(selQty + 1)}
                    disabled={isSoldOut}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[#1E3A8A] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                  </button>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unidades</p>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-4">
            <button 
              onClick={addToCart} 
                disabled={isSoldOut}
                className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl ${isSoldOut ? 'bg-red-600 text-white cursor-not-allowed' : 'bg-[#1E3A8A] text-white hover:bg-blue-800 hover:scale-[1.02] active:scale-[0.98]'}`}
            >
                {isSoldOut ? 'Agotado' : 'Comprar'}
            </button>
            <button 
              onClick={() => navigate('/productos')} 
              className="flex-1 bg-white border-2 border-gray-100 text-gray-900 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all active:scale-[0.98]"
            >
              Ver más productos
            </button>
          </div>

          {/* Beneficios Mini */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 text-[#1E3A8A] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              </div>
              <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Envío Nacional</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Calidad Premium</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

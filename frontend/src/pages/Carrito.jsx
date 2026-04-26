import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const apiUrl = (url) => (API_BASE ? `${API_BASE}${url}` : url)

export default function Carrito() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const userId = (localStorage.getItem('userId') || 'guest').toLowerCase()
    const load = async () => {
      let localItems = []
      try {
        const raw = localStorage.getItem('cart')
        const parsed = raw ? JSON.parse(raw) : []
        localItems = Array.isArray(parsed) ? parsed : []
      } catch {
        localItems = []
      }

      // Intentar cargar desde backend primero si no es guest
      if (userId !== 'guest') {
        try {
          const resp = await fetch(apiUrl(`/api/cart?user=${encodeURIComponent(userId)}`))
          const data = await resp.json()
          if (Array.isArray(data)) {
            if (data.length === 0 && localItems.length > 0) {
              setItems(localItems)
              localStorage.setItem('cart', JSON.stringify(localItems))
              window.dispatchEvent(new CustomEvent('cart-updated'))
              await Promise.allSettled(
                localItems.map((it) =>
                  fetch(apiUrl(`/api/cart?user=${encodeURIComponent(userId)}`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: it.id,
                      name: it.name,
                      price: Number(it.price) || 0,
                      image: it.image,
                      quantity: Number(it.quantity) || 1,
                      color: it.color,
                      talle: it.talle,
                      description: it.description,
                    }),
                  })
                )
              )
              return
            }

            setItems(data)
            localStorage.setItem('cart', JSON.stringify(data)) // Sincronizar
            window.dispatchEvent(new CustomEvent('cart-updated'))
            return
          }
        } catch {
          console.warn('Backend load failed, using local')
        }
      }
      
      // Fallback a localStorage
      setItems(localItems)
    }
    load()
  }, [])

  const totalUnits = items.reduce((acc, it) => acc + (it.quantity || 1), 0)
  const subtotal = items.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0)

  const vaciar = async () => {
    const userId = (localStorage.getItem('userId') || 'guest').toLowerCase()
    try {
      await fetch(apiUrl(`/api/cart?user=${encodeURIComponent(userId)}`), { method: 'DELETE' })
    } catch {
      void 0
    }
    localStorage.setItem('cart', JSON.stringify([]))
    window.dispatchEvent(new CustomEvent('cart-updated'))
    setItems([])
  }

  return (
    <section className="py-12 px-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
        <div className="space-y-2">
          <p className="text-blue-600 font-black uppercase tracking-widest text-xs">Tu Selección</p>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">
            Carrito de <span className="text-[#1E3A8A]">Compras</span>
          </h1>
        </div>
        <Link 
          to="/productos" 
          className="group flex items-center gap-3 text-[#1E3A8A] font-black uppercase tracking-widest text-xs border-b-2 border-transparent hover:border-blue-600 pb-1 transition-all"
        >
          <svg className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          Seguir Comprando
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Panel de productos */}
        <div className="lg:col-span-2 space-y-6">
          {items.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-sm">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
              <p className="text-gray-500 mb-8">¿Aún no sabés qué elegir? Tenemos las mejores prendas para vos.</p>
              <Link to="/productos" className="inline-block bg-[#1E3A8A] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-800 transition-all shadow-xl">
                Explorar Catálogo
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="space-y-1">
                  <p className="text-blue-600 font-black uppercase tracking-widest text-[10px]">Tus Artículos</p>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                    Lista de <span className="text-[#1E3A8A]">Productos</span>
                  </h2>
                </div>
                <div className="flex items-center gap-3 justify-center sm:justify-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {totalUnits} {totalUnits === 1 ? 'Unidad' : 'Unidades'}
                  </span>
                  <div className="w-12 h-[2px] bg-gray-100" />
                </div>
              </div>

              <div className="space-y-4">
                {items.map((p, idx) => (
                  <div key={idx} className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col sm:flex-row items-center gap-6 group">
                    <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
                      <img 
                        src={p.image || '/img/ima1.webp'} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => { e.target.src = '/img/ima1.webp' }}
                      />
                    </div>
                    <div className="flex-grow text-center sm:text-left space-y-1">
                      <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight group-hover:text-[#1E3A8A] transition-colors">
                        {p.name || 'Producto'}
                      </h3>
                      <p className="text-gray-500 text-sm font-medium">
                        {p.description || `${p.talle ? `Talle: ${p.talle}` : ''}${p.color ? ` | Color: ${p.color}` : ''}` || 'Sin especificaciones'}
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-4 pt-2">
                        <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                          Cantidad: {p.quantity || 1}
                        </span>
                      </div>
                    </div>
                    <div className="text-center sm:text-right flex flex-col gap-1">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Precio Unitario</p>
                      <p className="text-xl font-black text-[#1E3A8A]">
                        ARS {(p.price || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm font-bold text-gray-900 mt-2">
                        Total: ARS {((p.price || 0) * (p.quantity || 1)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-6">
                <button 
                  onClick={vaciar} 
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-red-500 font-black uppercase tracking-widest text-[10px] hover:text-red-700 transition-colors p-4"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  Vaciar Carrito de Compras
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panel de resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 sticky top-32 md:top-40">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-8">
              Resumen del <span className="text-[#1E3A8A]">Pedido</span>
            </h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                <span className="text-gray-500 font-medium uppercase tracking-widest text-xs">Subtotal</span>
                <span className="text-gray-900 font-bold">ARS {subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                <span className="text-gray-500 font-medium uppercase tracking-widest text-xs">Descuento</span>
                <span className="text-emerald-600 font-bold">- ARS 0,00</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-900 font-black uppercase tracking-widest text-sm">Total</span>
                <span className="text-3xl font-black text-[#1E3A8A]">
                  ARS {subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <Link 
                to="/proceder-pago" 
                className={`block w-full text-center py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
                  items.length === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-[#1E3A8A] text-white hover:bg-blue-800'
                }`}
                onClick={(e) => items.length === 0 && e.preventDefault()}
              >
                Proceder al Pago
              </Link>
              <p className="text-[10px] text-gray-400 text-center font-medium px-4 uppercase tracking-tighter">
                Al continuar, aceptas nuestros términos y condiciones de compra.
              </p>
            </div>

            {/* Beneficios */}
            <div className="mt-10 pt-8 border-t border-gray-50 space-y-4">
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#1E3A8A] group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Compra 100% Segura</p>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </div>
                <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Cambios y Devoluciones Simples</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

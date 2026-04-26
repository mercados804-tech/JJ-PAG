import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const apiUrl = (url) => (API_BASE ? `${API_BASE}${url}` : url)

export default function ConfirmarCompra() {
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    const userId = (localStorage.getItem('userId') || 'guest').toLowerCase()
    try {
      localStorage.removeItem('cart')
      window.dispatchEvent(new CustomEvent('cart-updated'))
    } catch { void 0 }
    // Intentar vaciar también en backend si hay sesión
    if (userId && userId !== 'guest') {
      fetch(apiUrl(`/api/cart?user=${encodeURIComponent(userId)}`), { method: 'DELETE' }).catch(() => {})
    }
    try {
      const raw = localStorage.getItem('lastOrderItems') || localStorage.getItem('cart')
      const parsed = raw ? JSON.parse(raw) : []
      setItems(Array.isArray(parsed) ? parsed : [])
    } catch {
      setItems([])
    }
    try {
      const rawS = localStorage.getItem('checkoutSummary')
      const parsedS = rawS ? JSON.parse(rawS) : null
      setSummary(parsedS)
    } catch {
      setSummary(null)
    }
  }, [])

  const total = useMemo(() => (
    items.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0)
  ), [items])

  return (
    <section className="py-20 px-6 max-w-4xl mx-auto min-h-[80vh] flex items-center justify-center">
      <div className="w-full bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-gray-100 text-center space-y-8">
        {/* Success Icon */}
        <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
        </div>

        <div className="space-y-2">
          <p className="text-emerald-600 font-black uppercase tracking-[0.3em] text-xs">¡Pedido Confirmado!</p>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">
            ¡Gracias por <span className="text-[#1E3A8A]">tu compra!</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-md mx-auto">
            Hemos recibido tu pedido correctamente. Pronto recibirás un correo con los detalles del envío.
          </p>
        </div>

        <div className="bg-gray-50/50 rounded-[2rem] p-6 md:p-8 text-left border border-gray-100 space-y-6">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-4">
            Resumen del Pedido
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Artículos</span>
                <span className="text-gray-900 font-bold">{items.length} unidades</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Pagado</span>
                <span className="text-2xl font-black text-[#1E3A8A]">ARS {total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {summary && (
              <div className="space-y-3 text-sm border-t md:border-t-0 md:border-l border-gray-200 md:pl-8 pt-6 md:pt-0">
                <div className="space-y-1">
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Método de Pago</p>
                  <p className="text-gray-900 font-bold">
                    {summary.paymentMethod} {summary.channel === 'tarjeta' ? '• Tarjeta' : summary.channel === 'transferencia' ? '• Transferencia' : ''}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Entrega</p>
                  <p className="text-gray-900 font-bold">
                    {summary.delivery === 'domicilio' ? 'Envío a domicilio' : 'Retiro por local'}
                  </p>
                </div>

                {summary.delivery === 'domicilio' && (
                  <div className="space-y-1">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Dirección de Envío</p>
                    <p className="text-gray-700 font-medium leading-relaxed">
                      {summary.address}<br />
                      {summary.province} {summary.postalCode ? `(${summary.postalCode})` : ''}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link 
            to="/productos" 
            className="bg-[#1E3A8A] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-800 transition-all shadow-xl hover:scale-105 active:scale-95"
          >
            Volver a la Tienda
          </Link>
          <Link 
            to="/mi-espacio?tab=pedidos" 
            className="bg-white border-2 border-gray-100 text-gray-900 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all hover:scale-105 active:scale-95"
          >
            Ver mis Pedidos
          </Link>
        </div>
      </div>
    </section>
  )
}

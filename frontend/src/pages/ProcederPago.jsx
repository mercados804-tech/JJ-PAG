import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { notify } from '../components/notify'

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const apiUrl = (url) => (API_BASE ? `${API_BASE}${url}` : url)

export default function ProcederPago() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', email: '', direccion: '', provincia: '', postalCode: '', telefono: '' })
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState('tarjeta') // tarjeta | mp | manual
  const [delivery, setDelivery] = useState('retiro') // retiro | domicilio
  const [isVerified, setIsVerified] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [showVerification, setShowVerification] = useState(false)
  // Campos del formulario clásico de tarjeta
  const [card, setCard] = useState({ titular: '', numero: '', vencimiento: '', cvv: '' })
  
  const userId = (localStorage.getItem('userId') || 'guest').toLowerCase()

  // Helper para peticiones JSON con fallback a URL absoluta
  const postJson = async (url, body) => {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
    const r = await fetch(apiUrl(url), options)
    const d = await r.json().catch(() => ({}))
    return { ok: r.ok, data: d }
  }

  // Autocompletar titular de tarjeta desde "Nombre Completo" si está vacío
  useEffect(() => {
    if (method === 'tarjeta') {
      const titularActual = String(card.titular || '').trim()
      const nombreCompleto = String(form.nombre || '').trim()
      if (!titularActual && nombreCompleto) {
        setCard(v => ({ ...v, titular: nombreCompleto }))
      }
    }
  }, [method, form.nombre, card.titular])

  // Cargar email si está logueado
  useEffect(() => {
    if (userId !== 'guest') {
      fetch(apiUrl(`/api/user/me?user=${encodeURIComponent(userId)}`))
        .then(r => r.json())
        .then(u => {
          setForm(f => ({ ...f, email: u.email, nombre: u.name || f.nombre }))
          setIsVerified(!!u.is_verified)
        })
    }
  }, [userId])

  const sendCode = async () => {
    if (!form.email) { notify('Ingresa un email', 'warning'); return }
    try {
      setLoading(true)
      const resp = await postJson('/api/auth/send-verification', { email: form.email })
      if (resp.ok) {
        setShowVerification(true)
        notify('Código enviado. Revisa tu email.', 'info')
      } else {
        notify(resp.data?.error || 'Error al enviar código', 'error')
      }
    } catch {
      notify('Error de red al enviar código', 'error')
    } finally { setLoading(false) }
  }

  const verifyCode = async () => {
    try {
      setLoading(true)
      const emailNorm = (form.email || '').trim().toLowerCase()
      const codeTrim = (verificationCode || '').trim()
      
      const resp = await postJson('/api/auth/verify-email', { email: emailNorm, code: codeTrim })
      if (resp.ok && resp.data.ok) {
        setIsVerified(true)
        setShowVerification(false)
        notify('Email verificado con éxito', 'success')
      } else {
        notify(resp.data?.error || 'Código inválido', 'error')
      }
    } catch {
      notify('Error al verificar código', 'error')
    } finally { setLoading(false) }
  }

  function validarDatosBasicos() {
    if (!form.nombre?.trim()) { notify('Completa el nombre', 'warning'); return false }
    if (!form.email?.trim()) { notify('Completa el email', 'warning'); return false }
    if (!isVerified) { notify('Debes verificar tu email antes de continuar', 'warning'); return false }
    if (!form.telefono?.trim()) { notify('Completa el teléfono', 'warning'); return false }
    return true
  }

  function validarEntrega() {
    if (delivery === 'domicilio') {
      if (!form.direccion?.trim()) { notify('Completa la dirección', 'warning'); return false }
      if (!form.provincia?.trim()) { notify('Completa la provincia', 'warning'); return false }
      if (!form.postalCode?.trim()) { notify('Completa el código postal', 'warning'); return false }
      const cp = String(form.postalCode).trim()
      if (!/^[0-9A-Za-z-]{3,10}$/.test(cp)) { notify('Código postal inválido', 'warning'); return false }
    }
    return true
  }

  function validarTarjeta() {
    const titular = String(card.titular || '').trim()
    if (!titular || !/^[A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]+)+$/.test(titular)) {
      notify('Ingresa nombre y apellido del titular como figura en la tarjeta', 'warning')
      return false
    }
    const num = String(card.numero).replace(/\s+/g, '')
    if (!/^[0-9]{13,19}$/.test(num)) { notify('Número de tarjeta inválido', 'warning'); return false }
    if (!/^((0[1-9])|(1[0-2]))\/[0-9]{2}$/.test(String(card.vencimiento))) { notify('Vencimiento inválido (MM/AA)', 'warning'); return false }
    if (!/^[0-9]{3,4}$/.test(String(card.cvv))) { notify('CVV inválido', 'warning'); return false }
    return true
  }

  async function cotizarEnvio() {
    try {
      setLoading(true)
      const resp = await fetch(apiUrl('/api/shipping/correo-argentino/quote'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postalCode: form.postalCode, province: form.provincia, weightKg: 1 }) })
      const data = await resp.json()
      if (!resp.ok || data.ok === false) { notify(data.error || 'No se pudo cotizar envío', 'error'); return }
      setQuote(data)
    } catch {
      notify('Error al cotizar envío', 'error')
    } finally { setLoading(false) }
  }

  async function pagarMercadoPago() {
    if (!validarDatosBasicos() || !validarEntrega()) return
    try {
      setLoading(true)
      // Guardar resumen de checkout antes de redirigir a MP
      const summary = {
        paymentMethod: 'Mercado Pago',
        channel: 'mercado_pago',
        delivery,
        shipping: delivery === 'domicilio' ? { cost: quote?.cost || 0, eta_days: quote?.eta_days || null } : { cost: 0, eta_days: null },
        recipient: form.nombre,
        address: delivery === 'domicilio' ? form.direccion : 'RETIRO EN LOCAL',
        province: delivery === 'domicilio' ? form.provincia : '',
        postalCode: delivery === 'domicilio' ? form.postalCode : '',
        phone: form.telefono,
      }
      try { localStorage.setItem('checkoutSummary', JSON.stringify(summary)) } catch { void 0 }
      // Guardar snapshot de carrito por si el usuario vuelve del flujo de pago
      try {
        const cartNow = JSON.parse(localStorage.getItem('cart') || '[]')
        localStorage.setItem('lastOrderItems', JSON.stringify(Array.isArray(cartNow) ? cartNow : []))
      } catch { void 0 }
      const payload = {
        userId,
        shipping: delivery === 'domicilio' ? {
          recipient: form.nombre,
          address: form.direccion,
          province: form.provincia,
          postalCode: form.postalCode,
          phone: form.telefono,
          cost: quote?.cost || 0,
          method: 'domicilio',
        } : {
          recipient: form.nombre,
          address: 'RETIRO EN LOCAL',
          province: '',
          postalCode: '',
          phone: form.telefono,
          cost: 0,
          method: 'retiro',
        },
      }
      const resp = await postJson(`/api/payments/mp/preference?user=${encodeURIComponent(userId)}`, payload)
      if (resp.ok && resp.data.ok) {
        const url = resp.data.init_point || resp.data.sandbox_init_point
        if (url) {
          window.location.href = url
        } else {
          notify('Preferencia creada sin URL de pago', 'error')
        }
      } else {
        notify(resp.data?.error || 'No se pudo iniciar pago con Mercado Pago', 'error')
      }
    } catch {
      notify('Error al conectar con Mercado Pago', 'error')
    } finally { setLoading(false) }
  }

  async function confirmarManual() {
    if (!validarDatosBasicos()) return
    try {
      setLoading(true)
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const summary = {
        paymentMethod: 'Pago en local',
        channel: 'local',
        delivery,
        shipping: delivery === 'domicilio' ? { cost: quote?.cost || 0, eta_days: quote?.eta_days || null } : { cost: 0, eta_days: null },
        recipient: form.nombre,
        address: delivery === 'domicilio' ? form.direccion : 'RETIRO EN LOCAL',
        province: delivery === 'domicilio' ? form.provincia : '',
        postalCode: delivery === 'domicilio' ? form.postalCode : '',
        phone: form.telefono,
      }
      
      const resp = await postJson(`/api/orders/confirm?user=${encodeURIComponent(userId)}`, { items: cart, summary })
      
      if (resp.ok && resp.data.ok) {
        localStorage.setItem('checkoutSummary', JSON.stringify(summary))
        localStorage.setItem('lastOrderItems', JSON.stringify(cart)) // Guardar para confirmación
        localStorage.removeItem('cart') // Limpiar carrito tras éxito
        window.dispatchEvent(new CustomEvent('cart-updated'))
        notify('Tu pedido fue registrado. Podrás pagar al retirar en el local.', 'success')
        navigate('/confirmar_compra')
      } else {
        notify(resp.data?.error || 'Error al registrar pedido', 'error')
      }
    } catch {
      notify('Error al confirmar pedido', 'error')
    } finally { setLoading(false) }
  }

  async function pagarTarjetaClasica() {
    // Simula el procesamiento del pago con tarjeta del formulario clásico
    if (!validarDatosBasicos() || !validarEntrega() || !validarTarjeta()) return
    try {
      setLoading(true)
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const summary = {
        paymentMethod: 'Tarjeta',
        channel: 'tarjeta_online',
        delivery,
        shipping: delivery === 'domicilio' ? { cost: quote?.cost || 0, eta_days: quote?.eta_days || null } : { cost: 0, eta_days: null },
        recipient: form.nombre,
        address: delivery === 'domicilio' ? form.direccion : 'RETIRO EN LOCAL',
        province: delivery === 'domicilio' ? form.provincia : '',
        postalCode: delivery === 'domicilio' ? form.postalCode : '',
        phone: form.telefono,
      }

      const resp = await postJson(`/api/orders/confirm?user=${encodeURIComponent(userId)}`, { items: cart, summary })

      if (resp.ok && resp.data.ok) {
        localStorage.setItem('checkoutSummary', JSON.stringify(summary))
        localStorage.setItem('lastOrderItems', JSON.stringify(cart)) // Guardar para confirmación
        localStorage.removeItem('cart') // Limpiar carrito tras éxito
        window.dispatchEvent(new CustomEvent('cart-updated'))
        notify('Pago procesado con tarjeta. ¡Gracias por tu compra!', 'success')
        navigate('/confirmar_compra')
      } else {
        notify(resp.data?.error || 'Error al procesar pago', 'error')
      }
    } catch {
      notify('Error al conectar con el servidor', 'error')
    } finally { setLoading(false) }
  }

  return (
    <section className="py-12 px-6 max-w-5xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
        <div className="space-y-2">
          <p className="text-blue-600 font-black uppercase tracking-widest text-xs">Finalizar Compra</p>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">
            Pago y <span className="text-[#1E3A8A]">Envío</span>
          </h1>
        </div>
        <Link 
          to="/carrito" 
          className="group flex items-center gap-3 text-[#1E3A8A] font-black uppercase tracking-widest text-xs border-b-2 border-transparent hover:border-blue-600 pb-1 transition-all"
        >
          <svg className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          Volver al Carrito
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Método de Pago Card */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
              <div className="w-10 h-10 bg-blue-50 text-[#1E3A8A] rounded-xl flex items-center justify-center font-black">1</div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Método de Pago</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'tarjeta', label: 'Tarjeta', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                { id: 'mp', label: 'Mercado Pago', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                { id: 'manual', label: 'Pago en Local', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setMethod(opt.id)}
                  className={`flex flex-col items-center justify-center p-6 rounded-[1.5rem] border-2 transition-all gap-3 group ${
                    method === opt.id 
                      ? 'border-[#1E3A8A] bg-blue-50/50' 
                      : 'border-gray-50 bg-white hover:border-blue-100 hover:bg-gray-50/50'
                  }`}
                >
                  <svg className={`w-6 h-6 ${method === opt.id ? 'text-[#1E3A8A]' : 'text-gray-400 group-hover:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={opt.icon}/></svg>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${method === opt.id ? 'text-[#1E3A8A]' : 'text-gray-500'}`}>{opt.label}</span>
                </button>
              ))}
            </div>

            {method === 'tarjeta' && (
              <div className="mt-8 space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="cardTitular">Titular de la Tarjeta</label>
                  <input 
                    id="cardTitular" 
                    value={card.titular} 
                    onChange={e=>setCard(v=>({ ...v, titular: e.target.value }))} 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all" 
                    placeholder="COMO FIGURA EN LA TARJETA" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="cardNumero">Número de Tarjeta</label>
                  <input 
                    id="cardNumero" 
                    value={card.numero} 
                    onChange={e=>setCard(v=>({ ...v, numero: e.target.value }))} 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all" 
                    placeholder="•••• •••• •••• ••••" 
                    inputMode="numeric" 
                    maxLength={19} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="cardVencimiento">Vencimiento</label>
                    <input 
                      id="cardVencimiento" 
                      value={card.vencimiento} 
                      onChange={e=>setCard(v=>({ ...v, vencimiento: e.target.value }))} 
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all" 
                      placeholder="MM/AA" 
                      maxLength={5} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="cardCvv">CVV</label>
                    <input 
                      id="cardCvv" 
                      value={card.cvv} 
                      onChange={e=>setCard(v=>({ ...v, cvv: e.target.value }))} 
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all" 
                      placeholder="•••" 
                      inputMode="numeric" 
                      maxLength={4} 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Entrega y Datos Card */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-8">
            <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black">2</div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Entrega y Datos</h2>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => { setDelivery('retiro'); setQuote(null); }}
                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 transition-all ${
                  delivery === 'retiro' ? 'border-[#1E3A8A] bg-blue-50/50 text-[#1E3A8A]' : 'border-gray-50 text-gray-400 hover:border-gray-100'
                }`}
              >
                Retiro por Local
              </button>
              <button
                onClick={() => { setDelivery('domicilio'); setQuote(null); }}
                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 transition-all ${
                  delivery === 'domicilio' ? 'border-[#1E3A8A] bg-blue-50/50 text-[#1E3A8A]' : 'border-gray-50 text-gray-400 hover:border-gray-100'
                }`}
              >
                Envío a Domicilio
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="nombre">Nombre Completo</label>
                <input id="nombre" value={form.nombre} onChange={e=>setForm(v=>({ ...v, nombre: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="email">Email de Contacto</label>
                <div className="flex gap-2">
                  <input id="email" type="email" value={form.email} onChange={e=>setForm(v=>({ ...v, email: e.target.value }))} className="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50" disabled={isVerified} />
                  {!isVerified ? (
                    <button onClick={sendCode} disabled={loading} className="px-6 bg-[#1E3A8A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 transition-all disabled:opacity-50 shadow-lg">
                      {showVerification ? 'Reenviar' : 'Verificar'}
                    </button>
                  ) : (
                    <div className="px-6 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  )}
                </div>
                {showVerification && !isVerified && (
                  <div className="mt-3 flex gap-2 animate-fade-in">
                    <input value={verificationCode} onChange={e=>setVerificationCode(e.target.value)} placeholder="CÓDIGO (123456)" className="flex-1 bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 text-sm font-black text-blue-900 placeholder:text-blue-300" />
                    <button onClick={verifyCode} disabled={loading} className="px-8 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg">Validar</button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="telefono">Teléfono / WhatsApp</label>
                <input id="telefono" value={form.telefono} onChange={e=>setForm(v=>({ ...v, telefono: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="+54 9 11 ..." />
              </div>

              {delivery === 'domicilio' && (
                <>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="direccion">Dirección de Entrega</label>
                    <input id="direccion" value={form.direccion} onChange={e=>setForm(v=>({ ...v, direccion: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="CALLE, NÚMERO, DEPTO" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="provincia">Provincia</label>
                    <input id="provincia" value={form.provincia} onChange={e=>setForm(v=>({ ...v, provincia: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="postalCode">Código Postal</label>
                    <div className="flex gap-2">
                      <input id="postalCode" value={form.postalCode} onChange={e=>setForm(v=>({ ...v, postalCode: e.target.value }))} className="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all" />
                      <button onClick={cotizarEnvio} disabled={loading} className="px-6 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 shadow-lg">
                        Cotizar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {delivery === 'domicilio' ? (
              quote && (
                <div className="bg-emerald-50 rounded-2xl p-4 flex items-center justify-between animate-fade-in border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Correo Argentino</p>
                      <p className="text-xs text-emerald-600 font-bold">Llega en aproximadamente {quote.eta_days} días</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-emerald-800">ARS {quote.cost}</p>
                </div>
              )
            ) : (
              <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3 border border-blue-100">
                <div className="w-8 h-8 bg-blue-100 text-[#1E3A8A] rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <p className="text-[10px] font-black text-[#1E3A8A] uppercase tracking-widest">Retiro sin costo en nuestro local central</p>
              </div>
            )}
          </div>
        </div>

        {/* Resumen Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 sticky top-32 md:top-40 space-y-8">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              Tu <span className="text-[#1E3A8A]">Resumen</span>
            </h2>

            <div className="space-y-4 border-b border-gray-50 pb-6">
              <div className="flex justify-between">
                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Método</span>
                <span className="text-gray-900 text-xs font-bold uppercase">{method === 'mp' ? 'Mercado Pago' : method === 'tarjeta' ? 'Tarjeta' : 'Local'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Entrega</span>
                <span className="text-gray-900 text-xs font-bold uppercase">{delivery === 'domicilio' ? 'Envío' : 'Retiro'}</span>
              </div>
              {delivery === 'domicilio' && (
                <div className="flex justify-between">
                  <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Costo Envío</span>
                  <span className="text-gray-900 text-xs font-bold uppercase">ARS {(quote?.cost || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {method === 'mp' && (
                <button 
                  onClick={pagarMercadoPago} 
                  disabled={loading} 
                  className="w-full bg-[#009EE3] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : 'Pagar con Mercado Pago'}
                </button>
              )}
              {method === 'tarjeta' && (
                <button 
                  onClick={pagarTarjetaClasica} 
                  disabled={loading} 
                  className="w-full bg-[#1E3A8A] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-800 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : 'Confirmar y Pagar'}
                </button>
              )}
              {method === 'manual' && (
                <button 
                  onClick={confirmarManual} 
                  disabled={loading} 
                  className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : 'Finalizar Pedido'}
                </button>
              )}
              <p className="text-[10px] text-gray-400 text-center font-medium px-4 uppercase tracking-tighter leading-relaxed">
                Tus datos están protegidos bajo protocolos de seguridad SSL de 256 bits.
              </p>
            </div>

            {/* Support Info */}
            <div className="pt-8 border-t border-gray-50 flex items-center gap-4 group">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">¿Necesitás ayuda?</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Contactanos por WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

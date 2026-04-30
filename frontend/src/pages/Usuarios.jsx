import { useMemo, useState } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { useLocation, useNavigate } from 'react-router-dom'
import { notify } from '../components/notify'

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const apiUrl = (url) => (API_BASE ? `${API_BASE}${url}` : url)

export default function Usuarios() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  
  // Estados para verificación
  const [showVerification, setShowVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationWhatsAppLink, setVerificationWhatsAppLink] = useState('')
  const [verificationVerifyLink, setVerificationVerifyLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastPassword, setLastPassword] = useState('') // Guardar contraseña temporalmente para auto-login

  const referrerFromUrl = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search || '')
      return String(params.get('ref') || '').trim().toLowerCase()
    } catch {
      return ''
    }
  }, [location.search])

  const LoginSchema = Yup.object({
    email: Yup.string()
      .trim()
      .email('Email inválido')
      .test('tld', 'Email debe tener dominio válido', (v) => {
        if (!v) return false
        const parts = String(v).split('@')[1]?.split('.') || []
        return parts.length >= 2 && parts[parts.length - 1].length >= 2
      })
      .required('Email requerido'),
    password: Yup.string().min(6, 'Mínimo 6 caracteres').required('Contraseña requerida'),
  })

  const RegisterSchema = Yup.object({
    name: Yup.string().min(2, 'Mínimo 2 caracteres').required('Nombre requerido'),
    email: Yup.string()
      .trim()
      .email('Email inválido')
      .test('tld', 'Email debe tener dominio válido', (v) => {
        if (!v) return false
        const parts = String(v).split('@')[1]?.split('.') || []
        return parts.length >= 2 && parts[parts.length - 1].length >= 2
      })
      .required('Email requerido'),
    confirmEmail: Yup.string()
      .trim()
      .required('Confirme su email')
      .test('emails-match', 'Los emails no coinciden', function (v) {
        const email = this.parent.email
        const norm = (s) => String(s || '').trim().toLowerCase()
        return norm(v) === norm(email)
      }),
    password: Yup.string().min(6, 'Mínimo 6 caracteres').required('Contraseña requerida'),
  })

  const onLoginSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      const emailNormalized = (values.email || '').trim().toLowerCase()
      const payload = { email: emailNormalized, password: values.password }

      // Helper: intenta vía proxy y, si falla por red, intenta directo al backend
      const postJson = async (url, body) => {
        const r = await fetch(apiUrl(url), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const d = await r.json().catch(() => ({}))
        return { ok: r.ok, status: r.status, data: d }
      }

      // Intento primero login de admin: si las credenciales son de admin, obtendrás token y se redirige al panel
      const adminResp = await postJson('/api/auth/admin/login', payload)
      const adminData = adminResp.data
      if (adminResp.ok && adminData && adminData.ok && adminData.token) {
        localStorage.removeItem('userId') // Limpiar posible ID de usuario anterior
        localStorage.setItem('adminToken', adminData.token)
        localStorage.setItem('adminRole', adminData.role || '')
        localStorage.setItem('adminName', adminData.name || '')
        localStorage.setItem('adminEmail', adminData.email || emailNormalized)
        notify('Ingreso admin exitoso', 'success')
        navigate('/admin', { replace: true })
        setTimeout(() => {
          if (window && window.location && window.location.pathname !== '/admin') {
            window.location.assign('/admin')
          }
        }, 50)
        return
      }

      if (adminResp.status === 403 && adminData && (adminData.error || '').toLowerCase().includes('verific')) {
        setVerificationEmail(emailNormalized)
        setLastPassword(values.password)
        setShowVerification(true)
        notify('Tu cuenta de panel no está verificada. Ingresá el código enviado a tu email.', 'warning')
        try {
          const vResp = await postJson('/api/auth/send-verification', { email: emailNormalized })
          if (import.meta.env.DEV && vResp.ok && vResp.data?.devCode) setVerificationCode(String(vResp.data.devCode))
          if (vResp.ok && vResp.data?.whatsappLink) setVerificationWhatsAppLink(String(vResp.data.whatsappLink))
          if (vResp.ok && vResp.data?.verifyLink) setVerificationVerifyLink(String(vResp.data.verifyLink))
        } catch {
          void 0
        }
        return
      }

      // Si no es admin o falló, realizo login de usuario normal
      const resp = await postJson('/api/auth/login', payload)
      const data = resp.data
      
      if (!resp.ok || !data.ok) {
        if (data.requires_verification) {
          setVerificationEmail(emailNormalized)
          setLastPassword(values.password) // Guardar para intentar login después de verificar
          setShowVerification(true)
          notify('Tu cuenta no está verificada. Ingresá el código enviado a tu email.', 'warning')
          try {
            const vResp = await postJson('/api/auth/send-verification', { email: emailNormalized })
            if (import.meta.env.DEV && vResp.ok && vResp.data?.devCode) setVerificationCode(String(vResp.data.devCode))
            if (vResp.ok && vResp.data?.whatsappLink) setVerificationWhatsAppLink(String(vResp.data.whatsappLink))
            if (vResp.ok && vResp.data?.verifyLink) setVerificationVerifyLink(String(vResp.data.verifyLink))
          } catch {
            void 0
          }
          return
        }
        notify(data.error || 'Error al iniciar sesión', 'error')
        return
      }
      
      const userId = data.userId || emailNormalized
      localStorage.removeItem('adminToken') // Limpiar posible token de admin anterior
      localStorage.setItem('userId', userId)
      notify('Inicio de sesión exitoso', 'success')

      // Redirigir al panel de usuario
      try {
        navigate('/mi-espacio', { replace: true })
        // Fallback en casos donde la navegación del router no actualiza de inmediato
        setTimeout(() => {
          if (window && window.location && window.location.pathname !== '/mi-espacio') {
            window.location.assign('/mi-espacio')
          }
        }, 50)
      } catch {
        void 0
      }

      // Si el email parece ser el de admin por defecto, reintenta obtener token admin y redirige
      if (emailNormalized === 'admin@jj.com') {
        try {
          const retry = await postJson('/api/auth/admin/login', payload)
          if (retry.ok) {
            const retryData = retry.data
            if (retryData && retryData.ok && retryData.token) {
              localStorage.setItem('adminToken', retryData.token)
              navigate('/admin', { replace: true })
              setTimeout(() => {
                if (window && window.location && window.location.pathname !== '/admin') {
                  window.location.assign('/admin')
                }
              }, 50)
              return
            }
          }
        } catch {
          void 0
        }
      }
      resetForm()
    } catch {
      notify('Error de red al conectar con el backend', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onRegisterSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      const emailNormalized = (values.email || '').trim().toLowerCase()
      const { confirmEmail: _confirmEmail, ...rest } = values
      const payload = { ...rest, email: emailNormalized, ...(referrerFromUrl ? { referrer: referrerFromUrl } : {}) }
      const postJson = async (url, body) => {
        const r = await fetch(apiUrl(url), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const d = await r.json().catch(() => ({}))
        return { ok: r.ok, data: d }
      }
      const resp = await postJson('/api/auth/register', payload)
      const data = resp.data
      if (!resp.ok || !data.ok) {
        notify(data.error || 'Error al registrarse', 'error')
        return
      }
      
      setVerificationEmail(emailNormalized)
      setVerificationCode(import.meta.env.DEV && data.devCode ? String(data.devCode) : '')
      setVerificationWhatsAppLink(data.whatsappLink ? String(data.whatsappLink) : '')
      setVerificationVerifyLink(data.verifyLink ? String(data.verifyLink) : '')
      setLastPassword(values.password)
      setShowVerification(true)
      notify('Registro exitoso. Ingresá el código enviado a tu email.', 'success')
      
      resetForm()
    } catch {
      notify('Error de red al conectar con el backend', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const verifyAccount = async () => {
    try {
      setLoading(true)
      const emailNorm = (verificationEmail || '').trim().toLowerCase()
      const codeTrim = (verificationCode || '').trim()
      if (!emailNorm || !codeTrim) {
        notify('Completá el código de verificación', 'warning')
        return
      }

      const resp = await fetch(apiUrl('/api/auth/verify-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailNorm, code: codeTrim })
      })

      const data = await resp.json()
      if (!resp.ok || !data.ok) {
        notify(data.error || 'Código inválido', 'error')
        return
      }

      notify('Email verificado con éxito. Iniciando sesión...', 'success')
      setShowVerification(false)
      setVerificationCode('')
      setVerificationWhatsAppLink('')
      setVerificationVerifyLink('')

      if (lastPassword) {
        const payload = { email: emailNorm, password: lastPassword }
        const adminLoginResp = await fetch(apiUrl('/api/auth/admin/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => null)

        if (adminLoginResp) {
          const adminLoginData = await adminLoginResp.json().catch(() => ({}))
          if (adminLoginResp.ok && adminLoginData && adminLoginData.ok && adminLoginData.token) {
            localStorage.removeItem('userId')
            localStorage.setItem('adminToken', adminLoginData.token)
            localStorage.setItem('adminRole', adminLoginData.role || '')
            localStorage.setItem('adminName', adminLoginData.name || '')
            localStorage.setItem('adminEmail', adminLoginData.email || emailNorm)
            notify('Bienvenido', 'success')
            navigate('/admin', { replace: true })
            setTimeout(() => {
              if (window && window.location && window.location.pathname !== '/admin') {
                window.location.assign('/admin')
              }
            }, 50)
            return
          }
        }

        const loginResp = await fetch(apiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => null)

        if (loginResp && loginResp.ok) {
          const loginData = await loginResp.json().catch(() => ({}))
          if (loginData.ok) {
            localStorage.removeItem('adminToken')
            localStorage.setItem('userId', loginData.userId || emailNorm)
            notify('Bienvenido', 'success')
            navigate('/mi-espacio', { replace: true })
            return
          }
        }
      }

      localStorage.removeItem('adminToken')
      localStorage.setItem('userId', emailNorm)
      notify('Bienvenido', 'success')
      navigate('/mi-espacio', { replace: true })
    } catch {
      notify('Error al conectar con el servidor para verificar', 'error')
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async () => {
    try {
      setLoading(true)
      const emailNorm = (verificationEmail || '').trim().toLowerCase()
      
      const resp = await fetch(apiUrl('/api/auth/send-verification'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailNorm })
      })

      const data = await resp.json().catch(() => ({}))
      if (resp.ok) {
        if (import.meta.env.DEV && data?.devCode) setVerificationCode(String(data.devCode))
        if (data?.whatsappLink) setVerificationWhatsAppLink(String(data.whatsappLink))
        if (data?.verifyLink) setVerificationVerifyLink(String(data.verifyLink))
        notify('Código reenviado. Revisa tu bandeja de entrada.', 'info')
      } else {
        notify('Error al reenviar código', 'error')
      }
    } catch {
      notify('Error de red al reenviar código', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-12 px-6 max-w-6xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
        <div className="space-y-2">
          <p className="text-blue-600 font-black uppercase tracking-widest text-xs">Acceso a Clientes</p>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">
            Tu Cuenta <span className="text-[#1E3A8A]">JJ</span>
          </h1>
        </div>
      </div>

      {showVerification && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl max-w-md w-full text-center space-y-8 border border-gray-100">
            <div className="w-20 h-20 bg-blue-50 text-[#1E3A8A] rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Verificá tu Cuenta</h2>
              <p className="text-sm text-gray-500 font-medium">
                Enviamos un código a <br /><span className="text-[#1E3A8A] font-bold">{verificationEmail}</span>.
              </p>
            </div>

            <div className="space-y-6">
              <input
                type="text"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                placeholder="000000"
                className="w-full bg-gray-50 border-none rounded-2xl p-5 text-center text-4xl tracking-[0.5em] font-black text-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-200"
                maxLength={6}
              />
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={verifyAccount}
                  disabled={loading || String(verificationCode || '').trim().length < 6}
                  className="w-full bg-[#1E3A8A] text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl hover:bg-blue-800 disabled:opacity-50 transition-all shadow-xl active:scale-95"
                >
                  {loading ? 'Verificando...' : 'Verificar'}
                </button>

                {verificationWhatsAppLink && (
                  <button
                    onClick={() => window.open(verificationWhatsAppLink, '_blank', 'noopener,noreferrer')}
                    disabled={loading}
                    className="w-full bg-green-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl hover:bg-green-700 disabled:opacity-50 transition-all shadow-xl active:scale-95"
                  >
                    Verificar por WhatsApp
                  </button>
                )}
                
                <div className="flex gap-4">
                  <button
                    onClick={resendCode}
                    disabled={loading}
                    className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-[#1E3A8A] hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Reenviar código
                  </button>
                  <button
                    onClick={() => {
                      setShowVerification(false)
                      setVerificationWhatsAppLink('')
                      setVerificationVerifyLink('')
                    }}
                    className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Registrarse */}
        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col h-full group hover:shadow-xl transition-all duration-500">
          <div className="space-y-2 mb-10 text-center lg:text-left">
            <p className="text-blue-600 font-black uppercase tracking-widest text-[10px]">¿Sos nuevo?</p>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Crea tu <span className="text-[#1E3A8A]">Perfil</span></h2>
          </div>

          <Formik initialValues={{ name: '', email: '', confirmEmail: '', password: '' }} validationSchema={RegisterSchema} onSubmit={onRegisterSubmit} validateOnBlur validateOnChange>
            {({ isSubmitting, isValid, dirty }) => (
              <Form className="space-y-6 flex-grow">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="name">Nombre Completo</label>
                  <Field id="name" name="name" type="text" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="JUAN PÉREZ" />
                  <ErrorMessage name="name" component="div" className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-1" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="email">Email</label>
                  <Field id="email" name="email" type="email" autoComplete="email" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="EMAIL@EJEMPLO.COM" />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-1" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="confirmEmail">Confirmar Email</label>
                  <Field id="confirmEmail" name="confirmEmail" type="email" autoComplete="email" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="REPETIR EMAIL" />
                  <ErrorMessage name="confirmEmail" component="div" className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-1" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="password">Contraseña</label>
                  <div className="relative">
                    <Field id="password" name="password" type={showRegisterPassword ? "text" : "password"} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="••••••••" />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#1E3A8A] transition-colors"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    >
                      {showRegisterPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      )}
                    </button>
                  </div>
                  <ErrorMessage name="password" component="div" className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-1" />
                </div>

                <div className="pt-4 space-y-4">
                  <button type="submit" disabled={isSubmitting || !isValid || !dirty} className="w-full bg-[#1E3A8A] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-800 disabled:opacity-50 transition-all shadow-xl active:scale-95">
                    {isSubmitting ? 'Registrando...' : 'Crear mi Cuenta'}
                  </button>
                  <p className="text-[10px] text-gray-400 text-center font-medium uppercase tracking-tighter">
                    Al registrarte, aceptás nuestros términos de servicio.
                  </p>
                </div>
              </Form>
            )}
          </Formik>
        </div>

        {/* Iniciar Sesión */}
        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col h-full relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
          
          <div className="space-y-2 mb-10 text-center lg:text-left relative z-10">
            <p className="text-blue-600 font-black uppercase tracking-widest text-[10px]">¿Ya tenés cuenta?</p>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Iniciar <span className="text-[#1E3A8A]">Sesión</span></h2>
          </div>

          <Formik initialValues={{ email: '', password: '' }} validationSchema={LoginSchema} onSubmit={onLoginSubmit} validateOnBlur validateOnChange>
            {({ isSubmitting, isValid, dirty }) => (
              <Form className="space-y-6 flex-grow relative z-10">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="login-email">Email</label>
                  <Field id="login-email" name="email" type="email" autoComplete="email" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="EMAIL@EJEMPLO.COM" />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-1" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest" htmlFor="login-password">Contraseña</label>
                    <button type="button" className="text-[10px] font-black text-[#1E3A8A] uppercase tracking-widest hover:underline">Olvidé mi clave</button>
                  </div>
                  <div className="relative">
                    <Field id="login-password" name="password" type={showLoginPassword ? "text" : "password"} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="••••••••" />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#1E3A8A] transition-colors"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      )}
                    </button>
                  </div>
                  <ErrorMessage name="password" component="div" className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-1" />
                </div>

                <div className="pt-4 space-y-4">
                  <button type="submit" disabled={isSubmitting || !isValid || !dirty} className="w-full bg-[#1E3A8A] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-800 disabled:opacity-50 transition-all shadow-xl active:scale-95">
                    {isSubmitting ? 'Ingresando...' : 'Entrar a mi Cuenta'}
                  </button>
                  <div className="flex items-center justify-center gap-4 py-2">
                    <div className="flex-grow h-[1px] bg-gray-100"></div>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">O ingresar con</span>
                    <div className="flex-grow h-[1px] bg-gray-100"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" className="flex items-center justify-center gap-3 py-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors text-[10px] font-black uppercase tracking-widest text-gray-600">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.224 1.224-3.136 2.552-6.528 2.552-5.32 0-9.424-4.304-9.424-9.624s4.104-9.624 9.424-9.624c2.88 0 5.056 1.136 6.616 2.6l2.312-2.312C18.424 2.128 15.688 0 12 0 5.4 0 0 5.4 0 12s5.4 12 12 12c3.584 0 6.608-1.184 8.824-3.416 2.24-2.24 3.152-5.416 3.152-8.08 0-.68-.064-1.336-.184-1.952h-11.312z"/></svg>
                      Google
                    </button>
                    <button type="button" className="flex items-center justify-center gap-3 py-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors text-[10px] font-black uppercase tracking-widest text-gray-600">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      Facebook
                    </button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </section>
  )
}

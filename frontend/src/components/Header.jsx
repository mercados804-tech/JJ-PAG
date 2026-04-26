import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const apiUrl = (url) => (API_BASE ? `${API_BASE}${url}` : url)

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [brand, setBrand] = useState({ companyName: 'JJ Indumentaria', companyLogo: '/img/JJ-logo.png' })
  const location = useLocation()
  const userId = localStorage.getItem('userId') || 'guest'
  const adminToken = localStorage.getItem('adminToken') || ''

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    fetch(apiUrl('/api/site/brand'))
      .then(r => r.json())
      .then(data => setBrand({
        companyName: data?.companyName || 'JJ Indumentaria',
        companyLogo: data?.companyLogo || data?.homeLogo || '/img/JJ-logo.png',
      }))
      .catch(() => void 0)
  }, [])

  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const uid = (localStorage.getItem('userId') || 'guest').toLowerCase()
        if (uid !== 'guest') {
          try {
            const resp = await fetch(apiUrl(`/api/cart?user=${encodeURIComponent(uid)}`))
            const data = await resp.json()
            if (Array.isArray(data)) {
              localStorage.setItem('cart', JSON.stringify(data))
              setCartCount(data.reduce((acc, item) => acc + (item.quantity || 1), 0))
              return
            }
          } catch {
            void 0
          }
        }
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        setCartCount(cart.reduce((acc, item) => acc + (item.quantity || 1), 0))
      } catch {
        setCartCount(0)
      }
    }
    updateCartCount()
    window.addEventListener('storage', updateCartCount)
    window.addEventListener('cart-updated', updateCartCount)
    return () => {
      window.removeEventListener('storage', updateCartCount)
      window.removeEventListener('cart-updated', updateCartCount)
    }
  }, [])

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Productos', path: '/productos' },
    { name: 'Promociones', path: '/promociones' },
    { name: 'Comunidad', path: '/comentarios' },
    { name: 'Contacto', path: '/contacto' },
    { name: 'Ubicación', path: '/ubicacion' },
  ]

  return (
    <header className={`transition-all duration-500 ${isScrolled ? 'py-2' : 'py-4'}`}>
      <div className="max-w-7xl mx-auto px-6">
        <nav className={`relative rounded-[2rem] border transition-all duration-500 flex items-center justify-between px-8 py-4 ${
          isScrolled 
            ? 'bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl' 
            : 'bg-white border-gray-100 shadow-sm'
        }`}>
          {/* Logo */}
          <Link to="/" className="relative z-50 flex items-center gap-2 group">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500 overflow-hidden border border-gray-100">
              {brand.companyLogo ? (
                <img src={brand.companyLogo} alt={brand.companyName || 'JJ'} className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-white font-black text-xl italic">JJ</span>
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-gray-900 font-black uppercase tracking-tighter text-lg leading-none">Indumentaria</p>
              <p className="text-[#1E3A8A] font-black uppercase tracking-[0.3em] text-[8px] leading-none mt-1">Masculina</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`text-[10px] font-black uppercase tracking-widest transition-all hover:text-[#1E3A8A] relative py-2 ${
                  location.pathname === link.path ? 'text-[#1E3A8A]' : 'text-gray-500'
                }`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-[#1E3A8A] rounded-full animate-fade-in" />
                )}
              </Link>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4 relative z-50">
            <Link 
              to={adminToken ? '/admin' : (userId !== 'guest' ? '/mi-espacio' : '/usuarios')} 
              className="p-3 rounded-2xl bg-gray-50 text-gray-500 hover:bg-[#1E3A8A] hover:text-white transition-all duration-300"
              title={adminToken ? 'Panel' : (userId !== 'guest' ? 'Mi Espacio' : 'Ingresar')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </Link>
            
            <Link 
              to="/carrito" 
              className="p-3 rounded-2xl bg-[#1E3A8A] text-white hover:bg-blue-800 transition-all duration-300 relative shadow-xl shadow-blue-900/10"
              title="Carrito"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce-slow">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Toggle */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-3 rounded-2xl bg-gray-50 text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen 
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-6 lg:hidden animate-slide-down overflow-hidden">
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link 
                    key={link.path} 
                    to={link.path} 
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-xs font-black uppercase tracking-widest p-4 rounded-2xl transition-all ${
                      location.pathname === link.path ? 'bg-blue-50 text-[#1E3A8A]' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

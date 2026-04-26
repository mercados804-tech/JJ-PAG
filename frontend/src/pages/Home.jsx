import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const apiUrl = (url) => (API_BASE ? `${API_BASE}${url}` : url)

export default function Home() {
  const fallbackImages = ['/img/top-view-accessoires-travel-with-man-clothing-concept-shirt.jpg', '/img/top-view-accessoires-travel-with-man-clothing-concept-shirt.jpg', '/img/top-view-accessoires-travel-with-man-clothing-concept-shirt.jpg']
  const fallbackCaptions = ['Nueva Temporada 2024', 'Esencia Masculina', 'Estilo sin Límites']
  const legacyImages = ['/img/ima1.webp', '/img/ima2.webp', '/img/ima3.webp']
  const [cfg, setCfg] = useState(null)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    let mounted = true
    fetch(apiUrl('/api/site/home'))
      .then(r => r.json())
      .then(data => { if (mounted) setCfg(data) })
      .catch(() => void 0)
    return () => { mounted = false }
  }, [])

  const hasLegacyImages = Array.isArray(cfg?.images) && cfg.images.length === legacyImages.length && cfg.images.every((img, i) => img === legacyImages[i])
  const images = Array.isArray(cfg?.images) && cfg.images.length && !hasLegacyImages ? cfg.images : fallbackImages
  const captions = Array.isArray(cfg?.captions) && cfg.captions.length ? cfg.captions : fallbackCaptions
  const intervalMs = 5000 // Un poco más lento para apreciar las imágenes

  // Productos destacados (simulados para el Inicio)
  const featuredProducts = [
    { id: 101, name: 'Remera JJ Premium', price: 'ARS 35.990,00', image: '/img/promo9.webp', tag: 'Nuevo' },
    { id: 102, name: 'Chomba JJ Classic', price: 'ARS 25.000,00', image: '/img/chomba.webp', tag: 'Popular' },
    { id: 103, name: 'Pantalón Sport JJ', price: 'ARS 31.700,00', image: '/img/promo7.webp', tag: 'Tendencia' },
    { id: 115, name: 'Chomba Azul JJ', price: 'ARS 25.000,00', image: '/img/ima3.webp', tag: 'Oferta' },
  ]

  useEffect(() => {
    const id = setInterval(() => setCurrent((c) => (c + 1) % images.length), intervalMs)
    return () => clearInterval(id)
  }, [images.length])

  return (
    <div className="bg-white min-h-screen">
      {/* HERO SECTION */}
      <section className="relative h-[90vh] lg:h-screen overflow-hidden bg-gray-900">
        {/* Carousel Background */}
        {images.map((src, i) => (
          <div 
            key={i} 
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === current ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-black/40 z-10"></div>
            <img 
              src={src} 
              alt={captions[i]} 
              className={`w-full h-full object-cover transition-transform duration-[10s] ease-linear ${i === current ? 'scale-110' : 'scale-100'}`} 
            />
          </div>
        ))}

        {/* Hero Content */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6">
          <div className="max-w-4xl space-y-6">
            <p className="text-blue-400 font-black uppercase tracking-[0.3em] text-sm animate-fade-in">JJ Indumentaria</p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight animate-slide-up">
              DEFINÍ TU <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">PROPIO ESTILO</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 font-medium max-w-2xl mx-auto leading-relaxed opacity-90">
              Prendas diseñadas para el hombre moderno que busca calidad, confort y una distinción única en cada detalle.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link 
                to="/productos" 
                className="bg-white text-[#1E3A8A] px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all shadow-2xl hover:scale-105 active:scale-95"
              >
                Ver Colección
              </Link>
              <Link 
                to="/promociones" 
                className="bg-transparent border-2 border-white/30 backdrop-blur-md text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
              >
                Ofertas Especiales
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-3">
          {images.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrent(i)}
              className={`h-1.5 transition-all duration-500 rounded-full ${i === current ? 'w-12 bg-blue-400' : 'w-3 bg-white/30 hover:bg-white/50'}`}
            />
          ))}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-b border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="group">
            <div className="w-20 h-20 bg-blue-50 text-[#1E3A8A] rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Envíos a todo el país</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-medium">Recibí tus prendas JJ donde sea que estés con la mayor seguridad y rapidez.</p>
          </div>

          <div className="group">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-sm">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Calidad Garantizada</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-medium">Telas seleccionadas y confección premium para asegurar durabilidad y un calce perfecto.</p>
          </div>

          <div className="group">
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-sm">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Pagos Seguros</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-medium">Aceptamos todas las tarjetas y Mercado Pago para que compres con total tranquilidad.</p>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS SECTION */}
      <section className="py-24 px-6 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-2">
              <p className="text-blue-600 font-black uppercase tracking-widest text-xs">Nuestra Selección</p>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">Productos <span className="text-[#1E3A8A]">Destacados</span></h2>
            </div>
            <Link 
              to="/productos" 
              className="group flex items-center gap-3 text-[#1E3A8A] font-black uppercase tracking-widest text-xs border-b-2 border-transparent hover:border-blue-600 pb-1 transition-all"
            >
              Explorar Todo el Catálogo
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-[2.5rem] p-3 shadow-sm hover:shadow-2xl transition-all duration-500 group border border-gray-100/50">
                <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-gray-100">
                  {p.tag && (
                    <span className="absolute top-4 left-4 z-10 bg-[#1E3A8A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                      {p.tag}
                    </span>
                  )}
                  <img 
                    src={p.image} 
                    alt={p.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
                  
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
                    <Link 
                      to="/productos" 
                      className="bg-white text-[#1E3A8A] p-4 rounded-full shadow-xl hover:scale-110 transition-transform active:scale-95"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                    </Link>
                  </div>
                </div>

                <div className="p-5 text-center space-y-2">
                  <h3 className="text-gray-900 font-bold text-lg group-hover:text-[#1E3A8A] transition-colors">{p.name}</h3>
                  <p className="text-blue-600 font-black text-xl">{p.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRAND STORY MINI */}
      <section className="bg-white py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 relative group">
              <div className="absolute -top-6 -left-6 w-full h-full border-2 border-blue-50 rounded-[3rem] -z-10 group-hover:-top-4 group-hover:-left-4 transition-all duration-500"></div>
              <div className="relative rounded-[3rem] overflow-hidden shadow-2xl">
                <img 
                  src="/Luxury%20Wordmark%20Logo%20with%20Silhouette%20Design.png" 
                  alt="Logo JJ" 
                  className="w-full h-auto bg-white p-16 transform group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
            <div className="lg:w-1/2 space-y-8">
              <div className="space-y-4">
                <p className="text-blue-600 font-black uppercase tracking-widest text-xs">Nuestra Esencia</p>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight leading-tight">Tradición y <br /><span className="text-[#1E3A8A]">Vanguardia</span></h2>
              </div>
              <p className="text-xl text-gray-600 leading-relaxed font-medium">
                En JJ Indumentaria, no solo vendemos ropa. Creamos una identidad para el hombre que sabe lo que quiere.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div>
                  <h4 className="text-[#1E3A8A] font-black text-3xl mb-1">100%</h4>
                  <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Calidad Premium</p>
                </div>
                <div>
                  <h4 className="text-[#1E3A8A] font-black text-3xl mb-1">+500</h4>
                  <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Clientes Felices</p>
                </div>
              </div>
              <div className="pt-6">
                <Link to="/acerca" className="inline-flex items-center gap-4 bg-gray-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#1E3A8A] transition-all hover:scale-105 active:scale-95 shadow-xl">
                  Conocé nuestra historia
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto relative rounded-[4rem] overflow-hidden bg-[#1E3A8A] py-20 px-8 text-center text-white shadow-2xl">
          <div className="absolute inset-0 opacity-20">
            <img 
              src="/img/ima2.webp" 
              alt="Background" 
              className="w-full h-full object-cover grayscale"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] via-[#1E3A8A]/95 to-indigo-900/90"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
              ¿LISTO PARA <br />RENOVAR TU VESTIDOR?
            </h2>
            <p className="text-lg md:text-xl text-blue-100 font-medium">
              Aprovechá nuestras cuotas sin interés y envíos gratis en compras superiores a $50.000.
            </p>
            <div className="pt-4">
              <Link 
                to="/productos" 
                className="bg-white text-[#1E3A8A] px-16 py-6 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-50 transition-all shadow-2xl hover:scale-110 active:scale-95 inline-block"
              >
                Empezar a comprar
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

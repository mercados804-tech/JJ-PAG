import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import FloatingSocial from './components/FloatingSocial'
import Home from './pages/Home'
import Productos from './pages/Productos'
import Contacto from './pages/Contacto'
import Ubicacion from './pages/Ubicacion'
import Promociones from './pages/Promociones'
import Acerca from './pages/Acerca'
import NotFound from './pages/NotFound'
import Usuarios from './pages/Usuarios'
import Carrito from './pages/Carrito'
import ProcederPago from './pages/ProcederPago'
import ConfirmarCompra from './pages/ConfirmarCompra'
import Comprar from './pages/Comprar'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import UserPanel from './pages/UserPanel'
import Notification from './components/Notification'
import Comunidad from './pages/Comunidad'
import Marquee from './components/Marquee'

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const apiUrl = (url) => (API_BASE ? `${API_BASE}${url}` : url)

const FALLBACK_CAPTIONS_HEADER = ['Moda y estilo para el hombre moderno', 'Nueva temporada', 'Calidad y confort', 'Envíos a todo el país']

function App() {
  const [topCaptions, setTopCaptions] = useState(null)

  useEffect(() => {
    let mounted = true
    fetch(apiUrl('/api/site/home'))
      .then(r => r.json())
      .then(data => {
        if (!mounted) return
        const caps = Array.isArray(data?.captions) && data.captions.length ? data.captions : FALLBACK_CAPTIONS_HEADER
        setTopCaptions(caps)
      })
      .catch(() => {
        if (!mounted) return
        setTopCaptions(FALLBACK_CAPTIONS_HEADER)
      })
    return () => { mounted = false }
  }, [])
  return (
    <BrowserRouter>
      <div className="fixed top-0 left-0 right-0 z-50">
        <Marquee items={topCaptions || FALLBACK_CAPTIONS_HEADER} speedSec={18} className="py-1 border-y border-white/20" separator="•" />
        <Header />
      </div>
      <main className="min-h-screen pt-24 md:pt-36">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/ubicacion" element={<Ubicacion />} />
          <Route path="/promociones" element={<Promociones />} />
          <Route path="/acerca" element={<Acerca />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/proceder-pago" element={<ProcederPago />} />
          <Route path="/confirmar_compra" element={<ConfirmarCompra />} />
          <Route path="/comprar/:id" element={<Comprar />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/mi-espacio" element={<UserPanel />} />
          <Route path="/comentarios" element={<Comunidad />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <Notification />
    </BrowserRouter>
  )
}

export default App

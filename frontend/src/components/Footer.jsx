import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const sections = [
    {
      title: 'Explorar',
      links: [
        { name: 'Inicio', path: '/' },
        { name: 'Productos', path: '/productos' },
        { name: 'Promociones', path: '/promociones' },
        { name: 'Acerca de', path: '/acerca' },
      ]
    },
    {
      title: 'Soporte',
      links: [
        { name: 'Contacto', path: '/contacto' },
        { name: 'Ubicación', path: '/ubicacion' },
        { name: 'Términos', path: '/terminos' },
        { name: 'Privacidad', path: '/privacidad' },
      ]
    },
    {
      title: 'Comunidad',
      links: [
        { name: 'Comentarios', path: '/comentarios' },
        { name: 'Instagram', path: '#' },
        { name: 'Facebook', path: '#' },
        { name: 'WhatsApp', path: '#' },
      ]
    }
  ]

  return (
    <footer className="bg-white border-t border-gray-100 pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-[#1E3A8A] rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500">
                <span className="text-white font-black text-xl italic">JJ</span>
              </div>
              <div>
                <p className="text-gray-900 font-black uppercase tracking-tighter text-lg leading-none">Indumentaria</p>
                <p className="text-[#1E3A8A] font-black uppercase tracking-[0.3em] text-[8px] leading-none mt-1">Masculina</p>
              </div>
            </Link>
            <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-sm">
              Definiendo el estilo del hombre moderno con prendas de alta calidad y diseño exclusivo. Tradición y vanguardia en cada detalle.
            </p>
            <div className="flex gap-4">
              {['facebook', 'instagram', 'twitter', 'whatsapp'].map((social) => (
                <button key={social} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#1E3A8A] hover:text-white transition-all duration-300">
                  <span className="sr-only">{social}</span>
                  <div className="w-5 h-5 bg-current mask-icon" />
                </button>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {sections.map((section) => (
            <div key={section.title} className="space-y-6">
              <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.path} 
                      className="text-gray-500 text-xs font-bold hover:text-[#1E3A8A] transition-colors uppercase tracking-widest"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            © {currentYear} JJ INDUMENTARIA. TODOS LOS DERECHOS RESERVADOS.
          </p>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Estado del Sistema: Online</span>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              DISEÑADO CON PASIÓN
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

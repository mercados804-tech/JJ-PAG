export default function Ubicacion() {
  return (
    <div className="bg-gray-50 min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-[#1E3A8A] uppercase tracking-tight mb-4">Nuestra Ubicación</h1>
          <div className="w-24 h-1.5 bg-[#1E3A8A] mx-auto rounded-full mb-6"></div>
          <p className="text-gray-500 font-medium max-w-2xl mx-auto italic">
            Visitá nuestro showroom en el corazón de Posadas y probá nuestra colección premium.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Card Info */}
          <div className="lg:col-span-4">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 sticky top-24 overflow-hidden group">
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-[#1E3A8A] text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>

                <h2 className="text-3xl font-black text-gray-900 mb-2">Posadas</h2>
                <p className="text-brandBlue font-bold uppercase tracking-widest text-[10px] mb-8">Casa Central</p>

                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dirección</p>
                    <p className="text-gray-700 font-bold leading-tight">Calle Flores 123<br/>Posadas, Misiones</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Atención</p>
                    <p className="text-gray-700 font-bold leading-tight">Lunes a Viernes<br/>09:00 — 18:00 hs</p>
                  </div>

                  <div className="pt-6">
                    <a 
                      href="https://www.google.com/maps?q=Calle+Flores+123,+Posadas" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[#1E3A8A] font-black uppercase tracking-widest text-[10px] hover:gap-4 transition-all"
                    >
                      Ver en Google Maps
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-8">
            <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden h-[500px] lg:h-full min-h-[400px]">
              <iframe
                title="Mapa de JJ Indumentaria"
                src="https://www.google.com/maps?q=Calle+Flores+123,+Posadas&output=embed"
                width="100%" 
                height="100%" 
                allowFullScreen 
                loading="lazy"
                className="rounded-[2rem] grayscale-[0.2] hover:grayscale-0 transition-all duration-700 border-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
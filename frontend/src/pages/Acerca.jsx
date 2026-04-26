export default function Acerca() {
  return (
    <div className="bg-gray-50 min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-[#1E3A8A] uppercase tracking-tight mb-4">Acerca de Nosotros</h1>
          <div className="w-24 h-1.5 bg-[#1E3A8A] mx-auto rounded-full mb-6"></div>
          <p className="text-gray-500 font-medium max-w-2xl mx-auto">
            Desde el año 2000, definiendo el estilo del hombre moderno con elegancia y distinción.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-full h-full border-2 border-blue-100 rounded-[3rem] -z-10"></div>
            <div className="bg-white p-4 rounded-[3rem] shadow-2xl transform hover:-rotate-2 transition-transform duration-700 overflow-hidden">
              <img
                src="/img/8a2f66883556b4a52020131a757763f0.jpg"
                alt="Nuestra tienda"
                className="w-full h-[500px] object-cover rounded-[2.5rem]"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 bg-[#1E3A8A] text-white p-8 rounded-3xl shadow-xl hidden md:block">
              <p className="text-4xl font-black">+20</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Años de trayectoria</p>
            </div>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-3xl font-black text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-blue-50 text-brandBlue rounded-xl flex items-center justify-center text-lg">📜</span>
                Nuestra Historia
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                JJ Indumentaria Masculina nació con una visión clara: ofrecer prendas que combinen la sastrería tradicional con las tendencias contemporáneas. A lo largo de dos décadas, nos hemos consolidado como un referente de confianza para quienes buscan calidad y un calce perfecto.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-black text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-lg">🎯</span>
                Nuestra Misión
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                Nuestra misión es empoderar al hombre a través de su imagen, brindando una experiencia de compra personalizada donde el asesoramiento y la atención al detalle son nuestra prioridad absoluta.
              </p>
            </section>
          </div>
        </div>

        {/* Valores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Calidad Premium', desc: 'Seleccionamos las mejores telas y proveedores para asegurar durabilidad y confort.', icon: '💎' },
            { title: 'Atención Exclusiva', desc: 'Cada cliente recibe un trato único y personalizado en nuestro showroom.', icon: '🤝' },
            { title: 'Innovación Constante', desc: 'Actualizamos nuestras colecciones mensualmente con lo último en moda mundial.', icon: '🚀' }
          ].map((v, i) => (
            <div key={i} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 text-center group">
              <div className="text-5xl mb-6 transform group-hover:scale-125 transition-transform duration-500 inline-block">{v.icon}</div>
              <h3 className="text-xl font-black text-gray-900 mb-3">{v.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 bg-gradient-to-r from-[#1E3A8A] to-blue-900 rounded-[3rem] p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <h2 className="text-3xl font-black mb-4 relative z-10">¿Querés conocernos en persona?</h2>
          <p className="text-blue-100/80 mb-8 max-w-xl mx-auto relative z-10 italic">
            Te invitamos a visitar nuestra tienda física y descubrir la calidad de nuestras prendas por vos mismo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <a href="/ubicacion" className="bg-white text-[#1E3A8A] px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all shadow-lg">Ver Ubicación</a>
            <a href="/productos" className="bg-blue-700/50 backdrop-blur-md border border-white/20 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700/70 transition-all">Ver Colección</a>
          </div>
        </div>
      </div>
    </div>
  )
}
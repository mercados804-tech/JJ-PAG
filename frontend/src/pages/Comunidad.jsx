import { useEffect, useState } from 'react'

export default function Comunidad() {
  const [feedPosts, setFeedPosts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jj_feed') || '[]') } catch { return [] }
  })
  const [isPaused, setIsPaused] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)

  useEffect(() => {
    if (!Array.isArray(feedPosts) || feedPosts.length === 0) {
      const defaults = [
        { id: 'd1', user: 'Juan Pérez', text: 'Excelente atención y envío rápido. ¡Muy recomendado!', stars: 5, ts: Date.now() - 86400000 },
        { id: 'd2', user: 'Marta Gómez', text: 'La calidad de las prendas me sorprendió, voy a repetir la compra sin dudas.', stars: 5, ts: Date.now() - 43200000 },
        { id: 'd3', user: 'Lucas R.', text: 'La remera queda perfecta y el talle es exactamente el que pedí.', stars: 4, ts: Date.now() - 7200000 },
        { id: 'd4', user: 'Sofía V.', text: 'Muy buena experiencia, el soporte respondió mis dudas enseguida.', stars: 5, ts: Date.now() - 3600000 },
        { id: 'd5', user: 'Roberto D.', text: 'Me llegó todo en tiempo y forma. Excelente calidad de tela.', stars: 5, ts: Date.now() - 5400000 },
      ]
      setFeedPosts(defaults)
      localStorage.setItem('jj_feed', JSON.stringify(defaults))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedPost) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedPost(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedPost])

  const StarRating = ({ count }) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={`text-xl ${i < count ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
      ))}
    </div>
  )

  const items = Array.isArray(feedPosts) ? feedPosts : []
  const marqueeItems = items.length > 0 ? [...items, ...items] : []
  const marqueeDuration = Math.max(20, items.length * 6)

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <style>{`
        @keyframes jj-marquee-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-[#1E3A8A] uppercase tracking-tight mb-3">Experiencias JJ</h1>
          <div className="w-24 h-1.5 bg-[#1E3A8A] mx-auto rounded-full mb-4"></div>
          <p className="text-gray-500 font-medium italic">Lo que nuestros clientes dicen de nosotros</p>
        </div>

        {items.length > 0 ? (
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-gray-50 to-transparent"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-gray-50 to-transparent"></div>
            <div
              className="flex w-max gap-6 pr-6"
              style={{
                animation: `jj-marquee-left ${marqueeDuration}s linear infinite`,
                animationPlayState: isPaused ? 'paused' : 'running',
              }}
            >
              {marqueeItems.map((p, idx) => (
                <button
                  key={`${p.id}-${idx}`}
                  type="button"
                  className="text-left bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group w-[340px] shrink-0"
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                  onClick={() => setSelectedPost(p)}
                >
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#1E3A8A] rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {(p.user || 'U')[0]}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 leading-tight">{p.user}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Cliente Verificado</p>
                      </div>
                    </div>
                    <StarRating count={p.stars || 5} />
                  </div>

                  <div className="relative z-10 mt-2">
                    <svg className="absolute -top-2 -left-2 w-8 h-8 text-blue-100 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V12C14.017 12.5523 13.5693 13 13.017 13H11.017C10.4647 13 10.017 12.5523 10.017 12V9C10.017 7.89543 10.9124 7 12.017 7H19.017C20.1216 7 21.017 7.89543 21.017 9V15C21.017 17.2091 19.2261 19 17.017 19H14.017V21ZM5.017 21L5.017 18C5.017 16.8954 5.91243 16 7.017 16H10.017C10.5693 16 11.017 15.5523 11.017 15V9C11.017 8.44772 10.5693 8 10.017 8H6.017C5.46472 8 5.017 8.44772 5.017 9V12C5.017 12.5523 4.56929 13 4.017 13H2.017C1.46472 13 1.017 12.5523 1.017 12V9C1.017 7.89543 1.91243 7 3.017 7H10.017C11.1216 7 12.017 7.89543 12.017 9V15C12.017 17.2091 10.2261 19 8.017 19H5.017V21Z" />
                    </svg>
                    <p className="text-gray-700 leading-relaxed pl-6 italic line-clamp-3">"{p.text}"</p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center relative z-10">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      {new Date(p.ts).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-200"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-100"></span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {feedPosts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-medium">Aún no hay comentarios. ¡Sé el primero en opinar!</p>
          </div>
        )}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectedPost(null)}
            aria-label="Cerrar"
          />
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-black text-gray-900 leading-tight">{selectedPost.user}</p>
                <div className="mt-2">
                  <StarRating count={selectedPost.stars || 5} />
                </div>
              </div>
              <button
                type="button"
                className="px-3 py-2 rounded-2xl bg-gray-100 text-gray-700 font-black uppercase tracking-widest text-[10px] hover:bg-gray-200"
                onClick={() => setSelectedPost(null)}
              >
                Cerrar
              </button>
            </div>
            <div className="mt-5 text-gray-800 leading-relaxed whitespace-pre-wrap">
              {selectedPost.text}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {new Date(selectedPost.ts).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

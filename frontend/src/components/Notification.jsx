import { useEffect, useState, useRef } from 'react'

const palette = {
  info: 'bg-blue-600',
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-yellow-500 text-black',
}

export default function Notify() {
  const [current, setCurrent] = useState(null)
  const [queue, setQueue] = useState([])
  const timerRef = useRef(null)

  useEffect(() => {
    function onNotify(ev) {
      const { message, type = 'info' } = ev.detail || {}
      const id = Date.now()
      setQueue(q => [...q, { message, type, id }])
    }
    window.addEventListener('notify', onNotify)
    return () => window.removeEventListener('notify', onNotify)
  }, [])

  useEffect(() => {
    if (!current && queue.length > 0) {
      const next = queue[0]
      setCurrent(next)
      setQueue(q => q.slice(1))
      
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setCurrent(null)
      }, 4000) // 4 segundos visible
    }
  }, [queue, current])

  const removeCurrent = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setCurrent(null)
  }

  if (!current) return null

  const cls = palette[current.type] || palette.info

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-bounce-in">
      <div 
        className={`text-white ${cls} rounded-xl shadow-2xl px-6 py-4 max-w-sm flex items-center justify-between gap-4 border border-white/20 backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform`}
        onClick={removeCurrent}
      > 
        <span className="font-medium">{current.message}</span>
        <button className="text-white/70 hover:text-white font-bold text-lg">×</button>
      </div>
    </div>
  )
}
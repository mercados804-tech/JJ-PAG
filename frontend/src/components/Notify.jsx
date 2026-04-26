import { useEffect, useState, useRef } from 'react'

const palette = {
  info: 'bg-blue-600',
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-yellow-500 text-black',
}

export default function Notify() {
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    function onNotify(ev) {
      const { message, type = 'info' } = ev.detail || {}
      setQueue(q => [...q, { message, type, id: Date.now() }])
    }
    window.addEventListener('notify', onNotify)
    return () => window.removeEventListener('notify', onNotify)
  }, [])

  useEffect(() => {
    if (!current && queue.length > 0) {
      const [head, ...rest] = queue
      setCurrent(head)
      setQueue(rest)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setCurrent(null)
      }, 3000)
    }
    return () => clearTimeout(timerRef.current)
  }, [queue, current])

  if (!current) return null

  const cls = palette[current.type] || palette.info

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`text-white ${cls} rounded-md shadow-lg px-4 py-3 max-w-sm`}> 
        {current.message}
      </div>
    </div>
  )
}
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold text-[#1E3A8A] mb-3">Página no encontrada</h1>
      <p className="text-gray-700 mb-6">La ruta solicitada no existe.</p>
    <Link to="/" className="px-4 py-2 bg-brandBlue text-white rounded-md">Volver al inicio</Link>
    </section>
  )
}
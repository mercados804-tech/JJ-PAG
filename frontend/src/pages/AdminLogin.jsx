import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { notify } from '../components/notify'

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const apiUrl = (url) => (API_BASE ? `${API_BASE}${url}` : url)

export default function AdminLogin() {
  const navigate = useNavigate()
  const LoginSchema = Yup.object({
    email: Yup.string().email('Email inválido').required('Email requerido'),
    password: Yup.string().min(6, 'Mínimo 6 caracteres').required('Contraseña requerida'),
  })

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const resp = await fetch(apiUrl('/api/auth/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await resp.json()
      if (!resp.ok || !data.ok || !data.token) {
        notify(data.error || 'Credenciales inválidas', 'error')
        return
      }
      localStorage.setItem('adminToken', data.token)
      localStorage.setItem('adminRole', data.role || 'admin')
      localStorage.setItem('adminName', data.name || '')
      localStorage.setItem('adminEmail', data.email || values.email)
      notify('Ingreso exitoso', 'success')
      // Navegación usando react-router
      navigate('/admin', { replace: true })
      // Fallback duro por si la navegación de router falla en algunos entornos/servidores
      setTimeout(() => {
        if (window && window.location && window.location.pathname !== '/admin') {
          window.location.assign('/admin')
        }
      }, 50)
    } catch {
      notify('Error de red al conectar con el backend', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="p-5">
      <h1 className="text-2xl text-[#1E3A8A] text-center font-bold mb-2">Acceso al Panel</h1>
      <p className="text-center text-sm text-gray-600 mb-5">Ingresá con una cuenta `admin`, `vendedor` o `stock`.</p>
      <div className="bg-white p-5 rounded-lg shadow-sm w-[28rem] mx-auto">
        <Formik initialValues={{ email: '', password: '' }} validationSchema={LoginSchema} onSubmit={onSubmit}>
          {({ isSubmitting }) => (
            <Form className="space-y-3">
              <label className="block text-[#1E3A8A]" htmlFor="email">Correo:</label>
              <Field id="email" name="email" type="email" className="w-full border border-gray-300 rounded-md p-2 placeholder:text-gray-400" placeholder="admin@jj.com" />
              <ErrorMessage name="email" component="div" className="text-red-600 text-sm mt-1" />

              <label className="block text-[#1E3A8A]" htmlFor="password">Contraseña:</label>
              <Field id="password" name="password" type="password" className="w-full border border-gray-300 rounded-md p-2" />
              <ErrorMessage name="password" component="div" className="text-red-600 text-sm mt-1" />

              <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-brandBlue text-white rounded-md disabled:opacity-50">Ingresar</button>
            </Form>
          )}
        </Formik>
      </div>
    </section>
  )
}

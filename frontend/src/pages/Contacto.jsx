import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const apiUrl = (url) => (API_BASE ? `${API_BASE}${url}` : url)

const schema = Yup.object({
  name: Yup.string().min(2, 'Debe tener al menos 2 caracteres').required('Nombre requerido'),
  email: Yup.string().email('Correo inválido').required('Correo requerido'),
  message: Yup.string().min(10, 'Debe tener al menos 10 caracteres').required('Mensaje requerido'),
})

export default function Contacto() {
  return (
    <div className="bg-gray-50 min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-[#1E3A8A] uppercase tracking-tight mb-4">Contactanos</h1>
          <div className="w-24 h-1.5 bg-[#1E3A8A] mx-auto rounded-full mb-6"></div>
          <p className="text-gray-500 font-medium max-w-2xl mx-auto">
            Estamos acá para ayudarte. Si tenés dudas sobre talles, envíos o pedidos, dejanos tu mensaje.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Info Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
              
              <h2 className="text-2xl font-black text-gray-900 mb-8 relative z-10">Información</h2>
              
              <div className="space-y-8 relative z-10">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dirección</p>
                    <p className="text-gray-700 font-bold">Calle Flores 123, Posadas, Misiones</p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1.22c-5.14 0-9.28-4.14-9.28-9.28V5z"/></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Teléfono</p>
                    <p className="text-gray-700 font-bold">+54 376 4559829</p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email</p>
                    <p className="text-gray-700 font-bold">info@jjindumentaria.com.ar</p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Horario</p>
                    <p className="text-gray-700 font-bold">Lun a Vie: 9:00 - 18:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="lg:col-span-7">
            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100">
              <Formik
                initialValues={{ name: '', email: '', message: '' }}
                validationSchema={schema}
                onSubmit={async (values, actions) => {
                  actions.setStatus('')
                  try {
                    const res = await fetch(apiUrl('/api/contact'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(values)
                    })
                    if (res.ok) {
                      actions.setStatus('¡Mensaje enviado con éxito!')
                      actions.resetForm()
                    } else {
                      actions.setStatus('Ocurrió un error al enviar.')
                    }
                  } catch {
                    actions.setStatus('Error de conexión.')
                  } finally {
                    actions.setSubmitting(false)
                  }
                }}
              >
                {({ status, isSubmitting }) => (
                  <Form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="name">Nombre Completo</label>
                        <Field 
                          id="name" 
                          name="name" 
                          placeholder="Tu nombre"
                          className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#1E3A8A] transition-all outline-none text-gray-700" 
                        />
                        <ErrorMessage name="name" component="div" className="text-red-500 text-[10px] font-bold uppercase ml-1" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="email">Correo Electrónico</label>
                        <Field 
                          id="email" 
                          name="email" 
                          type="email" 
                          placeholder="ejemplo@correo.com"
                          className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#1E3A8A] transition-all outline-none text-gray-700" 
                        />
                        <ErrorMessage name="email" component="div" className="text-red-500 text-[10px] font-bold uppercase ml-1" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" htmlFor="message">Tu Mensaje</label>
                      <Field 
                        as="textarea" 
                        id="message" 
                        name="message" 
                        rows={5} 
                        placeholder="¿En qué podemos ayudarte?"
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#1E3A8A] transition-all outline-none text-gray-700 resize-none" 
                      />
                      <ErrorMessage name="message" component="div" className="text-red-500 text-[10px] font-bold uppercase ml-1" />
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="bg-[#1E3A8A] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brandNav transform active:scale-95 transition-all duration-200 shadow-lg disabled:opacity-50"
                      >
                        {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                      </button>
                      
                      {status && (
                        <p className={`text-xs font-bold uppercase ${status.includes('éxito') ? 'text-green-600' : 'text-red-600'}`}>
                          {status}
                        </p>
                      )}
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

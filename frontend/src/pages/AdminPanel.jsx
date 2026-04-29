import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notify } from '../components/notify'

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const apiUrl = (url) => (API_BASE ? `${API_BASE}${url}` : url)

const legacyPromos = [
  { id: 1, image: '/img/promo1.webp', title: 'Buzo', price: 'ARS 30.000,00', discount: 'AGOTADO', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 2, image: '/img/promo2.webp', title: 'Campera', price: 'ARS 37.300,00', discount: 'AGOTADO', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 3, image: '/img/promo3.webp', title: 'Campera', price: 'ARS 50.000,00', discount: '29 OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 4, image: '/img/promo4.webp', title: 'Buzo', price: 'ARS 50.000,00', discount: '20% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 5, image: '/img/promo5.webp', title: 'Campera', price: 'ARS 56.500,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 6, image: '/img/promo6.webp', title: 'Campera', price: 'ARS 50.000,00', discount: '29% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 7, image: '/img/promo7.webp', title: 'Pantalon', price: 'ARS 32.000,00', discount: '29% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 8, image: '/img/promo8.webp', title: 'Remera', price: 'ARS 24.300,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 9, image: '/img/promo9.webp', title: 'Remera', price: 'ARS 24.300,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 10, image: '/img/promo10.webp', title: 'Remera', price: 'ARS 24.300,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 11, image: '/img/promo11.webp', title: 'Buzo', price: 'ARS 50.000,00', discount: '20% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 12, image: '/img/promo12.webp', title: 'Remera', price: 'ARS 24.000,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 13, image: '/img/promo13.webp', title: 'Buzo', price: 'ARS 50.000,00', discount: '20% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 14, image: '/img/promo14.webp', title: 'Remera', price: 'ARS 24.300,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 15, image: '/img/promo15.webp', title: 'Remera', price: 'ARS 24.300,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 16, image: '/img/promo16.webp', title: 'Buzo', price: 'ARS 39.000,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 17, image: '/img/promo17.webp', title: 'Remera', price: 'ARS 33.000,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
  { id: 18, image: '/img/promo18.webp', title: 'Remera', price: 'ARS 24.300,00', discount: '13% OFF', sizes: 'S, M, L, XL', description: 'Talles Disponibles: S, M, L, XL' },
]

const publicProductTemplates = [
  { id: 101, name: 'Remera JJ', price: 35990, image: '/img/promo9.webp', quantity: 20 },
  { id: 102, name: 'Chomba JJ', price: 25000, image: '/img/chomba.webp', quantity: 20 },
  { id: 103, name: 'Pantalón Jeans JJ', price: 31700, image: '/img/promo7.webp', quantity: 20 },
  { id: 104, name: 'Pantalón JJ', price: 30000, image: '/img/bermuda.webp', quantity: 20 },
  { id: 105, name: 'Remera Negra JJ', price: 23000, image: '/img/ima1.webp', quantity: 20 },
  { id: 106, name: 'Remera Negra JJ', price: 21000, image: '/img/ima2.webp', quantity: 20 },
  { id: 107, name: 'Remera Azul C++ JJ', price: 15000, image: '/img/c++.webp', quantity: 20 },
  { id: 108, name: 'Remera Negro JJ', price: 20000, image: '/img/gptr,1265x,front,black-c,330,402,600,600-bg,f8f8f8.u3.jpg', quantity: 20 },
  { id: 109, name: 'Remera Blanca JJ', price: 22000, image: '/img/promo16.webp', quantity: 20 },
  { id: 110, name: 'Remera Blanca JJ', price: 23000, image: '/img/promo17.webp', quantity: 20 },
  { id: 111, name: 'Remera Negra JJ', price: 20000, image: '/img/promo12.webp', quantity: 20 },
  { id: 112, name: 'Buzo Celeste JJ', price: 45000, image: '/img/promo15.webp', quantity: 20 },
  { id: 113, name: 'Buzo Tricolor JJ', price: 37000, image: '/img/promo3.webp', quantity: 20 },
  { id: 114, name: 'Remera Negro JJ', price: 16000, image: '/img/promo14.webp', quantity: 20 },
  { id: 115, name: 'Chomba Azul JJ', price: 20000, image: '/img/ima3.webp', quantity: 20 },
  { id: 116, name: 'Chomba Negra JJ', price: 20000, image: '/img/ima2.webp', quantity: 20 },
  { id: 117, name: 'Buzo Negro JJ', price: 32000, image: '/img/promo13.webp', quantity: 20 },
  { id: 118, name: 'Chomba JJ', price: 25000, image: '/img/ima1.webp', quantity: 20 },
]
const publicProductTemplateMap = new Map(publicProductTemplates.map((item) => [Number(item.id), item]))

const PROMO_TEMPLATE_MIN_STOCK = '15'
const LEGACY_PROMOTION_STORAGE_KEY = 'jjLegacyPromotionOverrides'

function dedupeById(list) {
  const merged = new Map()
  ;(Array.isArray(list) ? list : []).forEach((item) => {
    if (!item || item.id == null) return
    const current = merged.get(item.id) || {}
    merged.set(item.id, { ...current, ...item })
  })
  return Array.from(merged.values())
}

function readStoredLegacyPromotionOverrides() {
  try {
    const raw = localStorage.getItem(LEGACY_PROMOTION_STORAGE_KEY)
    const parsed = JSON.parse(raw || '[]')
    return dedupeById(Array.isArray(parsed) ? parsed : [])
  } catch {
    return []
  }
}

function writeStoredLegacyPromotionOverrides(list) {
  try {
    localStorage.setItem(LEGACY_PROMOTION_STORAGE_KEY, JSON.stringify(dedupeById(list)))
  } catch {
    void 0
  }
}

function getPublicProductTemplate(product) {
  return publicProductTemplateMap.get(Number(product?.id)) || null
}

function getPublicProductImage(product) {
  return getPublicProductTemplate(product)?.image || product?.image || ''
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const [panelSession, setPanelSession] = useState({
    role: localStorage.getItem('adminRole') || '',
    name: localStorage.getItem('adminName') || '',
    email: localStorage.getItem('adminEmail') || '',
  })
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [salesLog, setSalesLog] = useState([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [productColors, setProductColors] = useState('')
  const [productSizes, setProductSizes] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [imageBase64, setImageBase64] = useState('')
  const [preview, setPreview] = useState('')
  const [stats, setStats] = useState({ totalProducts: 0, totalInventory: 0, totalSales: 0, revenue: 0 })
  const [editingId, setEditingId] = useState(null)
  const [editFields, setEditFields] = useState({ name: '', price: '', category: '', quantity: '', imageBase64: '', supplier_id: '' })
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showCreateProductModal, setShowCreateProductModal] = useState(false)
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [promotionDetail, setPromotionDetail] = useState(null)
  const [legacyPromotionOverrides, setLegacyPromotionOverrides] = useState(() => readStoredLegacyPromotionOverrides())

  // Efecto para manejar parámetros de URL y pre-llenar promociones
  useEffect(() => {
    const isAdminNow = String(panelSession.role || localStorage.getItem('adminRole') || '').toLowerCase() === 'admin'
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    const knownTabs = ['dashboard', 'products', 'promotions', 'clients', 'messages', 'inventory', 'orders', 'suppliers', 'sales-report', 'stock-report', 'home', 'settings']
    if (tab && knownTabs.includes(tab)) {
      if ((tab === 'sales-report' || tab === 'stock-report') && !isAdminNow) {
        return
      }
      setActiveTab(tab)
      
      if (tab === 'promotions') {
        const pendingTitle = localStorage.getItem('pendingPromoTitle')
        const pendingImage = localStorage.getItem('pendingPromoImage')
        if (pendingTitle) {
          setPromoTitle(pendingTitle)
          localStorage.removeItem('pendingPromoTitle')
        }
        if (pendingImage) {
          setPromoPreview(pendingImage)
          setPromoImageBase64(pendingImage)
          localStorage.removeItem('pendingPromoImage')
        }
      }
    }
  }, [panelSession.role])
  const [salesSeries, setSalesSeries] = useState([])
  const [salesSeriesRange, setSalesSeriesRange] = useState('30d')
  // Pedidos, Proveedores, Reportes, Configuración
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [settings, setSettings] = useState({
    minStock: 2,
    adminEmail: '',
    adminPassword: '',
    adminName: '',
    companyName: '',
    companyAddress: '',
    companyCity: '',
    companyPhone: '',
    companyEmail: '',
    companyCuit: '',
    companyLogo: '',
  })
  const [newOrder, setNewOrder] = useState({ customer: '', productName: '', quantity: '1' })
  const [orderSale, setOrderSale] = useState({ name: '', quantity: '1' })
  const [shipmentForms, setShipmentForms] = useState({}) // { [orderId]: { recipient, address, province, postalCode } }
  const [ordersPage, setOrdersPage] = useState(0)
  const [reportRange, setReportRange] = useState({ from: '', to: '' })
  const [reportData, setReportData] = useState({ sold: [], faltantes: [], threshold: 2, company: null })
  const [reportLoading, setReportLoading] = useState(false)
  const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', email: '', phone: '', notes: '' })
  const [editingSupplierId, setEditingSupplierId] = useState(null)
  const [editSupplierFields, setEditSupplierFields] = useState({ name: '', contact: '', email: '', phone: '', notes: '' })

  const [isRegisteringSale, setIsRegisteringSale] = useState(false)

  const [newClient, setNewClient] = useState({ name: '', email: '', password: '', is_verified: false, role: 'vendedor' })
  const [editingClientId, setEditingClientId] = useState(null)
  const [editClientFields, setEditClientFields] = useState({ name: '', email: '', password: '', is_verified: false, role: 'vendedor' })

  // Quick sale states
  const [quickSalePid, setQuickSalePid] = useState('')
  const [quickSaleQty, setQuickSaleQty] = useState('1')
  const [quickSalePrice, setQuickSalePrice] = useState('')

  // Inicio (Home)
  const [homeCfg, setHomeCfg] = useState({ images: ['/img/top-view-accessoires-travel-with-man-clothing-concept-shirt.jpg','/img/top-view-accessoires-travel-with-man-clothing-concept-shirt.jpg','/img/top-view-accessoires-travel-with-man-clothing-concept-shirt.jpg'], captions: ['Nueva Temporada 2024','Esencia Masculina','Estilo sin Límites'], intervalMs: 3000, pauseOnHover: true })
  // Promociones
  const [promotions, setPromotions] = useState([])
  const [promoProductId, setPromoProductId] = useState('')
  const [promoTitle, setPromoTitle] = useState('')
  const [promoDesc, setPromoDesc] = useState('')
  const [promoPrice, setPromoPrice] = useState('')
  const [promoStockPromocion, setPromoStockPromocion] = useState(PROMO_TEMPLATE_MIN_STOCK)
  const [promoSizes, setPromoSizes] = useState('')
  const [promoImageBase64, setPromoImageBase64] = useState('')
  const [promoPreview, setPromoPreview] = useState('')
  const [promoFechaInicio, setPromoFechaInicio] = useState('')
  const [promoFechaFin, setPromoFechaFin] = useState('')
  const [promoEditingId, setPromoEditingId] = useState(null)
  const [promoEditFields, setPromoEditFields] = useState({ title: '', description: '', price: '', sizes: '', stockPromocion: '', fechaInicio: '', fechaFin: '', estado: 'activa', imageBase64: '', image: '' })
  const [contactMessages, setContactMessages] = useState([])
  const [contactMessageFilter, setContactMessageFilter] = useState('pendiente')
  const [selectedContactMessageId, setSelectedContactMessageId] = useState(null)
  const [contactReplyDraft, setContactReplyDraft] = useState('')
  const [isSendingContactReply, setIsSendingContactReply] = useState(false)
  const [messagesPage, setMessagesPage] = useState(0)
  // Inventario: selección y filtros
  const [searchInv, setSearchInv] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos') // todos | ok | bajo | critico
  const [inventorySection, setInventorySection] = useState('inventario')
  const [inventoryCategory, setInventoryCategory] = useState('todas')
  const [inventoryStockBySize, setInventoryStockBySize] = useState(() => {
    try {
      const raw = localStorage.getItem('inventoryStockBySize')
      const parsed = raw ? JSON.parse(raw) : {}
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  })
  const [inventoryMovements, setInventoryMovements] = useState(() => {
    try {
      const raw = localStorage.getItem('inventoryMovements')
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [inventoryMovementDraft, setInventoryMovementDraft] = useState({ productId: '', size: '', qty: 1, type: 'entrada' })
  const [inventoryMoveSearch, setInventoryMoveSearch] = useState('')
  const [inventoryMoveFrom, setInventoryMoveFrom] = useState('')
  const [inventoryMoveTo, setInventoryMoveTo] = useState('')
  const [isCreatingStockProduct, setIsCreatingStockProduct] = useState(false)
  const [returnsLog, setReturnsLog] = useState([])

  useEffect(() => {
    if (activeTab === 'orders') setOrdersPage(0)
    if (activeTab === 'messages') setMessagesPage(0)
  }, [activeTab])

  useEffect(() => {
    setOrdersPage(0)
  }, [orders.length])

  useEffect(() => {
    setMessagesPage(0)
  }, [contactMessages.length, contactMessageFilter])
  const [returnsSearch, setReturnsSearch] = useState('')
  const [returnsFrom, setReturnsFrom] = useState('')
  const [returnsTo, setReturnsTo] = useState('')
  const [returnDraft, setReturnDraft] = useState({ productName: '', qty: '1', orderId: '', reason: '' })
  const [isRegisteringReturn, setIsRegisteringReturn] = useState(false)
  const [orderReturns, setOrderReturns] = useState([])
  const [orderReturnDraft, setOrderReturnDraft] = useState({ orderId: '', orderItemId: '', qty: '1', reason: '' })
  const [isCreatingOrderReturn, setIsCreatingOrderReturn] = useState(false)

  const statusInfo = (q) => {
    const qty = Number(q) || 0
    const min = Number(settings?.minStock) || 2
    if (qty <= 0) return { label: 'Crítico', className: 'bg-red-600/20 text-red-300 border border-red-600/40' }
    if (qty < min) return { label: 'Bajo', className: 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/40' }
    return { label: 'OK', className: 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/40' }
  }

  const persistInventoryStockBySize = (next) => {
    setInventoryStockBySize(next)
    try { localStorage.setItem('inventoryStockBySize', JSON.stringify(next)) } catch { void 0 }
  }

  const pushInventoryMovements = (entries) => {
    const list = Array.isArray(entries) ? entries : [entries]
    setInventoryMovements(prev => {
      const next = [...list, ...(Array.isArray(prev) ? prev : [])].slice(0, 200)
      try { localStorage.setItem('inventoryMovements', JSON.stringify(next)) } catch { void 0 }
      return next
    })
  }

  const role = panelSession.role || localStorage.getItem('adminRole') || ''
  const isAdmin = String(role).toLowerCase() === 'admin'
  const isSeller = String(role).toLowerCase() === 'vendedor'
  const isStock = String(role).toLowerCase() === 'stock'
  const canAccessSales = isAdmin || isSeller
  const canAccessOrders = isAdmin || isSeller || isStock
  const canManageProducts = isAdmin || isSeller
  const canManagePromotions = isAdmin || isSeller
  const canAccessMessages = isAdmin || isSeller
  const roleLabel = isAdmin ? 'Administrador' : (isSeller ? 'Vendedor' : 'Control de Stock')
  const dashboardTabLabel = isSeller ? 'Ventas diarias' : 'Resumen'
  const userRoleOptions = [
    { value: 'client', label: 'Cliente' },
    { value: 'vendedor', label: 'Vendedor' },
    { value: 'stock', label: 'Stock' },
    { value: 'admin', label: 'Administrador' },
  ]
  const panelRoleOptions = userRoleOptions.filter(option => option.value !== 'client')
  const formatUserRole = (value) => userRoleOptions.find(option => option.value === value)?.label || value || 'Cliente'
  const token = localStorage.getItem('adminToken')

  const adminTabs = [
    { id:'dashboard', label: dashboardTabLabel, visible: isAdmin || isSeller },
    { id:'products', label:'Productos', visible: canManageProducts },
    { id:'promotions', label:'Promociones', visible: canManagePromotions },
    { id:'messages', label:'Mensajes', visible: canAccessMessages },
    { id:'inventory', label:'Inventario', visible: isAdmin || isStock },
    { id:'orders', label:'Pedidos', visible: canAccessOrders },
    { id:'order-returns', label:'Devoluciones', visible: canAccessOrders },
    { id:'suppliers', label:'Proveedores', visible: isAdmin || isStock },
    { id:'clients', label:'Roles', visible: isAdmin },
    { id:'sales-report', label:'Reporte de Ventas', visible: isAdmin, isTail: true },
    { id:'stock-report', label:'Reporte de Stock', visible: isAdmin, isTail: true },
    { id:'home', label:'Inicio', visible: isAdmin, isTail: true },
    { id:'settings', label:'Configuración', visible: isAdmin, isTail: true },
  ].filter(tab => tab.visible)

  const authHeaders = (headers = {}) => {
    const next = { ...headers }
    const activeToken = localStorage.getItem('adminToken')
    if (activeToken) next.Authorization = `Bearer ${activeToken}`
    return next
  }

  const fetchAdmin = async (url, options = {}) => {
    const headers = authHeaders(options.headers || {})
    const resp = await fetch(apiUrl(url), { ...options, headers })
    if (resp.status === 401 || resp.status === 403) {
      throw new Error('AUTH_REQUIRED')
    }
    return resp
  }

  const clearAdminSession = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminRole')
    localStorage.removeItem('adminName')
    localStorage.removeItem('adminEmail')
  }

  const refreshProducts = async () => {
    const resp = await fetchAdmin('/api/admin/products')
    const data = await resp.json()
    const list = dedupeById(Array.isArray(data) ? data : [])
    setProducts(list)
    return list
  }

  const refreshStats = async () => {
    if (!canAccessSales) {
      const fallback = { totalProducts: 0, totalInventory: 0, totalSales: 0, revenue: 0 }
      setStats(fallback)
      return fallback
    }
    const resp = await fetchAdmin('/api/admin/stats')
    const data = await resp.json()
    const next = data && typeof data === 'object' ? data : { totalProducts: 0, totalInventory: 0, totalSales: 0, revenue: 0 }
    setStats(next)
    return next
  }

  const refreshSalesLog = async () => {
    if (!canAccessSales) {
      setSalesLog([])
      return []
    }
    const resp = await fetchAdmin('/api/admin/sales/log')
    const data = await resp.json()
    const list = Array.isArray(data) ? data : []
    setSalesLog(list)
    return list
  }

  const refreshOrders = async () => {
    if (!canAccessOrders) {
      setOrders([])
      return []
    }
    const resp = await fetchAdmin('/api/admin/orders')
    const data = await resp.json()
    const list = Array.isArray(data) ? data : []
    setOrders(list)
    return list
  }

  const refreshUsers = async () => {
    if (!isAdmin) {
      setUsers([])
      return []
    }
    const resp = await fetchAdmin('/api/admin/users')
    const data = await resp.json()
    const list = Array.isArray(data) ? data : []
    setUsers(list)
    return list
  }

  const refreshSuppliers = async () => {
    if (!(isAdmin || isStock)) {
      setSuppliers([])
      return []
    }
    const resp = await fetchAdmin('/api/admin/suppliers')
    const data = await resp.json()
    const list = Array.isArray(data) ? data : []
    setSuppliers(list)
    return list
  }

  const refreshMessages = async () => {
    if (!canAccessMessages) {
      setContactMessages([])
      return []
    }
    const resp = await fetchAdmin('/api/admin/contact-messages')
    const data = await resp.json()
    const list = Array.isArray(data) ? data : []
    setContactMessages(list)
    return list
  }

  const saveContactMessageReply = async ({ messageId, replyText }) => {
    if (!canAccessMessages) return false
    const id = Number(messageId)
    const reply = String(replyText || '').trim()
    if (!Number.isFinite(id) || !reply) return false

    setIsSendingContactReply(true)
    try {
      const resp = await fetchAdmin(`/api/admin/contact-messages/${encodeURIComponent(id)}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok || !data?.ok) {
        notify(data?.error || 'No se pudo enviar la respuesta', 'error')
        return false
      }
      notify(data?.mailed === false ? 'Respuesta guardada (correo no enviado)' : 'Respuesta enviada', 'success')
      await refreshMessages()
      return true
    } catch {
      notify('No se pudo enviar la respuesta', 'error')
      return false
    } finally {
      setIsSendingContactReply(false)
    }
  }

  const refreshPromotions = async () => {
    if (!canManagePromotions) {
      setPromotions([])
      return []
    }
    const resp = await fetchAdmin('/api/admin/promotions')
    const data = await resp.json()
    const list = dedupeById(Array.isArray(data) ? data : [])
    setPromotions(list)
    return list
  }

  const refreshReturns = async () => {
    if (!(isAdmin || isStock)) {
      setReturnsLog([])
      return []
    }
    const resp = await fetchAdmin('/api/admin/returns')
    const data = await resp.json()
    const list = Array.isArray(data) ? data : []
    setReturnsLog(list)
    return list
  }

  const refreshOrderReturns = async () => {
    if (!canAccessOrders) {
      setOrderReturns([])
      return []
    }
    const resp = await fetchAdmin('/api/admin/order-returns')
    const data = await resp.json()
    const list = Array.isArray(data) ? data : []
    setOrderReturns(list)
    return list
  }

  const syncLegacyPromotionOverrides = (nextList) => {
    const merged = dedupeById([...(readStoredLegacyPromotionOverrides()), ...((Array.isArray(nextList) ? nextList : []))])
    writeStoredLegacyPromotionOverrides(merged)
    setLegacyPromotionOverrides(merged)
    return merged
  }

  const storeLegacyPromotionOverride = (promo, patch) => {
    const nextItem = {
      id: Number(promo?.id),
      title: promo?.title || '',
      description: promo?.description || '',
      image: promo?.image || '',
      price: promo?.price || '',
      sizes: promo?.sizes || '',
      discount: promo?.discount || '',
      ...patch,
      isLegacy: true,
    }
    return syncLegacyPromotionOverrides([nextItem])
  }

  const refreshLegacyPromotionOverrides = async () => {
    try {
      const resp = await fetch(apiUrl('/api/promotions/all'))
      const text = await resp.text()
      let data = []
      try {
        data = JSON.parse(text)
      } catch {
        data = []
      }
      const list = (Array.isArray(data) ? data : []).filter(item => item?.isLegacy)
      return syncLegacyPromotionOverrides(list)
    } catch {
      const stored = readStoredLegacyPromotionOverrides()
      setLegacyPromotionOverrides(stored)
      return stored
    }
  }

  const cancelInventoryMovement = () => {
    setInventoryMovementDraft({ productId: '', size: '', qty: 1, type: 'entrada' })
  }

  const saveInventoryMovement = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) { notify('Sesión expirada', 'error'); navigate('/admin/login'); return }

    const productIdNum = Number(inventoryMovementDraft.productId)
    const product = products.find(p => Number(p.id) === productIdNum)
    if (!product) { notify('Seleccione un producto', 'warning'); return }

    const size = String(inventoryMovementDraft.size || '').trim().toUpperCase()
    const qty = Math.floor(Number(inventoryMovementDraft.qty))
    if (!size) { notify('Seleccione un talle', 'warning'); return }
    if (!qty || qty <= 0) { notify('Ingrese una cantidad válida', 'warning'); return }

    const type = inventoryMovementDraft.type === 'salida'
      ? 'salida'
      : (inventoryMovementDraft.type === 'actualizar' ? 'actualizar' : 'entrada')

    const pidKey = String(productIdNum)
    const currentProductQty = Number(product.quantity) || 0
    const currentBySize = (inventoryStockBySize && typeof inventoryStockBySize === 'object' ? inventoryStockBySize[pidKey] : null) || {}
    const currentSizeQty = Number(currentBySize?.[size]) || 0

    const nextSizeQty = type === 'actualizar'
      ? Math.max(qty, 0)
      : Math.max(currentSizeQty + (type === 'entrada' ? qty : -qty), 0)

    const delta = nextSizeQty - currentSizeQty
    const nextTotalQty = Math.max(currentProductQty + delta, 0)

    const nextStockBySize = {
      ...(inventoryStockBySize && typeof inventoryStockBySize === 'object' ? inventoryStockBySize : {}),
      [pidKey]: { ...(currentBySize && typeof currentBySize === 'object' ? currentBySize : {}), [size]: nextSizeQty },
    }
    persistInventoryStockBySize(nextStockBySize)

    try {
      const resp = await fetch(apiUrl(`/api/admin/products/${productIdNum}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity: nextTotalQty })
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok || data?.ok === false) {
        notify(data?.error || 'No se pudo actualizar el stock', 'error')
        return
      }
    } catch {
      notify('Error de red al actualizar el stock', 'error')
      return
    }

    pushInventoryMovements({
      id: Date.now(),
      ts: new Date().toISOString(),
      productId: productIdNum,
      productName: product.name || `Producto ${productIdNum}`,
      size,
      type,
      qty: type === 'actualizar' ? nextSizeQty : qty,
      delta,
      total: nextTotalQty,
    })

    await refreshProducts()
    setInventoryMovementDraft(prev => ({ ...prev, qty: 1 }))
    notify('Movimiento guardado', 'success')
  }

  useEffect(() => {
    const role = panelSession.role || localStorage.getItem('adminRole') || ''
    const isAdmin = String(role).toLowerCase() === 'admin'
    const isSeller = String(role).toLowerCase() === 'vendedor'
    const canAccessSales = isAdmin || isSeller
    const canManagePromotions = isAdmin || isSeller

    const token = localStorage.getItem('adminToken')
    if (!token) {
      navigate('/admin/login')
      return
    }
    const loadPanel = async () => {
      try {
        const sessionResp = await fetchAdmin('/api/auth/admin/session')
        const sessionData = await sessionResp.json()
        const session = sessionData?.session || {}
        setPanelSession({
          role: session.role || '',
          name: session.name || '',
          email: session.email || '',
        })
        localStorage.setItem('adminRole', session.role || '')
        localStorage.setItem('adminName', session.name || '')
        localStorage.setItem('adminEmail', session.email || '')
      } catch (err) {
        if (err.message === 'AUTH_REQUIRED') {
          clearAdminSession()
          navigate('/admin/login', { replace: true })
          return
        }
        setPanelSession(prev => ({
          role: prev.role || localStorage.getItem('adminRole') || '',
          name: prev.name || localStorage.getItem('adminName') || '',
          email: prev.email || localStorage.getItem('adminEmail') || '',
        }))
      }

      try {
        const [productsResp, settingsResp, homeResp] = await Promise.all([
          fetchAdmin('/api/admin/products'),
          fetchAdmin('/api/admin/settings'),
          fetch(apiUrl('/api/site/home')),
        ])
        const [productsData, settingsData, homeData] = await Promise.all([
          productsResp.json(),
          settingsResp.json(),
          homeResp.json(),
        ])
        setProducts(dedupeById(Array.isArray(productsData) ? productsData : []))
        setSettings({
          minStock: Number(settingsData.minStock) || 2,
          adminEmail: settingsData.adminEmail || '',
          adminPassword: settingsData.adminPassword || '',
          adminName: settingsData.adminName || '',
          companyName: settingsData.companyName || '',
          companyAddress: settingsData.companyAddress || '',
          companyCity: settingsData.companyCity || '',
          companyPhone: settingsData.companyPhone || '',
          companyEmail: settingsData.companyEmail || '',
          companyCuit: settingsData.companyCuit || '',
          companyLogo: settingsData.companyLogo || '',
        })
        setHomeCfg(homeData)
      } catch (err) {
        if (err.message === 'AUTH_REQUIRED') {
          clearAdminSession()
          navigate('/admin/login', { replace: true })
          return
        }
      }
      refreshLegacyPromotionOverrides().catch(() => {
        setLegacyPromotionOverrides(readStoredLegacyPromotionOverrides())
      })

      if (canAccessSales) {
        fetchAdmin('/api/admin/stats')
          .then(r => r.json())
          .then(setStats)
          .catch(() => setStats({ totalProducts: 0, totalInventory: 0, totalSales: 0, revenue: 0 }))
        fetchAdmin('/api/admin/sales/log')
          .then(r => r.json())
          .then(data => setSalesLog(Array.isArray(data) ? data : []))
          .catch(() => setSalesLog([]))
        fetchAdmin('/api/admin/orders')
          .then(r => r.json())
          .then(data => setOrders(Array.isArray(data) ? data : []))
          .catch(() => setOrders([]))
      } else {
        setStats({ totalProducts: 0, totalInventory: 0, totalSales: 0, revenue: 0 })
        setSalesLog([])
        setOrders([])
      }

      if (isAdmin) {
        fetchAdmin('/api/admin/users')
          .then(r => r.json())
          .then(data => setUsers(Array.isArray(data) ? data : []))
          .catch(() => setUsers([]))
        fetchAdmin('/api/admin/suppliers')
          .then(r => r.json())
          .then(data => setSuppliers(Array.isArray(data) ? data : []))
          .catch(() => setSuppliers([]))
        fetchAdmin('/api/admin/contact-messages')
          .then(r => r.json())
          .then(data => setContactMessages(Array.isArray(data) ? data : []))
          .catch(() => setContactMessages([]))
      } else {
        setUsers([])
        setSuppliers([])
        setContactMessages([])
      }

      if (canManagePromotions) {
        fetchAdmin('/api/admin/promotions')
          .then(r => r.json())
          .then(data => setPromotions(dedupeById(Array.isArray(data) ? data : [])))
          .catch(() => setPromotions([]))
        refreshLegacyPromotionOverrides().catch(() => {
          setLegacyPromotionOverrides(readStoredLegacyPromotionOverrides())
        })
      } else {
        setPromotions([])
        setLegacyPromotionOverrides([])
      }
    }

    loadPanel()
  }, [navigate, token, panelSession.role])

  useEffect(() => {
    if (activeTab !== 'dashboard') return
    if (!canAccessSales) return
    fetchAdmin(`/api/admin/sales/series?range=${encodeURIComponent(salesSeriesRange)}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.ok && Array.isArray(data.series)) setSalesSeries(data.series)
      })
      .catch(() => void 0)
  }, [activeTab, salesSeriesRange, canAccessSales])

  useEffect(() => {
    if (activeTab !== 'clients' || !isAdmin) return
    refreshUsers().catch(() => setUsers([]))
  }, [activeTab, isAdmin])

  useEffect(() => {
    if (activeTab !== 'suppliers' || !isAdmin) return
    refreshSuppliers().catch(() => setSuppliers([]))
  }, [activeTab, isAdmin])

  useEffect(() => {
    if (activeTab !== 'orders' || !canAccessOrders) return
    refreshOrders().catch(() => setOrders([]))
  }, [activeTab, canAccessOrders])

  useEffect(() => {
    if (activeTab !== 'order-returns' || !canAccessOrders) return
    refreshOrders().catch(() => void 0)
    refreshOrderReturns().catch(() => setOrderReturns([]))
  }, [activeTab, canAccessOrders])

  useEffect(() => {
    if (activeTab !== 'messages' || !canAccessMessages) return
    refreshMessages().catch(() => setContactMessages([]))
  }, [activeTab, canAccessMessages])

  useEffect(() => {
    if (activeTab !== 'messages' || !canAccessMessages) return
    const list = Array.isArray(contactMessages) ? contactMessages : []
    if (list.length === 0) {
      if (selectedContactMessageId != null) setSelectedContactMessageId(null)
      if (contactReplyDraft) setContactReplyDraft('')
      return
    }
    const hasSelected = selectedContactMessageId != null && list.some(m => String(m.id) === String(selectedContactMessageId))
    if (!hasSelected) setSelectedContactMessageId(list[0].id)
  }, [activeTab, canAccessMessages, contactMessages, selectedContactMessageId, contactReplyDraft])

  useEffect(() => {
    if (activeTab !== 'messages' || !canAccessMessages) return
    const list = Array.isArray(contactMessages) ? contactMessages : []
    const selected = list.find(m => String(m.id) === String(selectedContactMessageId))
    const nextDraft = selected?.reply ? String(selected.reply) : ''
    if (String(contactReplyDraft) !== String(nextDraft)) setContactReplyDraft(nextDraft)
  }, [activeTab, canAccessMessages, contactMessages, selectedContactMessageId])

  useEffect(() => {
    if (activeTab !== 'promotions' || !canManagePromotions) return
    refreshPromotions().catch(() => setPromotions([]))
  }, [activeTab, canManagePromotions])

  useEffect(() => {
    if (activeTab !== 'inventory') return
    if (!(isAdmin || isStock)) return
    refreshReturns().catch(() => setReturnsLog([]))
  }, [activeTab, isAdmin, isStock])

  useEffect(() => {
    if (!adminTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(adminTabs[0]?.id || 'dashboard')
    }
  }, [activeTab, panelSession.role])

  const createOrder = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    const qty = parseInt(newOrder.quantity, 10)
    const name = (newOrder.productName||'').trim()
    if (!newOrder.customer || !name || Number.isNaN(qty) || qty <= 0) { notify('Datos de pedido inválidos', 'warning'); return }
    const match = products.find(p => (p.name||'').toLowerCase() === name.toLowerCase())
    const items = [{ id: match?.id ?? null, name, qty, price: match?.price ?? 0 }]
    const resp = await fetch(apiUrl('/api/admin/orders'), { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ customer: newOrder.customer, items }) })
    const data = await resp.json()
    if (!resp.ok || !data.ok) { notify(data.error || 'Error al crear pedido', 'error'); return }
    const list = await fetch(apiUrl('/api/admin/orders'), { headers: { Authorization: `Bearer ${token}` } }); setOrders(await list.json())
    setNewOrder({ customer: '', productName: '', quantity: '1' })
  }

  const registerSaleByName = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    const q = parseInt(orderSale.quantity, 10)
    const name = (orderSale.name||'').trim()
    if (!name || Number.isNaN(q) || q <= 0) { notify('Datos inválidos', 'warning'); return }
    const match = products.find(p => (p.name||'').toLowerCase() === name.toLowerCase())
    if (!match) { notify('Producto no encontrado', 'warning'); return }
    const ok = await registerSale(match.id, String(q))
    if (ok) {
      setOrderSale({ name: '', quantity: '1' })
    }
  }

  const updateOrderStatus = async (id, status) => {
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    const resp = await fetch(apiUrl(`/api/admin/orders/${id}/status`), { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) })
    const data = await resp.json()
    if (!resp.ok || !data.ok) { notify(data.error || 'Error al actualizar estado', 'error'); return }
    const list = await fetch(apiUrl('/api/admin/orders'), { headers: { Authorization: `Bearer ${token}` } }); setOrders(await list.json())
  }

  const createOrderReturnRequest = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    const orderId = orderReturnDraft.orderId
    const orderItemId = orderReturnDraft.orderItemId
    const qty = Number(orderReturnDraft.qty)
    if (!orderId || !orderItemId || !Number.isFinite(qty) || qty <= 0) {
      notify('Completá pedido, item y cantidad', 'warning')
      return
    }
    try {
      setIsCreatingOrderReturn(true)
      const resp = await fetch(apiUrl('/api/admin/order-returns'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orderId: Number(orderId),
          orderItemId: Number(orderItemId),
          qty: Number(qty),
          reason: (orderReturnDraft.reason || '').trim() || undefined,
        }),
      })
      const data = await resp.json()
      if (!resp.ok || !data.ok) {
        notify(data.error || 'Error al crear devolución', 'error')
        return
      }
      notify('Devolución solicitada', 'success')
      await refreshOrderReturns()
      setOrderReturnDraft({ orderId: '', orderItemId: '', qty: '1', reason: '' })
    } catch (err) {
      console.error(err)
      notify('Error de red al conectar con el backend', 'error')
    } finally {
      setIsCreatingOrderReturn(false)
    }
  }

  const updateOrderReturnStatus = async (id, status) => {
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    const resp = await fetch(apiUrl(`/api/admin/order-returns/${id}/status`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    })
    const data = await resp.json()
    if (!resp.ok || !data.ok) {
      notify(data.error || 'Error al actualizar devolución', 'error')
      return
    }
    await refreshOrderReturns()
  }

  const updateShipmentForm = (id, field, value) => {
    setShipmentForms(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }))
  }

  const createShipmentForOrder = async (id) => {
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    const f = shipmentForms[id] || {}
    if (!f.recipient || !f.address || !f.province || !f.postalCode) { notify('Complete datos de envío', 'warning'); return }
    try {
      const resp = await fetch(apiUrl('/api/shipping/correo-argentino/create-shipment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: id, recipient: f.recipient, address: f.address, province: f.province, postalCode: f.postalCode })
      })
      const data = await resp.json()
      if (!resp.ok || !data.ok) { notify(data.error || 'Error al crear envío', 'error'); return }
      const list = await fetch(apiUrl('/api/admin/orders'), { headers: { Authorization: `Bearer ${token}` } }); setOrders(await list.json())
      notify(`Envío creado. Tracking: ${data.tracking}`, 'success')
    } catch (err) {
      console.error(err)
      notify('Error de red al crear envío', 'error')
    }
  }

  const addSupplier = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    if (!newSupplier.name) { notify('Nombre requerido', 'warning'); return }
    const resp = await fetch(apiUrl('/api/admin/suppliers'), { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(newSupplier) })
    const data = await resp.json()
    if (!resp.ok || !data.ok) { notify(data.error || 'Error al crear proveedor', 'error'); return }
    const list = await fetch(apiUrl('/api/admin/suppliers'), { headers: { Authorization: `Bearer ${token}` } }); setSuppliers(await list.json())
    setNewSupplier({ name: '', contact: '', email: '', phone: '', notes: '' })
    notify('Proveedor creado', 'success')
  }

  const startEditSupplier = (s) => {
    if (!isAdmin) return
    setEditingSupplierId(s.id)
    setEditSupplierFields({ name: s.name, contact: s.contact || '', email: s.email || '', phone: s.phone || '', notes: s.notes || '' })
  }

  const saveEditSupplier = async () => {
    if (!isAdmin) { notify('No tenés permisos para editar proveedores', 'warning'); return }
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    const resp = await fetch(apiUrl(`/api/admin/suppliers/${editingSupplierId}`), { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(editSupplierFields) })
    const data = await resp.json()
    if (!resp.ok || !data.ok) { notify(data.error || 'Error al guardar proveedor', 'error'); return }
    const list = await fetch(apiUrl('/api/admin/suppliers'), { headers: { Authorization: `Bearer ${token}` } }); setSuppliers(await list.json())
    setEditingSupplierId(null)
    notify('Proveedor actualizado', 'success')
  }

  const deleteSupplier = async (id) => {
    if (!isAdmin) { notify('No tenés permisos para eliminar proveedores', 'warning'); return }
    if (!confirm('¿Eliminar este proveedor?')) return
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    const resp = await fetch(apiUrl(`/api/admin/suppliers/${id}`), { method:'DELETE', headers:{ Authorization: `Bearer ${token}` } })
    const data = await resp.json()
    if (!resp.ok || !data.ok) { notify(data.error || 'Error al eliminar proveedor', 'error'); return }
    const list = await fetch(apiUrl('/api/admin/suppliers'), { headers: { Authorization: `Bearer ${token}` } }); setSuppliers(await list.json())
    notify('Proveedor eliminado', 'success')
  }

  const addClient = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    if (!newClient.name || !newClient.email || !newClient.password) { notify('Nombre, email y contraseña requeridos', 'warning'); return }
    const resp = await fetch(apiUrl('/api/admin/users'), { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(newClient) })
    const data = await resp.json()
    if (!resp.ok || !data.ok) { notify(data.error || 'Error al crear usuario', 'error'); return }
    await refreshUsers()
    setNewClient({ name: '', email: '', password: '', is_verified: false, role: 'vendedor' })
    notify('Usuario creado', 'success')
  }

  const startEditClient = (c) => {
    setEditingClientId(c.id || c.email)
    setEditClientFields({ name: c.name, email: c.email, password: '', is_verified: !!c.is_verified, role: c.role || 'client' })
  }

  const saveEditClient = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    const resp = await fetch(apiUrl(`/api/admin/users/${editingClientId}`), { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(editClientFields) })
    const data = await resp.json()
    if (!resp.ok || !data.ok) { notify(data.error || 'Error al guardar usuario', 'error'); return }
    await refreshUsers()
    setEditingClientId(null)
    setEditClientFields({ name: '', email: '', password: '', is_verified: false, role: 'vendedor' })
    notify('Usuario actualizado', 'success')
  }

  const deleteClient = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    const resp = await fetch(apiUrl(`/api/admin/users/${id}`), { method:'DELETE', headers:{ Authorization: `Bearer ${token}` } })
    const data = await resp.json()
    if (!resp.ok || !data.ok) { notify(data.error || 'Error al eliminar usuario', 'error'); return }
    await refreshUsers()
    notify('Usuario eliminado', 'success')
  }

  const saveSettings = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    const resp = await fetch(apiUrl('/api/admin/settings'), { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(settings) })
    const data = await resp.json()
    if (!resp.ok || !data.ok) { notify(data.error || 'Error al guardar configuración', 'error'); return }
    setSettings(data.settings || settings)
    notify('Configuración guardada', 'success')
  }

  const onCompanyLogoChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      setSettings(v => ({ ...v, companyLogo: String(result || '') }))
    }
    reader.readAsDataURL(file)
  }

  const loadReports = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    try {
      setReportLoading(true)
      const params = new URLSearchParams()
      if (reportRange.from) params.set('from', reportRange.from)
      if (reportRange.to) params.set('to', reportRange.to)
      params.set('threshold', String(settings.minStock || 2))
      const resp = await fetch(apiUrl(`/api/admin/reports/products?${params.toString()}`), { headers: { Authorization: `Bearer ${token}` } })
      const data = await resp.json()
      if (!resp.ok || !data.ok) { notify(data.error || 'Error al cargar reportes', 'error'); return }
      setReportData({ sold: data.sold || [], faltantes: data.faltantes || [], threshold: Number(data.threshold) || (settings.minStock || 2), company: data.company || null })
    } catch {
      notify('Error de red al cargar reportes', 'error')
    } finally {
      setReportLoading(false)
    }
  }

  const _printProductsReport = () => {
    const company = reportData.company || {
      companyName: settings.companyName || 'JJ Indumentaria',
      companyAddress: settings.companyAddress || '',
      companyCity: settings.companyCity || '',
      companyPhone: settings.companyPhone || '',
      companyEmail: settings.companyEmail || '',
      companyCuit: settings.companyCuit || '',
      companyLogo: settings.companyLogo || '',
    }

    const now = new Date()
    const fmtMoney = (n) => Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })
    const esc = (s) => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')

    const soldRows = (reportData.sold || []).map((r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${esc(r.name)}</td>
        <td class="num">${Number(r.sold || 0)}</td>
        <td class="num">ARS ${fmtMoney(r.revenue)}</td>
      </tr>
    `).join('')

    const faltantesRows = (reportData.faltantes || []).map((r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${esc(r.name)}</td>
        <td>${esc(r.category || '')}</td>
        <td class="num">${Number(r.quantity || 0)}</td>
        <td class="num">ARS ${fmtMoney(r.price)}</td>
      </tr>
    `).join('')

    const rangeText = (() => {
      const parts = []
      if (reportRange.from) parts.push(`Desde: ${esc(reportRange.from)}`)
      if (reportRange.to) parts.push(`Hasta: ${esc(reportRange.to)}`)
      if (!parts.length) return 'Rango: Todo'
      return parts.join(' · ')
    })()

    const html = `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Reporte - Productos</title>
          <style>
            @page { size: A4; margin: 18mm 14mm; }
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; color: #111827; }
            .header { display: flex; gap: 14px; align-items: center; padding-bottom: 12px; border-bottom: 2px solid #111827; }
            .logo { width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; background: #fff; }
            .logo img { width: 100%; height: 100%; object-fit: cover; }
            .brand { flex: 1; }
            .brand h1 { font-size: 18px; margin: 0; letter-spacing: 0.08em; text-transform: uppercase; }
            .brand .meta { margin-top: 6px; font-size: 11px; color: #374151; line-height: 1.35; }
            .doc { text-align: right; }
            .doc .title { font-size: 14px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin: 0; }
            .doc .sub { margin-top: 6px; font-size: 11px; color: #374151; }
            .section { margin-top: 18px; }
            .section h2 { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; margin: 0 0 10px 0; color: #111827; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px 8px; vertical-align: top; }
            th { background: #f9fafb; text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; text-align: left; }
            td.num { text-align: right; font-variant-numeric: tabular-nums; }
            .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280; display: flex; justify-content: space-between; gap: 10px; }
            .muted { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              ${company.companyLogo ? `<img src="${esc(company.companyLogo)}" alt="Logo" />` : `<div style="font-weight:800;color:#1E3A8A;">JJ</div>`}
            </div>
            <div class="brand">
              <h1>${esc(company.companyName || 'JJ Indumentaria')}</h1>
              <div class="meta">
                ${esc(company.companyAddress || '')}${company.companyAddress && company.companyCity ? ' · ' : ''}${esc(company.companyCity || '')}<br />
                ${company.companyPhone ? `Tel: ${esc(company.companyPhone)} · ` : ''}${company.companyEmail ? `Email: ${esc(company.companyEmail)}` : ''}<br />
                ${company.companyCuit ? `CUIT: ${esc(company.companyCuit)}` : ''}
              </div>
            </div>
            <div class="doc">
              <p class="title">Reporte de Productos</p>
              <div class="sub">
                ${rangeText}<br />
                Emitido: ${esc(now.toLocaleString('es-AR'))}
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Productos Vendidos</h2>
            <table>
              <thead>
                <tr>
                  <th style="width:44px;">#</th>
                  <th>Producto</th>
                  <th style="width:110px;">Unidades</th>
                  <th style="width:140px;">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                ${soldRows || `<tr><td colspan="4" class="muted">Sin ventas registradas en el rango.</td></tr>`}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Productos Faltantes (Stock ≤ ${Number(reportData.threshold || (settings.minStock || 2))})</h2>
            <table>
              <thead>
                <tr>
                  <th style="width:44px;">#</th>
                  <th>Producto</th>
                  <th style="width:140px;">Categoría</th>
                  <th style="width:110px;">Stock</th>
                  <th style="width:140px;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${faltantesRows || `<tr><td colspan="5" class="muted">Sin productos faltantes en el rango de stock.</td></tr>`}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <div>Documento generado desde el Panel Admin</div>
            <div class="muted">JJ Indumentaria</div>
          </div>
        </body>
      </html>
    `

    const w = window.open('', '_blank')
    if (!w) {
      notify('Bloqueo de popups: habilitá ventanas emergentes para imprimir', 'warning')
      return
    }
    w.document.open()
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 250)
  }

  const printSalesReport = () => {
    const company = reportData.company || {
      companyName: settings.companyName || 'JJ Indumentaria',
      companyAddress: settings.companyAddress || '',
      companyCity: settings.companyCity || '',
      companyPhone: settings.companyPhone || '',
      companyEmail: settings.companyEmail || '',
      companyCuit: settings.companyCuit || '',
      companyLogo: settings.companyLogo || '',
    }

    const now = new Date()
    const fmtMoney = (n) => Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })
    const esc = (s) => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')

    const rangeText = (() => {
      const parts = []
      if (reportRange.from) parts.push(`Desde: ${esc(reportRange.from)}`)
      if (reportRange.to) parts.push(`Hasta: ${esc(reportRange.to)}`)
      if (!parts.length) return 'Rango: Todo'
      return parts.join(' · ')
    })()

    const soldRows = (reportData.sold || []).map((r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${esc(r.name)}</td>
        <td class="num">${Number(r.sold || 0)}</td>
        <td class="num">ARS ${fmtMoney(r.revenue)}</td>
      </tr>
    `).join('')

    const totalUnits = (reportData.sold || []).reduce((acc, r) => acc + (Number(r.sold) || 0), 0)
    const totalRevenue = (reportData.sold || []).reduce((acc, r) => acc + (Number(r.revenue) || 0), 0)

    const html = `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Reporte - Ventas</title>
          <style>
            @page { size: A4; margin: 18mm 14mm; }
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; color: #111827; }
            .header { display: flex; gap: 14px; align-items: center; padding-bottom: 12px; border-bottom: 2px solid #111827; }
            .logo { width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; background: #fff; }
            .logo img { width: 100%; height: 100%; object-fit: cover; }
            .brand { flex: 1; }
            .brand h1 { font-size: 18px; margin: 0; letter-spacing: 0.08em; text-transform: uppercase; }
            .brand .meta { margin-top: 6px; font-size: 11px; color: #374151; line-height: 1.35; }
            .doc { text-align: right; }
            .doc .title { font-size: 14px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin: 0; }
            .doc .sub { margin-top: 6px; font-size: 11px; color: #374151; }
            .section { margin-top: 18px; }
            .section h2 { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; margin: 0 0 10px 0; color: #111827; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px 8px; vertical-align: top; }
            th { background: #f9fafb; text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; text-align: left; }
            td.num { text-align: right; font-variant-numeric: tabular-nums; }
            .summary { display: flex; justify-content: space-between; gap: 10px; font-size: 11px; margin-top: 10px; }
            .summary .k { color: #374151; }
            .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280; display: flex; justify-content: space-between; gap: 10px; }
            .muted { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              ${company.companyLogo ? `<img src="${esc(company.companyLogo)}" alt="Logo" />` : `<div style="font-weight:800;color:#1E3A8A;">JJ</div>`}
            </div>
            <div class="brand">
              <h1>${esc(company.companyName || 'JJ Indumentaria')}</h1>
              <div class="meta">
                ${esc(company.companyAddress || '')}${company.companyAddress && company.companyCity ? ' · ' : ''}${esc(company.companyCity || '')}<br />
                ${company.companyPhone ? `Tel: ${esc(company.companyPhone)} · ` : ''}${company.companyEmail ? `Email: ${esc(company.companyEmail)}` : ''}<br />
                ${company.companyCuit ? `CUIT: ${esc(company.companyCuit)}` : ''}
              </div>
            </div>
            <div class="doc">
              <p class="title">Reporte de Ventas</p>
              <div class="sub">
                ${rangeText}<br />
                Emitido: ${esc(now.toLocaleString('es-AR'))}
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Ventas por Producto</h2>
            <table>
              <thead>
                <tr>
                  <th style="width:44px;">#</th>
                  <th>Producto</th>
                  <th style="width:110px;">Unidades</th>
                  <th style="width:140px;">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                ${soldRows || `<tr><td colspan="4" class="muted">Sin ventas registradas en el rango.</td></tr>`}
              </tbody>
            </table>
            <div class="summary">
              <div><span class="k">Unidades totales:</span> <strong>${Number(totalUnits || 0)}</strong></div>
              <div><span class="k">Ingresos totales:</span> <strong>ARS ${fmtMoney(totalRevenue)}</strong></div>
            </div>
          </div>

          <div class="footer">
            <div>Documento generado desde el Panel Admin</div>
            <div class="muted">JJ Indumentaria</div>
          </div>
        </body>
      </html>
    `

    const w = window.open('', '_blank')
    if (!w) {
      notify('Bloqueo de popups: habilitá ventanas emergentes para imprimir', 'warning')
      return
    }
    w.document.open()
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 250)
  }

  const printStockReport = () => {
    const company = reportData.company || {
      companyName: settings.companyName || 'JJ Indumentaria',
      companyAddress: settings.companyAddress || '',
      companyCity: settings.companyCity || '',
      companyPhone: settings.companyPhone || '',
      companyEmail: settings.companyEmail || '',
      companyCuit: settings.companyCuit || '',
      companyLogo: settings.companyLogo || '',
    }

    const now = new Date()
    const esc = (s) => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
    const threshold = Number(reportData.threshold || (settings.minStock || 2)) || 0

    const faltantesRows = (reportData.faltantes || []).map((r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${esc(r.name)}</td>
        <td>${esc(r.category || '')}</td>
        <td class="num">${Number(r.quantity || 0)}</td>
      </tr>
    `).join('')

    const inventoryRows = (products || [])
      .slice()
      .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
      .map((p, idx) => {
        const qty = Number(p?.quantity || 0)
        const status = qty <= 0 ? 'Sin stock' : (qty <= threshold ? 'Stock bajo' : 'OK')
        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${esc(p?.name || '')}</td>
            <td>${esc(p?.category || '')}</td>
            <td class="num">${qty}</td>
            <td>${status}</td>
          </tr>
        `
      })
      .join('')

    const html = `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Reporte - Stock</title>
          <style>
            @page { size: A4; margin: 18mm 14mm; }
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; color: #111827; }
            .header { display: flex; gap: 14px; align-items: center; padding-bottom: 12px; border-bottom: 2px solid #111827; }
            .logo { width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; background: #fff; }
            .logo img { width: 100%; height: 100%; object-fit: cover; }
            .brand { flex: 1; }
            .brand h1 { font-size: 18px; margin: 0; letter-spacing: 0.08em; text-transform: uppercase; }
            .brand .meta { margin-top: 6px; font-size: 11px; color: #374151; line-height: 1.35; }
            .doc { text-align: right; }
            .doc .title { font-size: 14px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin: 0; }
            .doc .sub { margin-top: 6px; font-size: 11px; color: #374151; }
            .section { margin-top: 18px; }
            .section h2 { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; margin: 0 0 10px 0; color: #111827; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px 8px; vertical-align: top; }
            th { background: #f9fafb; text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; text-align: left; }
            td.num { text-align: right; font-variant-numeric: tabular-nums; }
            .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280; display: flex; justify-content: space-between; gap: 10px; }
            .muted { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              ${company.companyLogo ? `<img src="${esc(company.companyLogo)}" alt="Logo" />` : `<div style="font-weight:800;color:#1E3A8A;">JJ</div>`}
            </div>
            <div class="brand">
              <h1>${esc(company.companyName || 'JJ Indumentaria')}</h1>
              <div class="meta">
                ${esc(company.companyAddress || '')}${company.companyAddress && company.companyCity ? ' · ' : ''}${esc(company.companyCity || '')}<br />
                ${company.companyPhone ? `Tel: ${esc(company.companyPhone)} · ` : ''}${company.companyEmail ? `Email: ${esc(company.companyEmail)}` : ''}<br />
                ${company.companyCuit ? `CUIT: ${esc(company.companyCuit)}` : ''}
              </div>
            </div>
            <div class="doc">
              <p class="title">Reporte de Stock</p>
              <div class="sub">
                Umbral stock bajo: ≤ ${Number(threshold)}<br />
                Emitido: ${esc(now.toLocaleString('es-AR'))}
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Faltantes (Stock ≤ ${Number(threshold)})</h2>
            <table>
              <thead>
                <tr>
                  <th style="width:44px;">#</th>
                  <th>Producto</th>
                  <th style="width:160px;">Categoría</th>
                  <th style="width:110px;">Stock</th>
                </tr>
              </thead>
              <tbody>
                ${faltantesRows || `<tr><td colspan="4" class="muted">Sin faltantes para el umbral seleccionado.</td></tr>`}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Inventario (Total)</h2>
            <table>
              <thead>
                <tr>
                  <th style="width:44px;">#</th>
                  <th>Producto</th>
                  <th style="width:160px;">Categoría</th>
                  <th style="width:110px;">Stock</th>
                  <th style="width:120px;">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${inventoryRows || `<tr><td colspan="5" class="muted">Sin productos cargados.</td></tr>`}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <div>Documento generado desde el Panel Admin</div>
            <div class="muted">JJ Indumentaria</div>
          </div>
        </body>
      </html>
    `

    const w = window.open('', '_blank')
    if (!w) {
      notify('Bloqueo de popups: habilitá ventanas emergentes para imprimir', 'warning')
      return
    }
    w.document.open()
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 250)
  }

  const onFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result // data URL
      setPreview(result)
      // Mantener como base64 data URL completo para mostrar y enviar
      setImageBase64(String(result))
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('adminToken')
    if (!token) {
      notify('Sesión de admin no encontrada', 'error')
      navigate('/admin/login')
      return
    }
    const payload = {
      name: (name || '').trim(),
      price: Number(price),
      category: (category || '').trim(),
      supplier_id: supplierId ? Number(supplierId) : null,
      imageBase64: imageBase64,
      quantity: Number(quantity) || 0,
    }
    try {
      const resp = await fetch(apiUrl('/api/admin/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await resp.json()
      if (!resp.ok || !data.ok) {
        notify(data.error || 'Error al crear producto', 'error')
        return
      }
      notify('Producto creado', 'success')
      await refreshProducts()
      if (canAccessSales) {
        await Promise.all([refreshStats(), refreshSalesLog()])
      }
      if (isAdmin) {
        await refreshUsers()
      }
      // Reset
      setName('')
      setPrice('')
      setCategory('')
      setProductColors('')
      setProductSizes('')
      setSupplierId('')
      setImageBase64('')
      setPreview('')
      setQuantity('')
      setShowCreateProductModal(false)
    } catch (err) {
      console.error(err)
      notify('Error de red al conectar con el backend', 'error')
    }
  }

  const createProductFromStockPanel = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('adminToken')
    if (!token) {
      notify('Sesión de admin no encontrada', 'error')
      navigate('/admin/login')
      return
    }
    const payload = {
      name: (name || '').trim(),
      price: Number(price),
      category: (category || '').trim(),
      colors: (productColors || '').trim(),
      sizes: (productSizes || '').trim(),
      supplier_id: supplierId ? Number(supplierId) : null,
      imageBase64: imageBase64 ? imageBase64 : undefined,
      quantity: Number(quantity) || 0,
    }
    if (!payload.name || !Number.isFinite(payload.price)) {
      notify('Completá nombre y precio', 'warning')
      return
    }
    try {
      setIsCreatingStockProduct(true)
      const resp = await fetch(apiUrl('/api/admin/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await resp.json()
      if (!resp.ok || !data.ok) {
        notify(data.error || 'Error al cargar producto', 'error')
        return
      }
      notify('Producto cargado', 'success')
      await refreshProducts()
      setName('')
      setPrice('')
      setCategory('')
      setProductColors('')
      setProductSizes('')
      setSupplierId('')
      setImageBase64('')
      setPreview('')
      setQuantity('')
    } catch (err) {
      console.error(err)
      notify('Error de red al conectar con el backend', 'error')
    } finally {
      setIsCreatingStockProduct(false)
    }
  }

  const registerReturn = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('adminToken')
    if (!token) {
      notify('Sesión de admin no encontrada', 'error')
      navigate('/admin/login')
      return
    }
    const productName = String(returnDraft.productName || '').trim()
    const q = Number(returnDraft.qty)
    if (!productName || !q || q <= 0) {
      notify('Completá el nombre del producto y una cantidad válida', 'warning')
      return
    }
    try {
      setIsRegisteringReturn(true)
      const resp = await fetch(apiUrl('/api/admin/returns'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productName: productName || undefined,
          qty: q,
          orderId: (returnDraft.orderId || '').trim() || undefined,
          reason: (returnDraft.reason || '').trim() || undefined,
        }),
      })
      const data = await resp.json()
      if (!resp.ok || !data.ok) {
        notify(data.error || 'Error al registrar devolución', 'error')
        return
      }
      notify('Devolución registrada', 'success')
      await Promise.all([refreshProducts(), refreshReturns()])
      setReturnDraft({ productName: '', qty: '1', orderId: '', reason: '' })
    } catch (err) {
      console.error(err)
      notify('Error de red al conectar con el backend', 'error')
    } finally {
      setIsRegisteringReturn(false)
    }
  }

  const startEdit = (p) => {
    setEditingId(p.id)
    setEditFields({ name: p.name, price: String(p.price ?? ''), category: p.category ?? '', quantity: String(p.quantity ?? ''), imageBase64: '', supplier_id: String(p.supplier_id || '') })
    setPreview(p.image)
  }

  const onEditFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      setPreview(String(result))
      setEditFields(prev => ({ ...prev, imageBase64: String(result) }))
    }
    reader.readAsDataURL(file)
  }

  const saveEdit = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    const payload = {
      name: editFields.name.trim(),
      price: Number(editFields.price),
      category: editFields.category.trim(),
      quantity: Number(editFields.quantity) || 0,
      supplier_id: editFields.supplier_id ? Number(editFields.supplier_id) : null,
      imageBase64: editFields.imageBase64 || undefined,
    }
    try {
      const resp = await fetch(apiUrl(`/api/admin/products/${editingId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await resp.json()
      if (!resp.ok || !data.ok) { notify(data.error || 'Error al guardar', 'error'); return }
      await refreshProducts()
      if (canAccessSales) {
        await Promise.all([refreshStats(), refreshSalesLog()])
      }
      setEditingId(null)
      setPreview('')
      setEditFields({ name: '', price: '', category: '', quantity: '', imageBase64: '', supplier_id: '' })
    } catch (err) {
      console.error(err)
      notify('Error de red al conectar con el backend', 'error')
    }
  }

  const deleteProduct = async (id) => {
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    if (!confirm('¿Eliminar este producto?')) return
    try {
      const resp = await fetch(apiUrl(`/api/admin/products/${id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      const data = await resp.json()
      if (!resp.ok || !data.ok) { notify(data.error || 'Error al eliminar', 'error'); return }
      await refreshProducts()
      if (canAccessSales) {
        await Promise.all([refreshStats(), refreshSalesLog()])
      }
    } catch (err) {
      console.error(err)
      notify('Error de red al conectar con el backend', 'error')
    }
  }

  const registerSale = async (productId, qtyStr, productName, unitPrice) => {
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return false }
    const q = Number(qtyStr)
    if ((!productId && !productName) || !q || q <= 0) { notify('Datos inválidos', 'warning'); return false }
    try {
      setIsRegisteringSale(true)
      const resp = await fetch(apiUrl('/api/admin/sales'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: productId ? Number(productId) : undefined, productName: productName || undefined, quantity: q, price: unitPrice != null && !Number.isNaN(Number(unitPrice)) ? Number(unitPrice) : undefined })
      })
      const data = await resp.json()
      if (!resp.ok || !data.ok) {
        const extra = data && data.available != null ? ` (Disponible: ${Number(data.available) || 0})` : ''
        notify((data?.error || 'Error al registrar la venta') + extra, 'error')
        return false
      }
      await Promise.all([refreshProducts(), refreshStats(), refreshSalesLog()])

      // Actualizar también la serie de ventas para el gráfico
      const serResp = await fetchAdmin(`/api/admin/sales/series?range=${encodeURIComponent(salesSeriesRange)}`)
      const serData = await serResp.json()
      if (serData && serData.ok && Array.isArray(serData.series)) setSalesSeries(serData.series)

      notify('Venta registrada', 'success')
      return true
    } catch (err) {
      console.error(err)
      notify('Error de red al conectar con el backend', 'error')
      return false
    } finally {
      setIsRegisteringSale(false)
    }
  }

  const logout = () => {
    clearAdminSession()
    setPanelSession({ role: '', name: '', email: '' })
    localStorage.removeItem('cart')
    // Vaciar el carrito en el backend si hay una sesión activa de admin
    fetch(apiUrl('/api/cart'), { method: 'DELETE' }).catch(() => void 0)
    navigate('/admin/login', { replace: true })
  }

  const saveHomeCfg = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) { notify('Sesión expirada', 'error'); navigate('/admin/login'); return }
    try {
      const resp = await fetch(apiUrl('/api/admin/site/home'), { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(homeCfg) })
      const data = await resp.json()
      if (!resp.ok || !data.ok) { notify(data.error || 'Error al guardar Inicio', 'error'); return }
      setHomeCfg(data.home || homeCfg)
      notify('Inicio actualizado', 'success')
    } catch {
      notify('Error de red al guardar Inicio', 'error')
    }
  }

  // Carga de imágenes del carrusel desde archivo (data URL base64)
  const onHomeImageFileChange = (i, e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      setHomeCfg(cfg => ({
        ...cfg,
        images: cfg.images.map((x, idx) => (idx === i ? dataUrl : x)),
      }))
    }
    reader.readAsDataURL(file)
  }

  const onHomeImageUrlChange = (i, value) => {
    setHomeCfg(cfg => ({
      ...cfg,
      images: cfg.images.map((x, idx) => (idx === i ? value : x)),
    }))
  }

  const onPromoFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      setPromoPreview(String(result))
      setPromoImageBase64(String(result))
    }
    reader.readAsDataURL(file)
  }

  const clearProductDraft = () => {
    setName('')
    setPrice('')
    setCategory('')
    setProductColors('')
    setProductSizes('')
    setSupplierId('')
    setImageBase64('')
    setPreview('')
    setQuantity('')
    setShowCreateProductModal(false)
  }

  const clearPromotionDraft = () => {
    setShowPromotionModal(false)
    setPromoProductId('')
    setPromoTitle('')
    setPromoDesc('')
    setPromoPrice('')
    setPromoStockPromocion(PROMO_TEMPLATE_MIN_STOCK)
    setPromoSizes('')
    setPromoImageBase64('')
    setPromoPreview('')
    setPromoFechaInicio('')
    setPromoFechaFin('')
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return
      clearProductDraft()
      clearPromotionDraft()
      setPromotionDetail(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const createPromotion = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('adminToken')
    if (!token) { notify('Sesión expirada', 'error'); navigate('/admin/login'); return }
    const payload = {
      productId: promoProductId === '' ? null : Number(promoProductId),
      title: (promoTitle||'').trim(),
      description: (promoDesc||'').trim(),
      imageBase64: promoImageBase64,
      price: promoPrice === '' ? null : Number(promoPrice),
      sizes: (promoSizes||'').trim() || null,
      stockPromocion: promoStockPromocion === '' ? null : Number(promoStockPromocion),
      fechaInicio: promoFechaInicio || null,
      fechaFin: promoFechaFin || null,
    }
    if (!payload.productId || payload.price == null || payload.stockPromocion == null) {
      notify('Producto, precio promocional y stock promocional son obligatorios', 'warning')
      return
    }
    if (payload.stockPromocion < Number(PROMO_TEMPLATE_MIN_STOCK)) {
      notify(`El stock promocional minimo es ${PROMO_TEMPLATE_MIN_STOCK}`, 'warning')
      return
    }
    try {
      const resp = await fetch(apiUrl('/api/admin/promotions'), { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
      const data = await resp.json()
      if (!resp.ok || !data.ok) { notify(data.error || 'Error al crear promoción', 'error'); return }
      await Promise.all([refreshPromotions(), refreshProducts()])
      clearPromotionDraft()
      notify('Promoción creada', 'success')
    } catch (err) { console.error(err); notify('Error al crear promoción', 'error') }
  }

  const deletePromotion = async (id) => {
    const token = localStorage.getItem('adminToken')
    if (!token) { notify('Sesión expirada', 'error'); navigate('/admin/login'); return }
    try {
      const resp = await fetch(apiUrl(`/api/admin/promotions/${id}`), { method:'DELETE', headers:{ Authorization: `Bearer ${token}` } })
      const data = await resp.json()
      if (!resp.ok || !data.ok) { notify(data.error || 'Error al eliminar promoción', 'error'); return }
      await Promise.all([refreshPromotions(), refreshProducts()])
      if (String(promotionDetail?.id) === String(id)) setPromotionDetail(null)
      notify('Promoción eliminada', 'success')
    } catch (err) { console.error(err); notify('Error al eliminar promoción', 'error') }
  }
  const markPromotionSoldOut = async (promo) => {
    if (!promo?.id) return
    const alreadySoldOut = String(promo.estado || '').toLowerCase() === 'agotada' || Number(promo.stock_promocion_restante ?? promo.stock_promocion ?? 0) <= 0
    if (alreadySoldOut) {
      notify('La promoción ya figura agotada', 'info')
      return
    }
    const token = localStorage.getItem('adminToken')
    if (!token) { notify('Sesión expirada', 'error'); navigate('/admin/login'); return }
    if (!confirm('¿Marcar esta promoción como agotada?')) return
    const payload = {
      estado: 'agotada',
    }
    try {
      const resp = await fetch(apiUrl(`/api/admin/promotions/${promo.id}`), {
        method:'PUT',
        headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await resp.json()
      if (!resp.ok || !data.ok) { notify(data.error || 'Error al marcar la promoción como agotada', 'error'); return }
      await Promise.all([refreshPromotions(), refreshProducts()])
      if (String(promotionDetail?.id) === String(promo.id)) {
        setPromotionDetail(prev => prev ? { ...prev, estado: 'agotada', stock_promocion: 0, stock_promocion_restante: 0 } : prev)
      }
      notify('Promoción marcada como agotada', 'success')
    } catch (err) { console.error(err); notify('Error al actualizar la promoción', 'error') }
  }

  const startPromoEdit = (p) => {
    setPromotionDetail(null)
    setPromoEditingId(p.id)
    setPromoEditFields({
      title: p.title || '',
      description: p.description || '',
      price: p.precio_promocion != null ? String(p.precio_promocion) : '',
      sizes: p.sizes || '',
      stockPromocion: p.stock_promocion != null ? String(p.stock_promocion) : '',
      fechaInicio: p.fecha_inicio ? String(p.fecha_inicio).slice(0, 16) : '',
      fechaFin: p.fecha_fin ? String(p.fecha_fin).slice(0, 16) : '',
      estado: p.estado || 'activa',
      imageBase64: '',
      image: p.image || '',
    })
    setPromoPreview(p.image || '')
  }

  const onEditPromoFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      setPromoPreview(String(result))
      setPromoEditFields(prev => ({ ...prev, imageBase64: String(result) }))
    }
    reader.readAsDataURL(file)
  }

  const savePromoEdit = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) { notify('Sesión expirada', 'error'); navigate('/admin/login'); return }
    const payload = {
      title: (promoEditFields.title||'').trim(),
      description: (promoEditFields.description||'').trim(),
      imageBase64: promoEditFields.imageBase64 || undefined,
      price: promoEditFields.price === '' ? null : Number(promoEditFields.price),
      sizes: (promoEditFields.sizes||'').trim() || null,
      stockPromocion: promoEditFields.stockPromocion === '' ? null : Number(promoEditFields.stockPromocion),
      fechaInicio: promoEditFields.fechaInicio || null,
      fechaFin: promoEditFields.fechaFin || null,
      estado: promoEditFields.estado || null,
    }
    try {
      const resp = await fetch(apiUrl(`/api/admin/promotions/${promoEditingId}`), { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
      const data = await resp.json()
      if (!resp.ok || !data.ok) { notify(data.error || 'Error al guardar promoción', 'error'); return }
      await Promise.all([refreshPromotions(), refreshProducts()])
      setPromoEditingId(null)
      setPromoEditFields({ title: '', description: '', price: '', sizes: '', stockPromocion: '', fechaInicio: '', fechaFin: '', estado: 'activa', imageBase64: '', image: '' })
      setPromoPreview('')
      notify('Promoción actualizada', 'success')
    } catch (err) { console.error(err); notify('Error al guardar promoción', 'error') }
  }

  const lowStockCount = products.filter(p => (p.quantity ?? 0) <= 2).length
  const backendProductMap = new Map(products.map((p) => [Number(p.id), p]))
  const sellerProductsCatalog = publicProductTemplates.map((tpl) => {
    const backend = backendProductMap.get(Number(tpl.id))
    return {
      ...(backend || {}),
      ...tpl,
      id: tpl.id,
      image: tpl.image,
      quantity: backend?.quantity ?? tpl.quantity ?? 0,
    }
  })
  const productCardsCatalog = isSeller ? sellerProductsCatalog : products
  const promotionProductCatalog = isSeller ? sellerProductsCatalog : products
  const selectedPromoProduct = promotionProductCatalog.find(p => String(p.id) === String(promoProductId))
  const selectedEditingPromotion = promotions.find(p => String(p.id) === String(promoEditingId))
  const productPreviewTitle = (name || 'Nuevo producto').trim()
  const productPreviewCategory = (category || 'Sin categoría').trim()
  const productPreviewImage = preview || ''
  const productPreviewPrice = Number(price)
  const productPreviewStock = Number(quantity)
  const productPreviewBadge = productPreviewStock > 0 ? 'ACTIVO' : 'SIN STOCK'
  const productPreviewTone = productPreviewStock > 0 ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
  const promoDateLabel = (from, to) => (
    from || to
      ? `Vigencia ${from ? from.replace('T', ' ') : 'ahora'}${to ? ` al ${to.replace('T', ' ')}` : ''}`
      : 'Sin fechas definidas'
  )
  const promoPreviewTitle = (promoTitle || selectedPromoProduct?.name || 'Vista previa de promoción').trim()
  const promoPreviewImage = promoPreview || getPublicProductImage(selectedPromoProduct) || ''
  const promoPreviewDescription = (promoDesc || selectedPromoProduct?.description || '').trim()
  const promoPreviewSizes = (promoSizes || selectedPromoProduct?.talle || '').trim()
  const promoPreviewNormalPrice = Number(selectedPromoProduct?.price) || 0
  const promoPreviewPromoPrice = Number(promoPrice)
  const promoPreviewStock = Number(promoStockPromocion)
  const promoPreviewBadge = promoPreviewStock > 0 ? 'OFERTA' : 'AGOTADO'
  const promoPreviewDateLabel = promoDateLabel(promoFechaInicio, promoFechaFin)
  const promoEditPreviewTitle = (promoEditFields.title || selectedEditingPromotion?.title || 'Vista previa de promoción').trim()
  const promoEditPreviewImage = promoPreview || promoEditFields.image || selectedEditingPromotion?.image || ''
  const promoEditPreviewDescription = (promoEditFields.description || selectedEditingPromotion?.description || '').trim()
  const promoEditPreviewSizes = (promoEditFields.sizes || selectedEditingPromotion?.sizes || '').trim()
  const promoEditPreviewNormalPrice = Number(selectedEditingPromotion?.precio_normal) || 0
  const promoEditPreviewPromoPrice = Number(promoEditFields.price)
  const promoEditPreviewStock = Number(promoEditFields.stockPromocion)
  const promoEditPreviewState = String(promoEditFields.estado || selectedEditingPromotion?.estado || 'activa').toLowerCase()
  const promoEditPreviewBadge = promoEditPreviewState === 'finalizada'
    ? 'FINALIZADA'
    : (promoEditPreviewState === 'agotada' || promoEditPreviewStock <= 0 ? 'AGOTADO' : 'OFERTA')
  const promoEditPreviewBadgeTone = promoEditPreviewBadge === 'FINALIZADA'
    ? 'bg-gray-800 text-white'
    : (promoEditPreviewBadge === 'AGOTADO' ? 'bg-red-600 text-white' : 'bg-amber-400 text-slate-950')
  const promoEditPreviewDateLabel = promoDateLabel(promoEditFields.fechaInicio, promoEditFields.fechaFin)
  const promotionDetailStatus = promotionDetail ? getPromotionCardStatus(promotionDetail) : null
  const promotionDetailPromoPrice = Number(promotionDetail?.precio_promocion)
  const promotionDetailNormalPrice = Number(promotionDetail?.precio_normal)
  const promotionDetailRemaining = Number(promotionDetail?.stock_promocion_restante ?? promotionDetail?.stock_promocion ?? 0)
  const promotionDetailDate = promotionDetail
    ? promoDateLabel(
        promotionDetail.fecha_inicio ? String(promotionDetail.fecha_inicio).slice(0, 16) : '',
        promotionDetail.fecha_fin ? String(promotionDetail.fecha_fin).slice(0, 16) : '',
      )
    : ''
  const nowTs = Date.now()
  const getPromotionCardStatus = (promo) => {
    const estado = String(promo?.estado || 'activa').toLowerCase()
    const restante = Number(promo?.stock_promocion_restante ?? promo?.stock_promocion ?? 0)
    const startTs = promo?.fecha_inicio ? new Date(promo.fecha_inicio).getTime() : null
    const endTs = promo?.fecha_fin ? new Date(promo.fecha_fin).getTime() : null
    const started = startTs == null || !Number.isFinite(startTs) || startTs <= nowTs
    const notEnded = endTs == null || !Number.isFinite(endTs) || endTs >= nowTs
    const isCurrent = estado === 'activa' && restante > 0 && started && notEnded

    if (estado === 'finalizada') {
      return { label: 'FINALIZADA', tone: 'bg-gray-800 text-white', detail: 'Promoción finalizada', isCurrent: false }
    }
    if (estado === 'agotada' || restante <= 0) {
      return { label: 'AGOTADO', tone: 'bg-red-600 text-white', detail: 'Stock promocional agotado', isCurrent: false }
    }
    if (!started) {
      return { label: 'PROGRAMADA', tone: 'bg-blue-600 text-white', detail: 'Aun no inició', isCurrent: false }
    }
    if (!notEnded) {
      return { label: 'FINALIZADA', tone: 'bg-gray-800 text-white', detail: 'Fuera de vigencia', isCurrent: false }
    }
    return {
      label: 'OFERTA',
      tone: 'bg-amber-400 text-slate-950',
      detail: restante > 0 ? `${restante} unidades promo` : 'Promoción activa',
      isCurrent,
    }
  }
  const sortedPromotions = [...promotions].sort((a, b) => {
    const statusDiff = Number(getPromotionCardStatus(b).isCurrent) - Number(getPromotionCardStatus(a).isCurrent)
    if (statusDiff !== 0) return statusDiff
    return Number(b.id) - Number(a.id)
  })
  const currentPromotions = sortedPromotions.filter((promo) => getPromotionCardStatus(promo).isCurrent)
  const otherPromotions = sortedPromotions.filter((promo) => !getPromotionCardStatus(promo).isCurrent)
  const formatPromoMoney = (value) => {
    const amount = Number(value)
    if (!Number.isFinite(amount)) return ''
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  const promotionPriority = { activa: 3, agotada: 2, finalizada: 1 }
  const productPromotionMap = new Map()
  promotions.forEach((promo) => {
    const productId = Number(promo.product_id || promo.productId)
    if (!productId) return
    const nextState = String(promo.estado || '').toLowerCase()
    const current = productPromotionMap.get(productId)
    const currentState = String(current?.estado || '').toLowerCase()
    const nextPriority = promotionPriority[nextState] || 0
    const currentPriority = promotionPriority[currentState] || 0
    if (!current || nextPriority > currentPriority || (nextPriority === currentPriority && Number(promo.id) > Number(current.id))) {
      productPromotionMap.set(productId, promo)
    }
  })
  const getProductPromotionStatus = (product) => {
    const promo = productPromotionMap.get(Number(product.id))
    if (promo) {
      const remaining = Number(promo.stock_promocion_restante ?? promo.stockPromocionRestante ?? promo.stock_promocion ?? 0)
      if (String(promo.estado).toLowerCase() === 'agotada' || remaining <= 0) {
        return {
          label: 'AGOTADO',
          tone: 'bg-red-600 text-white',
          detail: remaining > 0 ? `Restan ${remaining}` : 'Stock promocional agotado',
          promo,
        }
      }
      if (String(promo.estado).toLowerCase() === 'activa') {
        return {
          label: 'OFERTA',
          tone: 'bg-amber-400 text-slate-950',
          detail: remaining > 0 ? `${remaining} unidades promo` : 'Promoción activa',
          promo,
        }
      }
    }
    return {
      label: 'ACTIVO',
      tone: 'bg-emerald-600 text-white',
      detail: 'Sin promoción cargada',
      promo: null,
    }
  }
  const parseLegacyPromoPrice = (value) => {
    const digits = String(value || '').replace(/[^\d]/g, '')
    if (!digits) return ''
    return digits.length > 2 ? digits.slice(0, -2) : digits
  }
  const getLegacyPromotionTemplateStatus = (promo) => {
    const state = String(promo?.estado || '').toUpperCase()
    if (state.includes('ELIMINADA')) {
      return {
        label: 'ELIMINADA',
        tone: 'bg-gray-900 text-white',
        detail: 'Quitada de la página pública',
      }
    }
    if (state.includes('AGOTADA')) {
      return {
        label: 'AGOTADO',
        tone: 'bg-red-600 text-white',
        detail: 'Promoción publicada sin stock',
      }
    }
    const discount = String(promo?.discount || '').toUpperCase()
    if (discount.includes('AGOTADO')) {
      return {
        label: 'AGOTADO',
        tone: 'bg-red-600 text-white',
        detail: 'Promoción publicada sin stock',
      }
    }
    return {
      label: 'PLANTILLA',
      tone: 'bg-amber-400 text-slate-950',
      detail: discount || 'Promoción publicada en la web',
    }
  }
  const loadLegacyPromotionTemplate = (promo, openModal = false) => {
    setPromoProductId('')
    setPromoTitle(promo.title || '')
    setPromoDesc(promo.description || '')
    setPromoPrice(parseLegacyPromoPrice(promo.price))
    setPromoStockPromocion(PROMO_TEMPLATE_MIN_STOCK)
    setPromoSizes(promo.sizes || '')
    setPromoFechaInicio('')
    setPromoFechaFin('')
    setPromoPreview(promo.image || '')
    setPromoImageBase64(promo.image || '')
    setShowPromotionModal(openModal)
    notify('Datos cargados desde la promoción de la página', 'info')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const markLegacyPromotionSoldOut = async (promo) => {
    const token = localStorage.getItem('adminToken')
    if (!token) { notify('Sesión expirada', 'error'); navigate('/admin/login'); return }
    const isSoldOut = String(promo?.estado || promo?.discount || '').toLowerCase().includes('agot')
    if (isSoldOut) {
      notify('La promoción ya figura agotada', 'info')
      return
    }
    try {
      const resp = await fetch(apiUrl(`/api/admin/promotions/legacy/${promo.id}/sold-out`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (resp.status === 401 || resp.status === 403) { notify('Sesión expirada', 'error'); navigate('/admin/login'); return }
      const text = await resp.text()
      let data = {}
      try { data = text ? JSON.parse(text) : {} } catch { data = {} }
      if (!resp.ok || data.ok === false) throw new Error(data.error || 'legacy-sold-out-fallback')
      storeLegacyPromotionOverride(promo, { estado: 'agotada', deleted: false })
    } catch (err) {
      console.error(err)
      storeLegacyPromotionOverride(promo, { estado: 'agotada', deleted: false })
    }
    try {
      await Promise.all([refreshPromotions(), refreshLegacyPromotionOverrides()])
    } catch {
      void 0
    }
    notify('Promoción marcada como agotada', 'success')
  }
  const deleteLegacyPromotion = async (promo) => {
    const token = localStorage.getItem('adminToken')
    if (!token) { notify('Sesión expirada', 'error'); navigate('/admin/login'); return }
    try {
      const resp = await fetch(apiUrl(`/api/admin/promotions/legacy/${promo.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (resp.status === 401 || resp.status === 403) { notify('Sesión expirada', 'error'); navigate('/admin/login'); return }
      const text = await resp.text()
      let data = {}
      try { data = text ? JSON.parse(text) : {} } catch { data = {} }
      if (!resp.ok || data.ok === false) throw new Error(data.error || 'legacy-delete-fallback')
      storeLegacyPromotionOverride(promo, { estado: 'eliminada', deleted: true })
    } catch (err) {
      console.error(err)
      storeLegacyPromotionOverride(promo, { estado: 'eliminada', deleted: true })
    }
    try {
      await Promise.all([refreshPromotions(), refreshLegacyPromotionOverrides()])
    } catch {
      void 0
    }
    notify('Promoción eliminada de la página', 'success')
  }
  const fillPromotionDraftFromProduct = (product) => {
    if (!product) return
    const promo = productPromotionMap.get(Number(product.id))
    setPromoProductId(String(product.id))
    setPromoTitle(promo?.title || product.name || '')
    setPromoDesc(promo?.description || product.description || '')
    setPromoPrice(promo?.precio_promocion != null ? String(promo.precio_promocion) : '')
    setPromoStockPromocion(promo?.stock_promocion != null ? String(promo.stock_promocion) : PROMO_TEMPLATE_MIN_STOCK)
    setPromoSizes(promo?.sizes || product.talle || '')
    setPromoFechaInicio(promo?.fecha_inicio ? String(promo.fecha_inicio).slice(0, 16) : '')
    setPromoFechaFin(promo?.fecha_fin ? String(promo.fecha_fin).slice(0, 16) : '')
    const previewImage = promo?.image || getPublicProductImage(product) || ''
    setPromoPreview(previewImage)
    setPromoImageBase64(previewImage)
  }
  const openPromotionComposerForProduct = (product) => {
    setShowPromotionModal(true)
    fillPromotionDraftFromProduct(product)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const renderPromotionManagementCard = (promo) => {
    const status = getPromotionCardStatus(promo)
    const isSoldOut = String(promo.estado || '').toLowerCase() === 'agotada' || Number(promo.stock_promocion_restante ?? promo.stock_promocion ?? 0) <= 0
    return (
      <div
        key={promo.id}
        className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
        onClick={() => setPromotionDetail(promo)}
      >
        <div className="relative aspect-[4/5] bg-gray-100">
          <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${status.tone}`}>{status.label}</span>
          </div>
        </div>
        <div className="p-5 flex flex-col gap-3 flex-1">
          <div>
            <h3 className="text-lg font-black text-gray-900">{promo.title}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {promo.product_name && <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">{promo.product_name}</span>}
            {promo.precio_normal != null && <span className="px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] text-xs font-bold">Precio {formatPromoMoney(promo.precio_normal)}</span>}
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">Stock {promo.stock_promocion_restante ?? promo.stock_promocion ?? 0}</span>
            {promo.precio_promocion != null && <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">Promo {formatPromoMoney(promo.precio_promocion)}</span>}
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-bold text-gray-700">Estado:</span> {status.detail}
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            {promo.sizes && <div>Talles: {promo.sizes}</div>}
            {(promo.fecha_inicio || promo.fecha_fin) && <div>{promoDateLabel(promo.fecha_inicio ? String(promo.fecha_inicio).slice(0, 16) : '', promo.fecha_fin ? String(promo.fecha_fin).slice(0, 16) : '')}</div>}
          </div>
          <div className={`mt-auto grid grid-cols-1 ${isSeller ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3`}>
            <button
              type="button"
              disabled={isSoldOut}
              className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors ${isSoldOut ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-amber-400 text-slate-950 hover:bg-amber-300'}`}
              onClick={(e)=>{ e.stopPropagation(); markPromotionSoldOut(promo) }}
            >
              {isSoldOut ? 'Agotado' : 'Marcar agotado'}
            </button>
            {!isSeller && (
              <button
                type="button"
                className="px-4 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest hover:bg-brandNav transition-colors"
                onClick={(e)=>{ e.stopPropagation(); startPromoEdit(promo) }}
              >
                Editar promoción
              </button>
            )}
            <button
              type="button"
              className="px-4 py-3 rounded-2xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-500 transition-colors"
              onClick={(e)=>{ e.stopPropagation(); deletePromotion(promo.id) }}
            >
              Eliminar promoción
            </button>
          </div>
        </div>
      </div>
    )
  }
  const legacyPromotionOverrideMap = new Map(legacyPromotionOverrides.map((item) => [Number(item.id), item]))
  const renderLegacyPromotionTemplateCard = (promo, idx) => {
    const override = legacyPromotionOverrideMap.get(Number(promo.id))
    const mergedPromo = override ? { ...promo, ...override } : promo
    const status = getLegacyPromotionTemplateStatus(mergedPromo)
    const isSoldOut = String(mergedPromo?.estado || mergedPromo?.discount || '').toLowerCase().includes('agot')
    return (
      <div
        key={`legacy-panel-${idx}`}
        className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
      >
        <div className="relative aspect-[4/5] bg-gray-100">
          <img src={mergedPromo.image} alt={mergedPromo.title} className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${status.tone}`}>{status.label}</span>
          </div>
        </div>
        <div className="p-5 flex flex-col gap-3 flex-1">
          <div>
            <h3 className="text-lg font-black text-gray-900">{mergedPromo.title}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {mergedPromo.price && <span className="px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] text-xs font-bold">Precio {mergedPromo.price}</span>}
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">Web pública</span>
            {mergedPromo.sizes && <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">Talles {mergedPromo.sizes}</span>}
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-bold text-gray-700">Estado:</span> {status.detail}
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            {mergedPromo.description && <div>{mergedPromo.description}</div>}
          </div>
          <div className={`mt-auto grid grid-cols-1 ${isSeller ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3`}>
            {!isSeller && (
              <button
                type="button"
                className="px-4 py-3 rounded-2xl bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-amber-300 transition-colors"
                onClick={() => loadLegacyPromotionTemplate(mergedPromo, false)}
              >
                Cargar datos
              </button>
            )}
            {!isSeller && (
              <button
                type="button"
                className="px-4 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest hover:bg-brandNav transition-colors"
                onClick={() => loadLegacyPromotionTemplate(mergedPromo, true)}
              >
                Crear promoción
              </button>
            )}
            <button
              type="button"
              disabled={isSoldOut}
              className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors ${isSoldOut ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-amber-400 text-slate-950 hover:bg-amber-300'}`}
              onClick={() => markLegacyPromotionSoldOut(mergedPromo)}
            >
              {isSoldOut ? 'Agotado' : 'Marcar agotado'}
            </button>
            <button
              type="button"
              className="px-4 py-3 rounded-2xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-500 transition-colors"
              onClick={() => deleteLegacyPromotion(mergedPromo)}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    )
  }
  const todayKey = new Date().toISOString().slice(0, 10)
  const todaySales = Array.isArray(salesLog)
    ? salesLog.filter((sale) => String(sale.ts || '').slice(0, 10) === todayKey)
    : []
  const todaySalesRevenue = todaySales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)
  const todaySalesUnits = todaySales.reduce((sum, sale) => sum + (Number(sale.quantity) || 0), 0)
  const activePromotionCount = promotions.filter((promo) => String(promo.estado || '').toLowerCase() === 'activa' && (Number(promo.stock_promocion_restante) || 0) > 0).length
  const soldOutPromotionCount = promotions.filter((promo) => String(promo.estado || '').toLowerCase() === 'agotada' || (Number(promo.stock_promocion_restante) || 0) <= 0).length
  const totalPromotionStock = promotions.reduce((sum, promo) => sum + (Number(promo.stock_promocion) || 0), 0)
  const availablePromotionStock = promotions.reduce((sum, promo) => sum + (Number(promo.stock_promocion_restante ?? promo.stock_promocion) || 0), 0)
  const activeTabTitle = adminTabs.find(tab => tab.id === activeTab)?.label || 'Panel'
  const panelUsers = Array.isArray(users) ? users.filter(u => ['admin', 'vendedor', 'stock'].includes(String(u.role || '').toLowerCase())) : []

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 p-6 flex flex-col">
        {isStock ? (
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              {settings.companyLogo ? <img src={settings.companyLogo} alt="logo" className="w-full h-full object-contain p-1" /> : <div className="w-full h-full flex items-center justify-center text-[#1E3A8A] font-black">JJ</div>}
            </div>
            <div className="leading-tight">
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.35em]">CONTROL DE</p>
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.35em]">STOCK</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              {settings.companyLogo ? <img src={settings.companyLogo} alt="logo" className="w-full h-full object-contain p-1" /> : <div className="w-full h-full flex items-center justify-center text-[#1E3A8A] font-black">JJ</div>}
            </div>
            <p className="text-xs text-blue-600 font-black uppercase tracking-[0.3em]">{roleLabel}</p>
          </div>
        )}
        <nav className="space-y-1">
          {adminTabs.filter(t => !t.isTail).map(it => (
            <button key={it.id} className={`w-full text-left px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] ${activeTab===it.id ? 'bg-blue-50 text-[#1E3A8A]' : 'text-gray-500 hover:bg-gray-50'}`} onClick={()=>setActiveTab(it.id)}>{it.label}</button>
          ))}
          {adminTabs.some(t => t.isTail) && (
            <div className="py-2">
              <div className="border-t border-gray-100" />
            </div>
          )}
          {adminTabs.filter(t => t.isTail).map(it => (
            <button key={it.id} className={`w-full text-left px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] ${activeTab===it.id ? 'bg-blue-50 text-[#1E3A8A]' : 'text-gray-500 hover:bg-gray-50'}`} onClick={()=>setActiveTab(it.id)}>{it.label}</button>
          ))}
        </nav>
        {(isStock || isAdmin) && activeTab === 'inventory' && (
          <div className="mt-4 space-y-1">
            {(isAdmin
              ? [
                  { id: 'inventario', label: 'Inventario' },
                  { id: 'gestion', label: 'Gestión' },
                  { id: 'movimientos', label: 'Movimientos' },
                  { id: 'alertas', label: 'Alertas' },
                ]
              : [
                  { id: 'gestion', label: 'Gestión' },
                  { id: 'movimientos', label: 'Movimientos' },
                  { id: 'alertas', label: 'Alertas' },
                ]).map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setInventorySection(t.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] ${inventorySection === t.id ? 'bg-blue-50 text-[#1E3A8A]' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        <div className="mt-auto pt-6">
          <button onClick={logout} className="w-full px-4 py-3 bg-[#1E3A8A] text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Salir</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-black uppercase tracking-tight text-[#1E3A8A]">{activeTabTitle}</h1>
          <div className="hidden md:flex items-center gap-3 text-xs font-black uppercase tracking-widest text-gray-500">
            <span>{roleLabel}</span>
            <span>{new Date().toLocaleDateString('es-AR')}</span>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(isSeller
                ? [
                    { label:'Vendido hoy', value: formatPromoMoney(todaySalesRevenue), accent:'bg-emerald-50 text-emerald-700' },
                    { label:'Unidades hoy', value: todaySalesUnits, accent:'bg-blue-50 text-[#1E3A8A]' },
                    { label:'Promos activas', value: activePromotionCount, accent:'bg-amber-50 text-amber-700' },
                    { label:'Promos agotadas', value: soldOutPromotionCount, accent:'bg-red-50 text-red-700' },
                  ]
                : [
                    { label:'Ingresos', value:`ARS ${(stats.revenue||0).toLocaleString('es-AR',{minimumFractionDigits:2})}`, accent:'bg-emerald-50 text-emerald-700' },
                    { label:'Stock bajo', value:lowStockCount, accent:'bg-amber-50 text-amber-700' },
                    { label:'Pedidos pendientes', value:orders.filter(o=>o.status==='pendiente').length, accent:'bg-blue-50 text-[#1E3A8A]' },
                    { label:'Clientes', value:users.length, accent:'bg-gray-50 text-gray-700' },
                  ]).map((k,i)=>(
                <div key={i} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                  <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${k.accent}`}>{k.label}</div>
                  <div className="mt-3 text-3xl font-black">{k.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Ventas por día</h3>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rango</span>
                  <select value={salesSeriesRange} onChange={e=>setSalesSeriesRange(e.target.value)} className="bg-gray-50 border-none rounded-2xl px-4 py-2 text-xs font-bold text-gray-900">
                    <option value="7d">7 días</option>
                    <option value="30d">30 días</option>
                  </select>
                </div>
              </div>
              {(() => {
                const series = Array.isArray(salesSeries) ? salesSeries : []
                const values = series.map(s => Number(s.revenue) || 0)
                const maxV = Math.max(1, ...values)
                const w = 640
                const h = 140
                const pad = 10
                const step = series.length > 1 ? (w - pad * 2) / (series.length - 1) : 0
                const points = series.map((s, i) => {
                  const x = pad + i * step
                  const y = pad + (h - pad * 2) * (1 - (Number(s.revenue) || 0) / maxV)
                  return `${x},${y}`
                }).join(' ')
                const last = series[series.length - 1]
                const todayRevenue = Number(last?.revenue) || 0
                const todayUnits = Number(last?.units) || 0
                const avgRevenue = series.length ? Math.round(values.reduce((a,b)=>a+b,0) / series.length) : 0
                const lastTxt = last ? `Hoy: ARS ${todayRevenue.toLocaleString('es-AR',{minimumFractionDigits:2})} · Unidades: ${todayUnits} · Promedio: ARS ${Number(avgRevenue).toLocaleString('es-AR',{minimumFractionDigits:2})}` : 'Sin datos'
                return (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ventas de hoy</p>
                        <p className="text-xl font-black text-gray-900 mt-1">ARS {todayRevenue.toLocaleString('es-AR',{minimumFractionDigits:2})}</p>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Unidades hoy</p>
                        <p className="text-xl font-black text-gray-900 mt-1">{todayUnits}</p>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Promedio diario</p>
                        <p className="text-xl font-black text-gray-900 mt-1">ARS {Number(avgRevenue).toLocaleString('es-AR',{minimumFractionDigits:2})}</p>
                      </div>
                    </div>
                    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44">
                      <rect x="0" y="0" width={w} height={h} fill="transparent" />
                      <line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad} stroke="#e5e7eb" strokeWidth="2" />
                      <polyline points={points} fill="none" stroke="#1E3A8A" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                    <div className="text-xs font-bold text-gray-500">{lastTxt}</div>
                    {todayRevenue === 0 && todayUnits === 0 && (
                      <div className="text-xs font-bold text-gray-400">
                        No hay ventas registradas hoy. Usá “Registrar venta” para cargar una.
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Quick sale + Sales log */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Ventas recientes</h3>
                </div>
                <ul className="divide-y divide-gray-100">
                  {(salesLog && salesLog.slice(0,10)).map((s)=>(
                    <li key={s.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-bold text-gray-700">{s.name}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                          {String(s.tipo_precio || '').toLowerCase() === 'promo' ? 'Precio promoción' : 'Precio normal'} · {new Date(s.ts).toLocaleString('es-AR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-700">x{s.quantity} · {formatPromoMoney(Number(s.price) || 0)}</div>
                        <div className="text-xs text-gray-500">Total {formatPromoMoney(Number(s.total) || 0)}</div>
                      </div>
                    </li>
                  ))}
                  {(!salesLog || salesLog.length===0) && <li className="py-6 text-sm text-gray-400">Sin ventas registradas.</li>}
                </ul>
              </div>
              <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                <h3 className="text-lg font-black uppercase tracking-widest text-gray-900 mb-4">Registrar venta</h3>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Producto</label>
                  <select 
                    id="quick-sale-product" 
                    value={quickSalePid} 
                    onChange={e=>setQuickSalePid(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900"
                  >
                    <option value="">Seleccionar...</option>
                    {products.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Cantidad</label>
                  <input 
                    id="quick-sale-qty" 
                    type="number" 
                    min="1" 
                    value={quickSaleQty}
                    onChange={e=>setQuickSaleQty(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" 
                  />
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Precio unitario (opcional)</label>
                  <input 
                    id="quick-sale-price" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    placeholder="Usa el del producto si lo dejás vacío" 
                    value={quickSalePrice}
                    onChange={e=>setQuickSalePrice(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" 
                  />
                  <button
                    disabled={isRegisteringSale}
                    onClick={async ()=>{
                      if (!quickSalePid) { notify('Seleccione un producto', 'warning'); return }
                      const q = Number(quickSaleQty) || 1
                      let up = quickSalePrice ? Number(quickSalePrice) : undefined
                      // si no hay precio ingresado, intentar usar el del producto seleccionado
                      if (up == null || Number.isNaN(up)) {
                        const pp = products.find(x => String(x.id) === String(quickSalePid))
                        up = Number(pp?.price)
                      }
                      const ok = await registerSale(quickSalePid, String(q), undefined, up)
                      if (ok) {
                        setQuickSalePid('')
                        setQuickSaleQty('1')
                        setQuickSalePrice('')
                      }
                    }}
                    className={`w-full bg-[#1E3A8A] text-white py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-800 transition-all ${isRegisteringSale ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >{isRegisteringSale ? 'Guardando...' : 'Guardar'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Productos activos</p>
                    <p className="mt-2 text-3xl font-black text-[#1E3A8A]">{productCardsCatalog.length}</p>
                  </div>
                  <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">En oferta</p>
                    <p className="mt-2 text-3xl font-black text-amber-500">{activePromotionCount}</p>
                  </div>
                  <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Promos agotadas</p>
                    <p className="mt-2 text-3xl font-black text-red-600">{soldOutPromotionCount}</p>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Agregar producto nuevo</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateProductModal(true)}
                    className="px-5 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest"
                  >
                    Nuevo producto
                  </button>
                </div>

                {editingId && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="xl:col-start-2 bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Editar producto</h3>
                        </div>
                        <button type="button" className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest" onClick={()=>{ setEditingId(null); setPreview(''); }}>Cancelar</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nombre</label>
                          <input value={editFields.name} onChange={e=>setEditFields(v=>({ ...v, name: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Precio</label>
                          <input value={editFields.price} onChange={e=>setEditFields(v=>({ ...v, price: e.target.value }))} type="number" min="0" className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Categoría</label>
                          <input value={editFields.category} onChange={e=>setEditFields(v=>({ ...v, category: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Stock</label>
                          <input value={editFields.quantity} onChange={e=>setEditFields(v=>({ ...v, quantity: e.target.value }))} type="number" min="0" className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Proveedor</label>
                          <select value={editFields.supplier_id} onChange={e=>setEditFields(v=>({ ...v, supplier_id: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900">
                            <option value="">Seleccione un proveedor</option>
                            {suppliers.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Imagen</label>
                          <input type="file" accept="image/*" onChange={onEditFileChange} className="block file:mr-3 file:px-4 file:py-3 file:rounded-2xl file:border-0 file:bg-[#1E3A8A] file:text-white file:font-black file:uppercase file:tracking-widest text-sm" />
                          {preview && <img src={preview} alt="Vista previa" className="mt-3 w-24 h-24 rounded-2xl object-cover" />}
                        </div>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <button className="flex-1 px-4 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest" onClick={saveEdit}>Guardar producto</button>
                        <button type="button" className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest" onClick={()=>{ setEditingId(null); setPreview(''); }}>Cancelar</button>
                      </div>
                    </div>
                  </div>
                )}

                {showCreateProductModal && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
                    onMouseDown={(e) => {
                      if (e.target === e.currentTarget) clearProductDraft()
                    }}
                  >
                    <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-[2rem] border border-gray-100 p-6 shadow-2xl">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div>
                          <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Agregar producto nuevo</h3>
                        </div>
                        <button type="button" onClick={clearProductDraft} className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest">Cerrar</button>
                      </div>
                      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_320px] gap-6">
                        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nombre</label>
                            <input value={name} onChange={e=>setName(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Nombre del producto" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Precio</label>
                            <input value={price} onChange={e=>setPrice(e.target.value)} type="number" min="0" className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="0" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Categoría</label>
                            <input value={category} onChange={e=>setCategory(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Ej: Remeras" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Proveedor</label>
                            <select value={supplierId} onChange={e=>setSupplierId(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900">
                              <option value="">Seleccione un proveedor</option>
                              {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Cantidad</label>
                            <input value={quantity} onChange={e=>setQuantity(e.target.value)} type="number" min="0" className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="0" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Imagen</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={onFileChange}
                              className="block w-full file:mr-3 file:px-4 file:py-3 file:rounded-2xl file:border-0 file:bg-[#1E3A8A] file:text-white file:font-black file:uppercase file:tracking-widest text-sm"
                            />
                          </div>
                          <div className="md:col-span-2 xl:col-span-3 flex items-center gap-4">
                            <button type="submit" className="px-5 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest">
                              Agregar producto
                            </button>
                            <button type="button" onClick={clearProductDraft} className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest">
                              Cancelar
                            </button>
                          </div>
                        </form>

                        <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Vista previa</p>
                          <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                            <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                              {productPreviewImage ? (
                                <img src={productPreviewImage} alt={productPreviewTitle} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">Sin imagen</div>
                              )}
                              <div className="absolute top-4 left-4">
                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${productPreviewTone}`}>{productPreviewBadge}</span>
                              </div>
                            </div>
                            <div className="p-5 flex flex-col gap-3">
                              <div>
                                <h3 className="text-lg font-black text-gray-900">{productPreviewTitle}</h3>
                                <p className="text-sm text-gray-500">{productPreviewCategory}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {Number.isFinite(productPreviewPrice) && productPreviewPrice > 0 && (
                                  <span className="px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] text-xs font-bold">Precio {formatPromoMoney(productPreviewPrice)}</span>
                                )}
                                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">Stock {Number.isFinite(productPreviewStock) ? productPreviewStock : 0}</span>
                              </div>
                              <div className="text-sm text-gray-500">
                                <span className="font-bold text-gray-700">Estado:</span> {productPreviewStock > 0 ? 'Listo para publicarse' : 'Pendiente de stock'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(showPromotionModal || promoProductId) && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
                    onMouseDown={(e) => {
                      if (e.target === e.currentTarget) clearPromotionDraft()
                    }}
                  >
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[2rem] border border-gray-100 p-6 shadow-2xl">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div>
                          <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Crear promoción</h3>
                        </div>
                        <button type="button" className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest" onClick={clearPromotionDraft}>Cerrar</button>
                      </div>
                      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_360px] gap-6">
                        <form onSubmit={createPromotion} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Producto</label>
                            <select
                              value={promoProductId}
                              onChange={e => {
                                const nextProduct = promotionProductCatalog.find((p) => String(p.id) === String(e.target.value))
                                if (nextProduct) fillPromotionDraftFromProduct(nextProduct)
                                else setPromoProductId(e.target.value)
                              }}
                              className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900"
                            >
                              <option value="">Seleccione un producto</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} · Stock {p.quantity ?? 0} · {formatPromoMoney(p.price)}</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Título</label>
                              <input value={promoTitle} onChange={e=>setPromoTitle(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Nombre visible de la promoción" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Talles</label>
                              <input value={promoSizes} onChange={e=>setPromoSizes(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="S,M,L,XL" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Descripción</label>
                            <input value={promoDesc} onChange={e=>setPromoDesc(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Texto visible en la web" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Precio promocional</label>
                              <input value={promoPrice} onChange={e=>setPromoPrice(e.target.value)} type="number" min="0" className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="0" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Stock para promoción</label>
                              <input value={promoStockPromocion} onChange={e=>setPromoStockPromocion(e.target.value)} type="number" min="1" className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="0" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Inicio opcional</label>
                              <input value={promoFechaInicio} onChange={e=>setPromoFechaInicio(e.target.value)} type="datetime-local" className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Fin opcional</label>
                              <input value={promoFechaFin} onChange={e=>setPromoFechaFin(e.target.value)} type="datetime-local" className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Imagen opcional</label>
                            <input type="file" accept="image/*" onChange={onPromoFileChange} className="block file:mr-3 file:px-4 file:py-3 file:rounded-2xl file:border-0 file:bg-[#1E3A8A] file:text-white file:font-black file:uppercase file:tracking-widest text-sm" />
                          </div>
                          <div className="flex gap-3">
                            <button type="submit" className="flex-1 px-4 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest">Guardar promoción</button>
                            <button type="button" onClick={clearPromotionDraft} className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest">Cancelar</button>
                          </div>
                        </form>

                        <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Vista previa pública</p>
                          <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                            <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                              {promoPreviewImage ? (
                                <img src={promoPreviewImage} alt={promoPreviewTitle} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">Sin imagen</div>
                              )}
                              <div className="absolute top-4 left-4 z-10">
                                <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-widest shadow-lg ${promoPreviewStock > 0 ? 'bg-amber-400 text-slate-950' : 'bg-red-600 text-white'}`}>
                                  {promoPreviewBadge}
                                </span>
                              </div>
                            </div>
                            <div className="p-5 flex flex-col text-center">
                              <h3 className="text-gray-900 font-bold text-lg mb-1 truncate">{promoPreviewTitle}</h3>
                              <div className="flex flex-col gap-1 mb-4">
                                {Number.isFinite(promoPreviewPromoPrice) && promoPreviewPromoPrice > 0 && (
                                  <p className="text-[#1E3A8A] font-black text-xl">{formatPromoMoney(promoPreviewPromoPrice)}</p>
                                )}
                                {promoPreviewNormalPrice > 0 && (
                                  <p className={`${Number.isFinite(promoPreviewPromoPrice) && promoPreviewPromoPrice > 0 ? 'text-sm text-gray-400 line-through' : 'text-[#1E3A8A] font-black text-xl'}`}>
                                    {formatPromoMoney(promoPreviewNormalPrice)}
                                  </p>
                                )}
                                {promoPreviewSizes && (
                                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                    Talles: {promoPreviewSizes}
                                  </p>
                                )}
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                  {promoPreviewStock > 0 ? `Stock promo: ${promoPreviewStock}` : 'Stock promocional pendiente'}
                                </p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                  {promoPreviewDateLabel}
                                </p>
                                {promoPreviewDescription && (
                                  <p className="text-sm text-gray-500 line-clamp-2">{promoPreviewDescription}</p>
                                )}
                              </div>
                              <div className="mt-auto">
                                <span className={`inline-flex items-center justify-center w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-md ${promoPreviewStock > 0 ? 'bg-[#1E3A8A] text-white' : 'bg-red-600 text-white'}`}>
                                  {promoPreviewStock > 0 ? 'Comprar ahora' : 'Agotado'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {productCardsCatalog.length === 0 && <p className="text-gray-600">Sin productos cargados.</p>}
                  {productCardsCatalog.map((p) => {
                    const status = getProductPromotionStatus(p)
                    const promo = status.promo
                    const productImage = getPublicProductImage(p)
                    return (
                      <div key={p.id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                        <div className="relative aspect-[4/5] bg-gray-100">
                          <img src={productImage} alt={p.name} className="w-full h-full object-cover" />
                          <div className="absolute top-4 left-4">
                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${status.tone}`}>{status.label}</span>
                          </div>
                        </div>
                        <div className="p-5 flex flex-col gap-3 flex-1">
                          <div>
                            <h3 className="text-lg font-black text-gray-900">{p.name}</h3>
                            <p className="text-sm text-gray-500">{p.category || 'Sin categoría'}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] text-xs font-bold">Precio {formatPromoMoney(p.price)}</span>
                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">Stock {p.quantity ?? 0}</span>
                            {promo?.precio_promocion != null && <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">Promo {formatPromoMoney(promo.precio_promocion)}</span>}
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="font-bold text-gray-700">Estado:</span> {status.detail}
                          </div>
                          <div className="mt-auto flex flex-col gap-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => startEdit(p)}
                                className="w-full px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors bg-[#1E3A8A] text-white hover:bg-brandNav"
                              >
                                Editar producto
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteProduct(p.id)}
                                className="w-full px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors bg-red-600 text-white hover:bg-red-500"
                              >
                                Eliminar producto
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => openPromotionComposerForProduct(p)}
                              disabled={!!promo}
                              className={`w-full px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors ${promo ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-amber-400 text-slate-950 hover:bg-amber-300'}`}
                            >
                              Agregar promo
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
            </div>
          </div>
        )}

        {activeTab === 'promotions' && (
          <div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Promociones vigentes</p>
                  <p className="mt-2 text-3xl font-black text-amber-500">{currentPromotions.length}</p>
                </div>
                <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Promociones agotadas</p>
                  <p className="mt-2 text-3xl font-black text-red-600">{soldOutPromotionCount}</p>
                </div>
                <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock promo cargado</p>
                  <p className="mt-2 text-3xl font-black text-gray-900">{totalPromotionStock}</p>
                </div>
                <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock promo disponible</p>
                  <p className="mt-2 text-3xl font-black text-emerald-600">{availablePromotionStock}</p>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Crear nueva promoción</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPromotionModal(true)}
                  className="px-5 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest"
                >
                  Nueva promoción
                </button>
              </div>

              {promoEditingId && (
                <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Editar promoción</h3>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest"
                      onClick={()=>{ setPromoEditingId(null); setPromoEditFields({ title: '', description: '', price: '', sizes: '', stockPromocion: '', fechaInicio: '', fechaFin: '', estado: 'activa', imageBase64: '', image: '' }); setPromoPreview(''); }}
                    >
                      Cancelar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Título</label>
                        <input value={promoEditFields.title} onChange={e=>setPromoEditFields(v=>({ ...v, title: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Precio promocional</label>
                        <input value={promoEditFields.price} onChange={e=>setPromoEditFields(v=>({ ...v, price: e.target.value }))} type="number" min="0" className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Stock promocional</label>
                        <input value={promoEditFields.stockPromocion} onChange={e=>setPromoEditFields(v=>({ ...v, stockPromocion: e.target.value }))} type="number" min={PROMO_TEMPLATE_MIN_STOCK} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                      </div>
                      <div className="md:col-span-2 xl:col-span-3">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Descripción</label>
                        <input value={promoEditFields.description} onChange={e=>setPromoEditFields(v=>({ ...v, description: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Talles</label>
                        <input value={promoEditFields.sizes} onChange={e=>setPromoEditFields(v=>({ ...v, sizes: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Inicio</label>
                        <input value={promoEditFields.fechaInicio} onChange={e=>setPromoEditFields(v=>({ ...v, fechaInicio: e.target.value }))} type="datetime-local" className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Fin</label>
                        <input value={promoEditFields.fechaFin} onChange={e=>setPromoEditFields(v=>({ ...v, fechaFin: e.target.value }))} type="datetime-local" className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Estado</label>
                        <select value={promoEditFields.estado} onChange={e=>setPromoEditFields(v=>({ ...v, estado: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900">
                          <option value="activa">Activa</option>
                          <option value="agotada">Agotada</option>
                          <option value="finalizada">Finalizada</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Imagen</label>
                        <input type="file" accept="image/*" onChange={onEditPromoFileChange} className="block file:mr-3 file:px-4 file:py-3 file:rounded-2xl file:border-0 file:bg-[#1E3A8A] file:text-white file:font-black file:uppercase file:tracking-widest text-sm" />
                      </div>
                      <div className="md:col-span-2 xl:col-span-3 flex gap-3">
                        <button className="px-5 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest" onClick={savePromoEdit}>Guardar promoción</button>
                        <button className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest" onClick={()=>{ setPromoEditingId(null); setPromoEditFields({ title: '', description: '', price: '', sizes: '', stockPromocion: '', fechaInicio: '', fechaFin: '', estado: 'activa', imageBase64: '', image: '' }); setPromoPreview(''); }}>Cancelar</button>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Vista previa pública</p>
                      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                          {promoEditPreviewImage ? (
                            <img src={promoEditPreviewImage} alt={promoEditPreviewTitle} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">Sin imagen</div>
                          )}
                          <div className="absolute top-4 left-4 z-10">
                            <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-widest shadow-lg ${promoEditPreviewBadgeTone}`}>
                              {promoEditPreviewBadge}
                            </span>
                          </div>
                        </div>
                        <div className="p-5 flex flex-col flex-grow text-center">
                          <h3 className="text-gray-900 font-bold text-lg mb-1 truncate">{promoEditPreviewTitle}</h3>
                          <div className="flex flex-col gap-1 mb-4">
                            {Number.isFinite(promoEditPreviewPromoPrice) && promoEditPreviewPromoPrice > 0 && <p className="text-brandBlue font-black text-xl">{formatPromoMoney(promoEditPreviewPromoPrice)}</p>}
                            {promoEditPreviewNormalPrice > 0 && (
                              <p className={`${Number.isFinite(promoEditPreviewPromoPrice) && promoEditPreviewPromoPrice > 0 ? 'text-sm text-gray-400 line-through' : 'text-brandBlue font-black text-xl'}`}>
                                {formatPromoMoney(promoEditPreviewNormalPrice)}
                              </p>
                            )}
                            {promoEditPreviewSizes && <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Talles: {promoEditPreviewSizes}</p>}
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Estado: {promoEditPreviewState || 'activa'}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{promoEditPreviewStock > 0 ? `Stock promo: ${promoEditPreviewStock}` : 'Stock promocional agotado'}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{promoEditPreviewDateLabel}</p>
                            {promoEditPreviewDescription && <p className="text-sm text-gray-500 line-clamp-2">{promoEditPreviewDescription}</p>}
                          </div>
                          <div className="mt-auto">
                            <span className={`inline-flex items-center justify-center w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-md ${promoEditPreviewBadge === 'FINALIZADA' ? 'bg-gray-800 text-white' : (promoEditPreviewBadge === 'AGOTADO' ? 'bg-red-600 text-white' : 'bg-[#1E3A8A] text-white')}`}>
                              {promoEditPreviewBadge === 'FINALIZADA' ? 'Finalizada' : (promoEditPreviewBadge === 'AGOTADO' ? 'Agotado' : 'Comprar ahora')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Promociones vigentes</h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentPromotions.length === 0 && legacyPromos.length === 0 && <p className="text-gray-600">No hay promociones vigentes en este momento.</p>}
                  {legacyPromos.map(renderLegacyPromotionTemplateCard)}
                  {currentPromotions.map(renderPromotionManagementCard)}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Otras promociones</h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {otherPromotions.length === 0 && <p className="text-gray-600">No hay otras promociones para mostrar.</p>}
                  {otherPromotions.map(renderPromotionManagementCard)}
                </div>
              </div>

              {promotionDetail && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) setPromotionDetail(null)
                  }}
                >
                  <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-[2rem] border border-gray-100 p-6 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Detalle de promoción</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPromotionDetail(null)}
                        className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest"
                      >
                        Cerrar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
                      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                          {promotionDetail.image ? (
                            <img src={promotionDetail.image} alt={promotionDetail.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">Sin imagen</div>
                          )}
                          <div className="absolute top-4 left-4">
                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${promotionDetailStatus?.tone || 'bg-gray-800 text-white'}`}>
                              {promotionDetailStatus?.label || 'PROMO'}
                            </span>
                          </div>
                        </div>
                        <div className="p-5 flex flex-col gap-3 text-center">
                          <h3 className="text-gray-900 font-bold text-lg">{promotionDetail.title}</h3>
                          <div className="flex flex-col gap-1">
                            {Number.isFinite(promotionDetailPromoPrice) && promotionDetailPromoPrice > 0 && (
                              <p className="text-brandBlue font-black text-xl">{formatPromoMoney(promotionDetailPromoPrice)}</p>
                            )}
                            {promotionDetailNormalPrice > 0 && (
                              <p className={`${Number.isFinite(promotionDetailPromoPrice) && promotionDetailPromoPrice > 0 ? 'text-sm text-gray-400 line-through' : 'text-brandBlue font-black text-xl'}`}>
                                {formatPromoMoney(promotionDetailNormalPrice)}
                              </p>
                            )}
                            {promotionDetail.sizes && <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Talles: {promotionDetail.sizes}</p>}
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{promotionDetailRemaining > 0 ? `Stock promo: ${promotionDetailRemaining}` : 'Stock promocional agotado'}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{promotionDetailDate}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-[2rem] p-5 border border-gray-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Producto</p>
                            <p className="mt-2 text-lg font-black text-gray-900">{promotionDetail.product_name || 'Promoción activa'}</p>
                          </div>
                          <div className="bg-white rounded-[2rem] p-5 border border-gray-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Estado</p>
                            <p className="mt-2 text-lg font-black text-gray-900">{promotionDetailStatus?.detail || 'Promoción disponible'}</p>
                          </div>
                          <div className="bg-white rounded-[2rem] p-5 border border-gray-100 md:col-span-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Descripción</p>
                            <p className="mt-2 text-sm text-gray-600">{promotionDetail.description || 'Sin descripción cargada para esta promoción.'}</p>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={promotionDetailRemaining <= 0}
                            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest ${promotionDetailRemaining <= 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-amber-400 text-slate-950'}`}
                            onClick={() => markPromotionSoldOut(promotionDetail)}
                          >
                            {promotionDetailRemaining <= 0 ? 'Agotada' : 'Marcar agotado'}
                          </button>
                          {!isSeller && (
                          <button
                            type="button"
                            className="px-5 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest"
                            onClick={() => startPromoEdit(promotionDetail)}
                          >
                            Editar promoción
                          </button>
                          )}
                          <button
                            type="button"
                            className="px-5 py-3 rounded-2xl bg-red-600 text-white text-xs font-black uppercase tracking-widest"
                            onClick={() => deletePromotion(promotionDetail.id)}
                          >
                            Eliminar promoción
                          </button>
                          <button
                            type="button"
                            className="px-5 py-3 rounded-2xl bg-white text-gray-700 text-xs font-black uppercase tracking-widest border border-gray-200"
                            onClick={() => setPromotionDetail(null)}
                          >
                            Seguir viendo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Mensajes</h2>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pendientes</p>
                  <p className="mt-2 text-3xl font-black text-amber-500">
                    {(Array.isArray(contactMessages) ? contactMessages : []).filter(m => String(m.status || 'pendiente').toLowerCase() !== 'respondida').length}
                  </p>
                </div>
                <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Respondidas</p>
                  <p className="mt-2 text-3xl font-black text-emerald-600">
                    {(Array.isArray(contactMessages) ? contactMessages : []).filter(m => String(m.status || '').toLowerCase() === 'respondida').length}
                  </p>
                </div>
                <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total</p>
                  <p className="mt-2 text-3xl font-black text-[#1E3A8A]">{(Array.isArray(contactMessages) ? contactMessages : []).length}</p>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Bandeja</h3>
                  <p className="text-sm text-gray-500">Consultas enviadas desde la web</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <select
                    value={contactMessageFilter}
                    onChange={(e) => {
                      setContactMessageFilter(e.target.value)
                      setSelectedContactMessageId(null)
                      setMessagesPage(0)
                    }}
                    className="px-4 py-3 rounded-2xl bg-gray-50 text-gray-900 text-xs font-black uppercase tracking-widest"
                  >
                    <option value="pendiente">Pendientes</option>
                    <option value="respondida">Respondidas</option>
                    <option value="todas">Todas</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => refreshMessages().catch(() => setContactMessages([]))}
                    className="px-5 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest"
                  >
                    Actualizar
                  </button>
                </div>
              </div>

              {(() => {
                const base = Array.isArray(contactMessages) ? contactMessages : []
                const normalized = base.map(m => ({ ...m, status: (m && m.status) ? m.status : 'pendiente' }))
                const filtered = contactMessageFilter === 'todas'
                  ? normalized
                  : normalized.filter(m => String(m.status || 'pendiente').toLowerCase() === String(contactMessageFilter).toLowerCase())
                const perPage = 5
                const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
                const safePage = Math.max(0, Math.min(messagesPage, totalPages - 1))
                const paged = filtered.slice(safePage * perPage, safePage * perPage + perPage)
                const selected = filtered.find(m => String(m.id) === String(selectedContactMessageId))
                  || normalized.find(m => String(m.id) === String(selectedContactMessageId))
                  || null
                const statusValue = String(selected?.status || 'pendiente').toLowerCase()
                const isResponded = statusValue === 'respondida'

                return (
                  <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                      {filtered.length === 0 ? (
                        <div className="p-6">
                          <p className="text-gray-600">No hay mensajes para este filtro.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left border-b">
                                <th className="py-3 px-4">Fecha</th>
                                <th className="py-3 px-4">Nombre</th>
                                <th className="py-3 px-4">Email</th>
                                <th className="py-3 px-4">Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paged.map(m => {
                                const isActive = String(m.id) === String(selectedContactMessageId)
                                const tone = String(m.status || 'pendiente').toLowerCase() === 'respondida'
                                  ? 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/20'
                                  : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                                const label = String(m.status || 'pendiente').toLowerCase() === 'respondida' ? 'Respondida' : 'Pendiente'
                                return (
                                  <tr
                                    key={m.id}
                                    className={`border-b align-top cursor-pointer ${isActive ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
                                    onClick={() => setSelectedContactMessageId(m.id)}
                                  >
                                    <td className="py-3 px-4 whitespace-nowrap">{m.created_at ? new Date(m.created_at).toLocaleString('es-AR') : '-'}</td>
                                    <td className="py-3 px-4 whitespace-nowrap font-bold text-gray-900">{m.name}</td>
                                    <td className="py-3 px-4 whitespace-nowrap">{m.email}</td>
                                    <td className="py-3 px-4">
                                      <span className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${tone}`}>{label}</span>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {filtered.length > 0 && (
                        <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-3">
                          <div className="text-xs text-gray-600">
                            {`Mostrando ${Math.min(safePage * perPage + 1, filtered.length)}-${Math.min(safePage * perPage + perPage, filtered.length)} de ${filtered.length}`}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${safePage <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                              onClick={() => setMessagesPage(p => Math.max(0, p - 1))}
                              disabled={safePage <= 0}
                            >
                              Anterior
                            </button>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                              {`${safePage + 1}/${totalPages}`}
                            </div>
                            <button
                              type="button"
                              className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${safePage >= totalPages - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                              onClick={() => setMessagesPage(p => Math.min(totalPages - 1, p + 1))}
                              disabled={safePage >= totalPages - 1}
                            >
                              Siguiente
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                      {!selected ? (
                        <p className="text-gray-600">Seleccioná un mensaje para ver el detalle.</p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cliente</p>
                              <p className="text-lg font-black text-gray-900">{selected.name}</p>
                              <p className="text-sm text-gray-500">{selected.email}</p>
                            </div>
                            <div>
                              <span className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${isResponded ? 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/20' : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'}`}>
                                {isResponded ? 'Respondida' : 'Pendiente'}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Mensaje</p>
                            <div className="text-sm text-gray-900 whitespace-pre-wrap">{selected.message}</div>
                          </div>

                          {isResponded && (
                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-2">Respuesta</p>
                              <div className="text-sm text-gray-900 whitespace-pre-wrap">{selected.reply || '-'}</div>
                              <div className="mt-3 text-xs text-gray-600">
                                {selected.replied_at ? `Respondida: ${new Date(selected.replied_at).toLocaleString('es-AR')}` : ''}
                              </div>
                            </div>
                          )}

                          {!isResponded && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Respuesta</label>
                                <textarea
                                  value={contactReplyDraft}
                                  onChange={(e) => setContactReplyDraft(e.target.value)}
                                  rows={5}
                                  className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900"
                                  placeholder="Escribí la respuesta para el cliente..."
                                />
                              </div>
                              <button
                                type="button"
                                disabled={isSendingContactReply || !String(contactReplyDraft || '').trim()}
                                onClick={async () => {
                                  const ok = await saveContactMessageReply({ messageId: selected.id, replyText: contactReplyDraft })
                                  if (ok) {
                                    setContactReplyDraft('')
                                  }
                                }}
                                className={`w-full px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest ${isSendingContactReply || !String(contactReplyDraft || '').trim() ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#1E3A8A] text-white hover:bg-brandNav'}`}
                              >
                                {isSendingContactReply ? 'Enviando...' : 'Enviar respuesta'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold">Panel de Control de Stock</h2>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-[#111827] text-white font-black uppercase tracking-widest text-[10px]"
                  onClick={refreshProducts}
                >
                  Actualizar
                </button>
              </div>
            </div>

            {(isStock || isAdmin) && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Cargar producto nuevo</h3>
                      <p className="text-sm text-gray-500">Se guarda directamente en la base de datos.</p>
                    </div>
                  </div>
                  <form onSubmit={createProductFromStockPanel} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nombre</label>
                      <input value={name} onChange={e=>setName(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Nombre del producto" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Precio</label>
                      <input value={price} onChange={e=>setPrice(e.target.value)} type="number" min="0" className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Cantidad</label>
                      <input value={quantity} onChange={e=>setQuantity(e.target.value)} type="number" min="0" className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="0" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Categoría</label>
                      <input value={category} onChange={e=>setCategory(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Ej: Remeras" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Colores</label>
                      <input value={productColors} onChange={e=>setProductColors(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Ej: Negro, Blanco, Azul" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Talles</label>
                      <input value={productSizes} onChange={e=>setProductSizes(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Ej: S, M, L, XL" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Imagen (opcional)</label>
                      <input type="file" accept="image/*" onChange={onFileChange} className="block w-full file:mr-3 file:px-4 file:py-3 file:rounded-2xl file:border-0 file:bg-[#1E3A8A] file:text-white file:font-black file:uppercase file:tracking-widest text-sm" />
                      {preview && <img src={preview} alt="Vista previa" className="mt-3 w-24 h-24 rounded-2xl object-cover" />}
                    </div>
                    <div className="md:col-span-2 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={isCreatingStockProduct}
                        className={`px-5 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest ${isCreatingStockProduct ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isCreatingStockProduct ? 'Guardando...' : 'Cargar a BD'}
                      </button>
                      <button
                        type="button"
                        className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest"
                        onClick={() => { setName(''); setPrice(''); setCategory(''); setProductColors(''); setProductSizes(''); setSupplierId(''); setImageBase64(''); setPreview(''); setQuantity('') }}
                      >
                        Limpiar
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Control de devoluciones</h3>
                      <p className="text-sm text-gray-500">Registra la devolución y suma stock al producto.</p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest"
                      onClick={() => refreshReturns().catch(() => setReturnsLog([]))}
                    >
                      Actualizar
                    </button>
                  </div>

                  <form onSubmit={registerReturn} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nombre del producto</label>
                      <input
                        value={returnDraft.productName}
                        onChange={(e) => setReturnDraft(prev => ({ ...prev, productName: e.target.value }))}
                        className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900"
                        placeholder="Ej: Remera JJ"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Cantidad</label>
                      <input
                        value={returnDraft.qty}
                        onChange={(e) => setReturnDraft(prev => ({ ...prev, qty: e.target.value }))}
                        type="number"
                        min="1"
                        className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Pedido (opcional)</label>
                      <input
                        value={returnDraft.orderId}
                        onChange={(e) => setReturnDraft(prev => ({ ...prev, orderId: e.target.value }))}
                        className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900"
                        placeholder="#1234"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Motivo (opcional)</label>
                      <input
                        value={returnDraft.reason}
                        onChange={(e) => setReturnDraft(prev => ({ ...prev, reason: e.target.value }))}
                        className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900"
                        placeholder="Ej: Cambio de talle / Falla / Arrepentimiento"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        disabled={isRegisteringReturn}
                        className={`w-full px-5 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest ${isRegisteringReturn ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isRegisteringReturn ? 'Guardando...' : 'Registrar devolución'}
                      </button>
                    </div>
                  </form>

                  {(() => {
                    const term = (returnsSearch || '').toLowerCase()
                    const fromTs = returnsFrom ? new Date(`${returnsFrom}T00:00:00`).getTime() : null
                    const toTs = returnsTo ? new Date(`${returnsTo}T23:59:59`).getTime() : null
                    const filtered = (Array.isArray(returnsLog) ? returnsLog : []).filter(r => {
                      const rawTs = r?.created_at ? new Date(r.created_at).getTime() : null
                      if (fromTs != null && rawTs != null && rawTs < fromTs) return false
                      if (toTs != null && rawTs != null && rawTs > toTs) return false
                      if (!term) return true
                      const hay = [
                        r?.product_name,
                        r?.product_id,
                        r?.order_id,
                        r?.reason,
                        r?.created_by_name,
                        r?.created_by_email,
                      ].map(x => String(x || '').toLowerCase()).join(' ')
                      return hay.includes(term)
                    })

                    return (
                      <div className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Buscar</label>
                            <input
                              value={returnsSearch}
                              onChange={(e) => setReturnsSearch(e.target.value)}
                              className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900"
                              placeholder="Producto / pedido / motivo / usuario"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Desde</label>
                            <input
                              value={returnsFrom}
                              onChange={(e) => setReturnsFrom(e.target.value)}
                              type="date"
                              className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Hasta</label>
                            <input
                              value={returnsTo}
                              onChange={(e) => setReturnsTo(e.target.value)}
                              type="date"
                              className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900"
                            />
                          </div>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left border-b">
                                <th className="py-2 px-2">Fecha</th>
                                <th className="py-2 px-2">Producto</th>
                                <th className="py-2 px-2">Cant.</th>
                                <th className="py-2 px-2">Pedido</th>
                                <th className="py-2 px-2">Motivo</th>
                                <th className="py-2 px-2">Usuario</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.slice(0, 10).map(r => (
                                <tr key={r.id} className="border-b align-top">
                                  <td className="py-2 px-2 whitespace-nowrap">{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                                  <td className="py-2 px-2">{r.product_name || `Producto ${r.product_id}`}</td>
                                  <td className="py-2 px-2 font-black">{Number(r.qty) || 0}</td>
                                  <td className="py-2 px-2">{r.order_id || '-'}</td>
                                  <td className="py-2 px-2">{r.reason || '-'}</td>
                                  <td className="py-2 px-2">{(r.created_by_name || r.created_by_email) ? `${r.created_by_name || ''}${r.created_by_email ? ` (${r.created_by_email})` : ''}` : '-'}</td>
                                </tr>
                              ))}
                              {filtered.length === 0 && (
                                <tr><td colSpan={6} className="py-6 text-center text-gray-500">Sin devoluciones para el filtro aplicado.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })()}

                </div>
              </div>
            )}

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-4">
              <div className={`grid grid-cols-1 ${(isStock || isAdmin) ? '' : 'lg:grid-cols-[240px_minmax(0,1fr)]'} gap-4`}>
                {!(isStock || isAdmin) && (
                  <div className="space-y-2">
                    {[
                      { id: 'inventario', label: 'Inventario' },
                      { id: 'gestion', label: 'Gestión' },
                      { id: 'movimientos', label: 'Movimientos' },
                      { id: 'alertas', label: 'Alertas' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setInventorySection(t.id)}
                        className={`w-full text-left px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] ${inventorySection === t.id ? 'bg-blue-50 text-[#1E3A8A]' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="min-w-0">

            {inventorySection === 'inventario' && (() => {
              const term = (searchInv || '').toLowerCase()
              const cats = Array.from(new Set(products.map(p => String(p.category || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
              const list = products
                .filter(p => {
                  const matches = !term || (p.name || '').toLowerCase().includes(term) || (p.category || '').toLowerCase().includes(term)
                  const passCat = inventoryCategory === 'todas' || String(p.category || '').trim() === inventoryCategory
                  const st = statusInfo(p.quantity).label
                  const f = statusFilter
                  const passStatus = f === 'todos' || (f === 'ok' && st === 'OK') || (f === 'bajo' && st === 'Bajo') || (f === 'critico' && st === 'Crítico')
                  return matches && passCat && passStatus
                })
                .slice(0, 20)
              return (
                <div className="space-y-3">
                  <div className="bg-white text-slate-900 p-4 rounded-lg shadow-sm">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div>
                        <label className="block text-sm text-gray-700">Buscar</label>
                        <input value={searchInv} onChange={e => setSearchInv(e.target.value)} placeholder="Nombre o categoría" className="border border-gray-300 rounded p-2 w-56" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700">Categoría</label>
                        <select value={inventoryCategory} onChange={e => setInventoryCategory(e.target.value)} className="border border-gray-300 rounded p-2 w-48">
                          <option value="todas">Todas</option>
                          {cats.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700">Estado</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-300 rounded p-2 w-40">
                          <option value="todos">Todos</option>
                          <option value="ok">Stock disponible</option>
                          <option value="bajo">Stock bajo</option>
                          <option value="critico">Sin stock</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white text-slate-900 p-4 rounded-lg shadow-sm overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="py-2 px-2">Producto</th>
                          <th className="py-2 px-2">Categoría</th>
                          <th className="py-2 px-2">Stock total</th>
                          <th className="py-2 px-2">Stock por talle</th>
                          <th className="py-2 px-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map(p => {
                          const s = statusInfo(p.quantity)
                          const bySize = (inventoryStockBySize && typeof inventoryStockBySize === 'object')
                            ? (inventoryStockBySize[String(p.id)] || {})
                            : {}
                          const sizes = Object.keys(bySize || {}).filter(Boolean).sort((a, b) => a.localeCompare(b))
                          return (
                            <tr key={p.id} className="border-b align-top">
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-3">
                                  <div className="font-bold">{p.name}</div>
                                </div>
                              </td>
                              <td className="py-3 px-2">{p.category || '-'}</td>
                              <td className="py-3 px-2 font-black">{p.quantity ?? 0}</td>
                              <td className="py-3 px-2">
                                {sizes.length === 0 ? (
                                  <span className="text-xs text-gray-400">Sin talles cargados</span>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {sizes.map(sz => (
                                      <span key={sz} className="px-2 py-1 rounded-lg border border-gray-200 text-xs font-black text-gray-700">
                                        {sz}: {Number(bySize?.[sz]) || 0}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                <span className={`px-2 py-1 rounded ${s.className}`}>{s.label}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}

            {inventorySection === 'gestion' && (() => {
              const productIdNum = Number(inventoryMovementDraft.productId)
              const product = products.find(p => Number(p.id) === productIdNum) || null
              const pidKey = product ? String(product.id) : ''
              const bySize = (pidKey && inventoryStockBySize && typeof inventoryStockBySize === 'object') ? (inventoryStockBySize[pidKey] || {}) : {}
              const parsedSizes = product?.sizes
                ? String(product.sizes).split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                : []
              const sizeOptions = Array.from(new Set(['S', 'M', 'L', 'XL', ...Object.keys(bySize || {}), ...parsedSizes])).filter(Boolean)
              const currentSizeQty = inventoryMovementDraft.size ? (Number(bySize?.[String(inventoryMovementDraft.size).trim().toUpperCase()]) || 0) : 0
              return (
                <div className="bg-white text-slate-900 p-5 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Gestión de Stock</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-700">Producto</label>
                      <select
                        value={inventoryMovementDraft.productId}
                        onChange={(e) => setInventoryMovementDraft(prev => ({ ...prev, productId: e.target.value }))}
                        className="border border-gray-300 rounded p-2 w-full"
                      >
                        <option value="">Seleccionar producto</option>
                        {products
                          .slice()
                          .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700">Talle</label>
                      <select
                        value={inventoryMovementDraft.size}
                        onChange={(e) => setInventoryMovementDraft(prev => ({ ...prev, size: e.target.value }))}
                        className="border border-gray-300 rounded p-2 w-full"
                      >
                        <option value="">Seleccionar</option>
                        {sizeOptions.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={inventoryMovementDraft.qty}
                        onChange={(e) => setInventoryMovementDraft(prev => ({ ...prev, qty: e.target.value }))}
                        className="border border-gray-300 rounded p-2 w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700">Tipo</label>
                      <select
                        value={inventoryMovementDraft.type}
                        onChange={(e) => setInventoryMovementDraft(prev => ({ ...prev, type: e.target.value }))}
                        className="border border-gray-300 rounded p-2 w-full"
                      >
                        <option value="entrada">Entrada</option>
                        <option value="salida">Salida</option>
                        <option value="actualizar">Actualizar talle</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-[#1E3A8A] text-white font-black uppercase tracking-widest text-[10px]"
                      onClick={saveInventoryMovement}
                    >
                      Guardar Movimiento
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-800 font-black uppercase tracking-widest text-[10px]"
                      onClick={cancelInventoryMovement}
                    >
                      Cancelar
                    </button>
                    {product && (
                      <div className="ml-auto text-xs font-bold text-gray-500">
                        Stock total: <span className="text-gray-900">{Number(product.quantity) || 0}</span>
                        {inventoryMovementDraft.size && (
                          <> · {String(inventoryMovementDraft.size).trim().toUpperCase()}: <span className="text-gray-900">{currentSizeQty}</span></>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {inventorySection === 'movimientos' && (() => {
              const term = (inventoryMoveSearch || '').toLowerCase()
              const fromKey = inventoryMoveFrom ? String(inventoryMoveFrom) : ''
              const toKey = inventoryMoveTo ? String(inventoryMoveTo) : ''
              const list = (Array.isArray(inventoryMovements) ? inventoryMovements : [])
                .filter(m => {
                  const name = String(m?.productName || '').toLowerCase()
                  const size = String(m?.size || '').toLowerCase()
                  const tsKey = String(m?.ts || '').slice(0, 10)
                  const passTerm = !term || name.includes(term) || size.includes(term)
                  const passFrom = !fromKey || (tsKey && tsKey >= fromKey)
                  const passTo = !toKey || (tsKey && tsKey <= toKey)
                  return passTerm && passFrom && passTo
                })
              return (
                <div className="space-y-3">
                  <div className="bg-white text-slate-900 p-4 rounded-lg shadow-sm">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div>
                        <label className="block text-sm text-gray-700">Buscar</label>
                        <input value={inventoryMoveSearch} onChange={e => setInventoryMoveSearch(e.target.value)} placeholder="Producto o talle" className="border border-gray-300 rounded p-2 w-56" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700">Desde</label>
                        <input type="date" value={inventoryMoveFrom} onChange={e => setInventoryMoveFrom(e.target.value)} className="border border-gray-300 rounded p-2 w-44" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700">Hasta</label>
                        <input type="date" value={inventoryMoveTo} onChange={e => setInventoryMoveTo(e.target.value)} className="border border-gray-300 rounded p-2 w-44" />
                      </div>
                      <div className="ml-auto text-xs font-bold text-gray-500">
                        {list.length} registros
                      </div>
                    </div>
                  </div>

                  <div className="bg-white text-slate-900 p-4 rounded-lg shadow-sm overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="py-2 px-2">Fecha</th>
                          <th className="py-2 px-2">Producto</th>
                          <th className="py-2 px-2">Talle</th>
                          <th className="py-2 px-2">Tipo</th>
                          <th className="py-2 px-2">Cantidad</th>
                          <th className="py-2 px-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.length === 0 ? (
                          <tr><td colSpan={6} className="py-6 text-center text-gray-500">Sin movimientos registrados.</td></tr>
                        ) : (
                          list.map(m => (
                            <tr key={m.id} className="border-b">
                              <td className="py-2 px-2 whitespace-nowrap">{m.ts ? new Date(m.ts).toLocaleString('es-AR') : '-'}</td>
                              <td className="py-2 px-2">{m.productName || '-'}</td>
                              <td className="py-2 px-2">{m.size || '-'}</td>
                              <td className="py-2 px-2">{m.type === 'entrada' ? 'Entrada' : (m.type === 'salida' ? 'Salida' : 'Actualizar talle')}</td>
                              <td className="py-2 px-2">{m.type === 'actualizar' ? m.qty : `${m.type === 'salida' ? '-' : '+'}${m.qty}`}</td>
                              <td className="py-2 px-2">{m.total ?? '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}

            {inventorySection === 'alertas' && (() => {
              const term = (searchInv || '').toLowerCase()
              const cats = Array.from(new Set(products.map(p => String(p.category || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
              const list = products
                .filter(p => {
                  const matches = !term || (p.name || '').toLowerCase().includes(term) || (p.category || '').toLowerCase().includes(term)
                  const passCat = inventoryCategory === 'todas' || String(p.category || '').trim() === inventoryCategory
                  const st = statusInfo(p.quantity).label
                  return matches && passCat && (st === 'Crítico' || st === 'Bajo')
                })
                .sort((a, b) => (Number(a.quantity) || 0) - (Number(b.quantity) || 0))
              const minCrit = Number(settings?.minStock) || 2
              return (
                <div className="space-y-3">
                  <div className="bg-white text-slate-900 p-4 rounded-lg shadow-sm">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div>
                        <label className="block text-sm text-gray-700">Buscar</label>
                        <input value={searchInv} onChange={e => setSearchInv(e.target.value)} placeholder="Nombre o categoría" className="border border-gray-300 rounded p-2 w-56" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700">Categoría</label>
                        <select value={inventoryCategory} onChange={e => setInventoryCategory(e.target.value)} className="border border-gray-300 rounded p-2 w-48">
                          <option value="todas">Todas</option>
                          {cats.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="ml-auto text-xs font-bold text-gray-500">
                        {list.length} en alerta
                      </div>
                    </div>
                  </div>

                  {list.length === 0 ? (
                    <div className="bg-white text-slate-900 p-6 rounded-lg shadow-sm text-center text-gray-500">No hay productos en alerta.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {list.map(p => {
                        const s = statusInfo(p.quantity)
                        return (
                          <div key={p.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-black text-gray-900">{p.name}</div>
                                <div className="text-xs text-gray-500">{p.category || '-'}</div>
                              </div>
                              <span className={`px-2 py-1 rounded ${s.className}`}>{s.label === 'Crítico' ? 'SIN STOCK' : 'STOCK BAJO'}</span>
                            </div>
                            <div className="mt-4 text-sm text-gray-700">
                              Total: <span className="font-black">{p.quantity ?? 0}</span> · Mínimo: <span className="font-black">{minCrit}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usuarios */}
        {activeTab === 'dashboard' && isAdmin && (
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 mt-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-3">Usuarios</h2>
            {(!Array.isArray(users) || users.length === 0) && <p className="text-gray-600">Sin usuarios.</p>}
            <div className="divide-y">
              {Array.isArray(users) && users.map(u => (
                <div key={u.email} className="py-2">
                  <span className="font-medium">{u.name || 'Usuario'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ventas recientes */}
        {activeTab === 'dashboard' && isAdmin && (
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 mt-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-3">Ventas recientes</h2>
            {salesLog.length === 0 && <p className="text-gray-600">Sin ventas registradas.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.isArray(salesLog) && salesLog.map(v => (
                <div key={v.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-slate-900">
                  <div className="font-semibold">{v.name}</div>
                  <div className="text-sm text-gray-600">Cant: {v.quantity} · Total: ${v.total}</div>
                  <div className="text-xs text-gray-500">{new Date(v.ts).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pedidos */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            {(isAdmin || isSeller) && (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.35em] mb-4">Crear pedido</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input value={newOrder.customer} onChange={e=>setNewOrder(v=>({ ...v, customer: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Cliente" />
                  <input value={newOrder.productName} onChange={e=>setNewOrder(v=>({ ...v, productName: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Producto (texto)" />
                  <input type="number" min="1" value={newOrder.quantity} onChange={e=>setNewOrder(v=>({ ...v, quantity: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Cantidad" />
                  <button className="px-4 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest hover:bg-brandNav transition-colors" onClick={createOrder}>Crear</button>
                </div>
              </div>
            )}
            {(isAdmin || isSeller) && (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.35em] mb-4">Registrar venta directa</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input value={orderSale.name} onChange={e=>setOrderSale(v=>({ ...v, name: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900 md:col-span-2" placeholder="Nombre exacto del producto" />
                  <input type="number" min="1" value={orderSale.quantity} onChange={e=>setOrderSale(v=>({ ...v, quantity: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Cantidad" />
                  <button className="px-4 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-colors" onClick={registerSaleByName}>Registrar</button>
                </div>
                <p className="mt-2 text-xs text-gray-600">Busca por nombre exacto en el listado de productos.</p>
              </div>
            )}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.35em]">Listado de pedidos</div>
                {isSeller && (
                  <div className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl px-3 py-2 w-fit">
                    Listos para envío: {orders.filter(o => String(o.status || '').toLowerCase() === 'listo').length}
                  </div>
                )}
                {isStock && (
                  <div className="text-xs font-black uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 rounded-2xl px-3 py-2 w-fit">
                    Para preparar: {orders.filter(o => String(o.status || '').toLowerCase() === 'preparando').length}
                  </div>
                )}
              </div>
              {(() => {
                const perPage = 5
                const totalPages = Math.max(1, Math.ceil(orders.length / perPage))
                const safePage = Math.max(0, Math.min(ordersPage, totalPages - 1))
                const pagedOrders = orders.slice(safePage * perPage, safePage * perPage + perPage)
                return (
                  <>
                    {orders.length===0 ? (
                      <p className="text-gray-600">Sin pedidos registrados.</p>
                    ) : (
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="text-xs text-gray-600">
                          {`Mostrando ${Math.min(safePage * perPage + 1, orders.length)}-${Math.min(safePage * perPage + perPage, orders.length)} de ${orders.length}`}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${safePage <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                            onClick={() => setOrdersPage(p => Math.max(0, p - 1))}
                            disabled={safePage <= 0}
                          >
                            Anterior
                          </button>
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                            {`${safePage + 1}/${totalPages}`}
                          </div>
                          <button
                            type="button"
                            className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${safePage >= totalPages - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                            onClick={() => setOrdersPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={safePage >= totalPages - 1}
                          >
                            Siguiente
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {pagedOrders.map(o=> (
                        <div key={o.id} className="bg-gray-50 border border-gray-100 rounded-[2rem] p-5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900">Pedido #{o.id}</div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                          <div className="min-w-0">
                            <span className="text-gray-500">Nombre:</span>{' '}
                            <span className="text-slate-900 font-medium">{o.customerName || o.shipping?.recipient || '—'}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-gray-500">Apellido:</span>{' '}
                            <span className="text-slate-900 font-medium">{o.customerLastName || '—'}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-gray-500">Email:</span>{' '}
                            <span className="text-slate-900 font-medium break-all">{o.customerEmail || o.customer || '—'}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-gray-500">Dirección:</span>{' '}
                            <span className="text-slate-900 font-medium">
                              {o.shipping?.address ? `${o.shipping.address}${o.shipping.province ? `, ${o.shipping.province}` : ''}${o.shipping.postalCode ? ` (${o.shipping.postalCode})` : ''}` : '—'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="text-xs font-semibold text-gray-700 mb-1">Items</div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="text-left border-b">
                                  <th className="py-1 pr-4">Producto</th>
                                  <th className="py-1 pr-4">Color</th>
                                  <th className="py-1 pr-4">Talle</th>
                                  <th className="py-1 pr-2">Cantidad</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(Array.isArray(o.items) ? o.items : []).map((i, idx) => (
                                  <tr key={`${o.id}-${idx}`} className="border-b last:border-b-0">
                                    <td className="py-1 pr-4 font-medium">{i.name || '—'}</td>
                                    <td className="py-1 pr-4">{i.color || '—'}</td>
                                    <td className="py-1 pr-4">{i.talle || '—'}</td>
                                    <td className="py-1 pr-2">{i.qty ?? i.quantity ?? 1}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        {o.shipping?.tracking && (
                          <div className="text-xs text-emerald-600 mt-1">Seguimiento: {o.shipping.tracking}{o.shipping.carrier ? ` (${o.shipping.carrier})` : ''}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-start gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Estado:</span>
                          {isAdmin ? (
                            <select defaultValue={o.status} onChange={e=>updateOrderStatus(o.id, e.target.value)} className="bg-white border border-gray-100 rounded-2xl px-3 py-2 text-sm font-bold text-gray-900">
                              <option value="pendiente">Pendiente</option>
                              <option value="preparando">Preparando</option>
                              <option value="listo">Listo</option>
                              <option value="enviado">Enviado</option>
                              <option value="entregado">Entregado</option>
                              <option value="cancelado">Cancelado</option>
                            </select>
                          ) : (
                            <span className="text-sm font-semibold text-slate-900">{String(o.status || 'pendiente')}</span>
                          )}
                        </div>
                        {isSeller && String(o.status || '').toLowerCase() === 'pendiente' && (
                          <button type="button" className="px-4 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-colors" onClick={() => updateOrderStatus(o.id, 'preparando')}>
                            Enviar a stock
                          </button>
                        )}
                        {isStock && String(o.status || '').toLowerCase() === 'preparando' && (
                          <button type="button" className="px-4 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-colors" onClick={() => updateOrderStatus(o.id, 'listo')}>
                            Marcar listo
                          </button>
                        )}
                        {isSeller && String(o.status || '').toLowerCase() === 'listo' && (
                          <button type="button" className="px-4 py-3 bg-brandNav text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#1E3A8A] transition-colors" onClick={() => updateOrderStatus(o.id, 'enviado')}>
                            Marcar enviado
                          </button>
                        )}
                      </div>
                    </div>
                    {(isAdmin || isSeller) && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
                        <input value={(shipmentForms[o.id] && shipmentForms[o.id].recipient != null) ? shipmentForms[o.id].recipient : (o.shipping?.recipient || '')} onChange={e=>updateShipmentForm(o.id,'recipient',e.target.value)} className="w-full bg-white border border-gray-100 rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Destinatario" />
                        <input value={(shipmentForms[o.id] && shipmentForms[o.id].address != null) ? shipmentForms[o.id].address : (o.shipping?.address || '')} onChange={e=>updateShipmentForm(o.id,'address',e.target.value)} className="w-full bg-white border border-gray-100 rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Dirección" />
                        <input value={(shipmentForms[o.id] && shipmentForms[o.id].province != null) ? shipmentForms[o.id].province : (o.shipping?.province || '')} onChange={e=>updateShipmentForm(o.id,'province',e.target.value)} className="w-full bg-white border border-gray-100 rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Provincia" />
                        <input value={(shipmentForms[o.id] && shipmentForms[o.id].postalCode != null) ? shipmentForms[o.id].postalCode : (o.shipping?.postalCode || '')} onChange={e=>updateShipmentForm(o.id,'postalCode',e.target.value)} className="w-full bg-white border border-gray-100 rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Código Postal" />
                        <button className="px-4 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest hover:bg-brandNav transition-colors" onClick={()=>createShipmentForOrder(o.id)}>Generar envío</button>
                      </div>
                    )}
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Devoluciones de pedidos */}
        {activeTab === 'order-returns' && (
          <div className="space-y-5">
            <div className="flex items-center justify-end">
              <button className="px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors" onClick={()=>refreshOrderReturns()}>
                Actualizar
              </button>
            </div>

            {isSeller && (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.35em] mb-4">Nueva solicitud</div>
                <form onSubmit={createOrderReturnRequest} className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <select
                    value={orderReturnDraft.orderId}
                    onChange={e=>setOrderReturnDraft(v=>({ ...v, orderId: e.target.value, orderItemId: '' }))}
                    className="bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900 md:col-span-2"
                  >
                    <option value="">Seleccionar pedido</option>
                    {(Array.isArray(orders) ? orders : []).map(o => (
                      <option key={o.id} value={String(o.id)}>
                        {`#${o.id} - ${(o.customerName || '').trim()} ${(o.customerLastName || '').trim()} ${(o.customerEmail || o.customer || '').trim()}`.trim()}
                      </option>
                    ))}
                  </select>

                  {(() => {
                    const selectedOrder = (Array.isArray(orders) ? orders : []).find(o => String(o.id) === String(orderReturnDraft.orderId)) || null
                    const items = Array.isArray(selectedOrder?.items) ? selectedOrder.items : []
                    const selectedItem = items.find(it => String(it.id) === String(orderReturnDraft.orderItemId)) || null
                    const maxQty = selectedItem ? Number(selectedItem.qty ?? selectedItem.quantity ?? 0) || 0 : 0
                    return (
                      <>
                        <select
                          value={orderReturnDraft.orderItemId}
                          onChange={e=>setOrderReturnDraft(v=>({ ...v, orderItemId: e.target.value }))}
                          className="bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900 md:col-span-2"
                          disabled={!orderReturnDraft.orderId}
                        >
                          <option value="">{orderReturnDraft.orderId ? 'Seleccionar item' : 'Elegí un pedido'}</option>
                          {items.map((i, idx) => (
                            <option key={`${i.id ?? idx}`} value={String(i.id ?? '')}>
                              {`${i.name || '—'}${i.color ? ` / ${i.color}` : ''}${i.talle ? ` / ${i.talle}` : ''} (máx ${i.qty ?? i.quantity ?? 1})`}
                            </option>
                          ))}
                        </select>

                        <input
                          value={orderReturnDraft.qty}
                          onChange={e=>setOrderReturnDraft(v=>({ ...v, qty: e.target.value }))}
                          className="bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900"
                          type="number"
                          min="1"
                          max={maxQty > 0 ? String(maxQty) : undefined}
                          placeholder="Cantidad"
                          disabled={!orderReturnDraft.orderItemId}
                        />
                      </>
                    )
                  })()}

                  <input
                    value={orderReturnDraft.reason}
                    onChange={e=>setOrderReturnDraft(v=>({ ...v, reason: e.target.value }))}
                    className="bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900 md:col-span-2"
                    placeholder="Motivo (opcional)"
                  />

                  <button
                    className="px-4 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest hover:bg-brandNav transition-colors md:col-span-2 disabled:opacity-60"
                    disabled={isCreatingOrderReturn}
                  >
                    {isCreatingOrderReturn ? 'Enviando...' : 'Solicitar devolución'}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
              {(() => {
                const list = Array.isArray(orderReturns) ? orderReturns : []
                const visible = list.filter(r => {
                  const st = String(r?.status || '').toLowerCase()
                  if (isStock) return st === 'aprobada'
                  if (isSeller) return st === 'solicitada' || st === 'recibida' || st === 'reembolsada' || st === 'rechazada'
                  return true
                })
                const statusRank = (status) => {
                  const st = String(status || '').toLowerCase()
                  if (st === 'solicitada') return 0
                  if (st === 'aprobada') return 1
                  if (st === 'recibida') return 2
                  if (st === 'reembolsada') return 99
                  if (st === 'rechazada') return 100
                  return 50
                }
                const sorted = [...visible].sort((a, b) => {
                  const ra = statusRank(a?.status)
                  const rb = statusRank(b?.status)
                  if (ra !== rb) return ra - rb
                  const ta = new Date(a?.created_at || a?.createdAt || 0).getTime()
                  const tb = new Date(b?.created_at || b?.createdAt || 0).getTime()
                  if (tb !== ta) return tb - ta
                  return (Number(b?.id) || 0) - (Number(a?.id) || 0)
                })

                if (sorted.length === 0) return <p className="text-gray-600">Sin devoluciones para mostrar.</p>

                return (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="py-2 pr-4">Pedido</th>
                          <th className="py-2 pr-4">Cliente</th>
                          <th className="py-2 pr-4">Producto</th>
                          <th className="py-2 pr-4">Color</th>
                          <th className="py-2 pr-4">Talle</th>
                          <th className="py-2 pr-4">Cant.</th>
                          <th className="py-2 pr-4">Motivo</th>
                          <th className="py-2 pr-4">Estado</th>
                          <th className="py-2 pr-2">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map(r => {
                          const st = String(r?.status || '').toLowerCase()
                          const canApproveReject = isSeller && st === 'solicitada'
                          const canReceive = isStock && st === 'aprobada'
                          const canRefund = isSeller && st === 'recibida'
                          return (
                            <tr key={r.id} className="border-b last:border-b-0 align-top">
                              <td className="py-2 pr-4 font-medium">{r.order_id ? `#${r.order_id}` : '—'}</td>
                              <td className="py-2 pr-4">
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-900">
                                    {`${r.customer_name || ''} ${r.customer_lastname || ''}`.trim() || '—'}
                                  </div>
                                  <div className="text-xs text-gray-600 break-all">{r.customer_email || '—'}</div>
                                </div>
                              </td>
                              <td className="py-2 pr-4">{r.product_name || '—'}</td>
                              <td className="py-2 pr-4">{r.color || '—'}</td>
                              <td className="py-2 pr-4">{r.talle || '—'}</td>
                              <td className="py-2 pr-4">{r.qty ?? 1}</td>
                              <td className="py-2 pr-4">{r.reason || '—'}</td>
                              <td className="py-2 pr-4">
                                <span className="inline-flex px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-800">
                                  {st || '—'}
                                </span>
                              </td>
                              <td className="py-2 pr-2">
                                <div className="flex flex-col gap-2">
                                  {canApproveReject && (
                                    <div className="flex gap-2">
                                      <button type="button" className="px-4 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-colors" onClick={() => updateOrderReturnStatus(r.id, 'aprobada')}>
                                        Aprobar
                                      </button>
                                      <button type="button" className="px-4 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-colors" onClick={() => updateOrderReturnStatus(r.id, 'rechazada')}>
                                        Rechazar
                                      </button>
                                    </div>
                                  )}
                                  {canReceive && (
                                    <button type="button" className="px-4 py-3 bg-[#1E3A8A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brandNav transition-colors" onClick={() => updateOrderReturnStatus(r.id, 'recibida')}>
                                      Producto recibido
                                    </button>
                                  )}
                                  {canRefund && (
                                    <button type="button" className="px-4 py-3 bg-brandNav text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1E3A8A] transition-colors" onClick={() => updateOrderReturnStatus(r.id, 'reembolsada')}>
                                      Reembolsar
                                    </button>
                                  )}
                                  {!canApproveReject && !canReceive && !canRefund && (
                                    <span className="text-xs text-gray-500">—</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Proveedores */}
        {activeTab === 'suppliers' && (
          <div className="space-y-5">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.35em] mb-4">{editingSupplierId ? 'Editar proveedor' : 'Agregar proveedor'}</div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input value={editingSupplierId ? editSupplierFields.name : newSupplier.name} onChange={e=>editingSupplierId ? setEditSupplierFields(v=>({ ...v, name: e.target.value })) : setNewSupplier(v=>({ ...v, name: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Nombre" />
                <input value={editingSupplierId ? editSupplierFields.contact : newSupplier.contact} onChange={e=>editingSupplierId ? setEditSupplierFields(v=>({ ...v, contact: e.target.value })) : setNewSupplier(v=>({ ...v, contact: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Contacto" />
                <input value={editingSupplierId ? editSupplierFields.email : newSupplier.email} onChange={e=>editingSupplierId ? setEditSupplierFields(v=>({ ...v, email: e.target.value })) : setNewSupplier(v=>({ ...v, email: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Email" />
                <input value={editingSupplierId ? editSupplierFields.phone : newSupplier.phone} onChange={e=>editingSupplierId ? setEditSupplierFields(v=>({ ...v, phone: e.target.value })) : setNewSupplier(v=>({ ...v, phone: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Teléfono" />
                {editingSupplierId ? (
                  <div className="flex gap-2">
                    <button className="px-4 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest hover:bg-brandNav transition-colors flex-1" onClick={saveEditSupplier}>Guardar</button>
                    <button className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors flex-1" onClick={()=>setEditingSupplierId(null)}>Cancelar</button>
                  </div>
                ) : (
                  <button className="px-4 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest hover:bg-brandNav transition-colors" onClick={addSupplier}>Agregar</button>
                )}
              </div>
              <textarea value={editingSupplierId ? editSupplierFields.notes : newSupplier.notes} onChange={e=>editingSupplierId ? setEditSupplierFields(v=>({ ...v, notes: e.target.value })) : setNewSupplier(v=>({ ...v, notes: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900 mt-3" placeholder="Notas"></textarea>
            </div>
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.35em] mb-4">Listado de proveedores</div>
              {suppliers.length===0 && <p className="text-gray-600">Sin proveedores registrados.</p>}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 px-2">ID</th>
                      <th className="py-2 px-2">Nombre</th>
                      <th className="py-2 px-2">Contacto</th>
                      <th className="py-2 px-2">Email</th>
                      <th className="py-2 px-2">Teléfono</th>
                      {isAdmin && <th className="py-2 px-2">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map(s=> (
                      <tr key={s.id} className="border-b">
                        <td className="py-2 px-2">{s.id}</td>
                        <td className="py-2 px-2 font-medium">{s.name}</td>
                        <td className="py-2 px-2">{s.contact}</td>
                        <td className="py-2 px-2">{s.email}</td>
                        <td className="py-2 px-2">{s.phone}</td>
                        {isAdmin && (
                          <td className="py-2 px-2">
                            <div className="flex gap-2">
                              <button onClick={()=>startEditSupplier(s)} className="px-3 py-2 bg-[#1E3A8A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brandNav transition-colors">Editar</button>
                              <button onClick={()=>deleteSupplier(s.id)} className="px-3 py-2 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-colors">Eliminar</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Roles */}
        {activeTab === 'clients' && (
          <div className="space-y-5">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.35em]">{editingClientId ? 'Editar usuario' : 'Agregar usuario'}</div>
                  <p className="text-sm text-gray-600 mt-2">Desde acá podés crear accesos para el panel y asignarles el rol correspondiente.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <input value={editingClientId ? editClientFields.name : newClient.name} onChange={e=>editingClientId ? setEditClientFields(v=>({ ...v, name: e.target.value })) : setNewClient(v=>({ ...v, name: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Nombre" />
                <input value={editingClientId ? editClientFields.email : newClient.email} onChange={e=>editingClientId ? setEditClientFields(v=>({ ...v, email: e.target.value })) : setNewClient(v=>({ ...v, email: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Email" />
                <input value={editingClientId ? editClientFields.password : newClient.password} onChange={e=>editingClientId ? setEditClientFields(v=>({ ...v, password: e.target.value })) : setNewClient(v=>({ ...v, password: e.target.value }))} type="password" className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder={editingClientId ? 'Nueva contraseña (opcional)' : 'Contraseña'} />
                <select value={editingClientId ? editClientFields.role : newClient.role} onChange={e=>editingClientId ? setEditClientFields(v=>({ ...v, role: e.target.value })) : setNewClient(v=>({ ...v, role: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900">
                  {panelRoleOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={editingClientId ? editClientFields.is_verified : newClient.is_verified} onChange={e=>editingClientId ? setEditClientFields(v=>({ ...v, is_verified: e.target.checked })) : setNewClient(v=>({ ...v, is_verified: e.target.checked }))} />
                  <span className="text-sm">Verificado</span>
                </div>
                {editingClientId ? (
                  <div className="flex gap-2">
                    <button className="px-4 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest hover:bg-brandNav transition-colors flex-1" onClick={saveEditClient}>Guardar</button>
                    <button className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors flex-1" onClick={()=>{ setEditingClientId(null); setEditClientFields({ name: '', email: '', password: '', is_verified: false, role: 'vendedor' }) }}>Cancelar</button>
                  </div>
                ) : (
                  <button className="px-4 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest hover:bg-brandNav transition-colors" onClick={addClient}>Agregar</button>
                )}
              </div>
            </div>
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.35em] mb-4">Usuarios y roles</div>
              {panelUsers.length === 0 && <p className="text-gray-600">Sin usuarios del panel registrados.</p>}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 px-2">ID/Email</th>
                      <th className="py-2 px-2">Nombre</th>
                      <th className="py-2 px-2">Verificado</th>
                      <th className="py-2 px-2">Rol</th>
                      <th className="py-2 px-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {panelUsers.map(u => (
                      <tr key={u.email} className="border-b">
                        <td className="py-2 px-2">{u.email}</td>
                        <td className="py-2 px-2 font-medium">{u.name || 'Sin nombre'}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${u.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {u.is_verified ? 'Sí' : 'No'}
                          </span>
                        </td>
                        <td className="py-2 px-2">{formatUserRole(u.role || 'client')}</td>
                        <td className="py-2 px-2">
                          <div className="flex gap-2">
                            <button onClick={()=>startEditClient(u)} className="px-3 py-2 bg-[#1E3A8A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brandNav transition-colors">Editar</button>
                            <button onClick={()=>deleteClient(u.id || u.email)} className="px-3 py-2 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-colors">Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales-report' && isAdmin && (
          <div className="space-y-5">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.35em]">Ventas por producto</div>
                <div className="flex gap-2">
                  <button className="px-4 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest hover:bg-brandNav transition-colors disabled:opacity-60" onClick={printSalesReport} disabled={reportLoading}>
                    Descargar PDF
                  </button>
                  <button className="px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-60" onClick={loadReports} disabled={reportLoading}>
                    {reportLoading ? 'Cargando...' : 'Actualizar'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-700">Desde (opcional)</label>
                  <input type="date" value={reportRange.from} onChange={e=>setReportRange(v=>({ ...v, from: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Hasta (opcional)</label>
                  <input type="date" value={reportRange.to} onChange={e=>setReportRange(v=>({ ...v, to: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                </div>
                <div className="flex items-end">
                  <button className="w-full px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-60" onClick={loadReports} disabled={reportLoading}>
                    Generar Reporte
                  </button>
                </div>
              </div>

              <div className="border border-gray-100 rounded-[2rem] overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-widest text-gray-600">Productos vendidos</div>
                  <div className="text-xs text-gray-600">{(reportData.sold || []).length} items</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 px-2">Producto</th>
                        <th className="py-2 px-2">Vendidos</th>
                        <th className="py-2 px-2">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData.sold || []).map((r, i) => (
                        <tr key={`${r.id || r.name}-${i}`} className="border-b">
                          <td className="py-2 px-2">{r.name}</td>
                          <td className="py-2 px-2">{r.sold}</td>
                          <td className="py-2 px-2">ARS {Number(r.revenue || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                      {(reportData.sold || []).length === 0 && (
                        <tr><td className="py-3 px-2 text-gray-500" colSpan={3}>Sin ventas registradas.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stock-report' && isAdmin && (
          <div className="space-y-5">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.35em]">Stock bajo</div>
                <div className="flex gap-2">
                  <button className="px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-60" onClick={loadReports} disabled={reportLoading}>
                    {reportLoading ? 'Cargando...' : 'Actualizar'}
                  </button>
                  <button className="px-4 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest hover:bg-brandNav transition-colors disabled:opacity-60" onClick={printStockReport} disabled={reportLoading}>
                    Descargar PDF
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700">Stock bajo (≤)</label>
                  <input type="number" min="0" value={settings.minStock} onChange={e=>setSettings(v=>({ ...v, minStock: Number(e.target.value)||0 }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                </div>
                <div className="flex items-end">
                  <button className="w-full px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-60" onClick={loadReports} disabled={reportLoading}>
                    Generar Reporte
                  </button>
                </div>
              </div>

              <div className="border border-gray-100 rounded-[2rem] overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-widest text-gray-600">Productos faltantes</div>
                  <div className="text-xs text-gray-600">{(reportData.faltantes || []).length} items</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 px-2">Producto</th>
                        <th className="py-2 px-2">Categoría</th>
                        <th className="py-2 px-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData.faltantes || []).map((r, i) => (
                        <tr key={`${r.id}-${i}`} className="border-b">
                          <td className="py-2 px-2">{r.name}</td>
                          <td className="py-2 px-2">{r.category || '-'}</td>
                          <td className="py-2 px-2">{r.quantity}</td>
                        </tr>
                      ))}
                      {(reportData.faltantes || []).length === 0 && (
                        <tr><td className="py-3 px-2 text-gray-500" colSpan={3}>Sin faltantes para el umbral seleccionado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuración */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            <div className="flex items-center justify-end">
              <button className="px-4 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest hover:bg-brandNav transition-colors" onClick={saveSettings}>Guardar</button>
            </div>
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-700">Stock mínimo crítico</label>
                  <input type="number" min="0" value={settings.minStock} onChange={e=>setSettings(v=>({ ...v, minStock: Number(e.target.value)||0 }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Nombre admin</label>
                  <input value={settings.adminName} onChange={e=>setSettings(v=>({ ...v, adminName: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Email admin</label>
                  <input value={settings.adminEmail} onChange={e=>setSettings(v=>({ ...v, adminEmail: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Contraseña admin</label>
                  <input type="password" value={settings.adminPassword} onChange={e=>setSettings(v=>({ ...v, adminPassword: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                </div>
              </div>
              <div className="mt-6 border-t border-gray-100 pt-6">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.35em] mb-4">Datos de la empresa (membrete)</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700">Nombre de la empresa</label>
                    <input value={settings.companyName} onChange={e=>setSettings(v=>({ ...v, companyName: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="JJ Indumentaria" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700">CUIT</label>
                    <input value={settings.companyCuit} onChange={e=>setSettings(v=>({ ...v, companyCuit: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="XX-XXXXXXXX-X" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700">Dirección</label>
                    <input value={settings.companyAddress} onChange={e=>setSettings(v=>({ ...v, companyAddress: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Calle 123" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700">Ciudad / Provincia</label>
                    <input value={settings.companyCity} onChange={e=>setSettings(v=>({ ...v, companyCity: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Buenos Aires" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700">Teléfono</label>
                    <input value={settings.companyPhone} onChange={e=>setSettings(v=>({ ...v, companyPhone: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="+54 9 ..." />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700">Email empresa</label>
                    <input value={settings.companyEmail} onChange={e=>setSettings(v=>({ ...v, companyEmail: e.target.value }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="contacto@..." />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm text-gray-700">Logo (archivo)</label>
                    <input type="file" accept="image/*" onChange={onCompanyLogoChange} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                    {settings.companyLogo ? (
                      <img src={settings.companyLogo} alt="logo empresa" className="mt-3 w-40 h-40 object-cover rounded-2xl border border-gray-100 bg-white" />
                    ) : (
                      <p className="text-xs text-gray-500 mt-2">Sin logo cargado.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inicio (Home) */}
        {activeTab === 'home' && (
          <div className="space-y-5">
            <div className="flex items-center justify-end">
              <button className="px-4 py-3 rounded-2xl bg-[#1E3A8A] text-white text-xs font-black uppercase tracking-widest hover:bg-brandNav transition-colors" onClick={saveHomeCfg}>Guardar</button>
            </div>
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
              <p className="text-sm text-gray-700 mb-3">Configura las imágenes y textos del carrusel de la portada.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0,1,2].map(i => (
                  <div key={i} className="bg-gray-50 border border-gray-100 rounded-[2rem] p-4">
                    <label className="block text-sm text-gray-700">Imagen {i+1} (archivo)</label>
                    <input type="file" accept="image/*" onChange={(e)=>onHomeImageFileChange(i, e)} className="w-full bg-white border border-gray-100 rounded-2xl p-3 text-sm font-bold text-gray-900" />
                    <label className="block text-sm text-gray-700 mt-2">Imagen {i+1} (ruta o URL)</label>
                    <input value={homeCfg.images[i] || ''} onChange={e=>onHomeImageUrlChange(i, e.target.value)} className="w-full bg-white border border-gray-100 rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="/img/mi-imagen.jpg" />
                    {homeCfg.images[i] ? (
                      <img src={homeCfg.images[i]} alt={`Slide ${i+1}`} className="mt-2 w-full h-32 object-cover rounded-2xl border border-gray-100 bg-white" />
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">Sin imagen seleccionada</p>
                    )}
                    <label className="block text-sm text-gray-700 mt-2">Leyenda {i+1}</label>
                    <input value={homeCfg.captions[i] || ''} onChange={e=>{
                      const v = e.target.value
                      setHomeCfg(cfg => ({ ...cfg, captions: cfg.captions.map((x, idx) => idx===i ? v : x) }))
                    }} className="w-full bg-white border border-gray-100 rounded-2xl p-3 text-sm font-bold text-gray-900" placeholder="Texto descriptivo" />
                    <div className="mt-2 flex gap-2">
                      <button type="button" className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors" onClick={()=>setHomeCfg(cfg=>({ ...cfg, images: cfg.images.map((x, idx)=> idx===i ? '' : x) }))}>Quitar</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <div>
                  <label className="block text-sm text-gray-700">Intervalo (ms)</label>
                  <input type="number" min="1000" max="60000" value={homeCfg.intervalMs} onChange={e=>setHomeCfg(cfg => ({ ...cfg, intervalMs: Number(e.target.value)||3000 }))} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-900" />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" checked={!!homeCfg.pauseOnHover} onChange={e=>setHomeCfg(cfg => ({ ...cfg, pauseOnHover: e.target.checked }))} />
                  <span className="text-sm text-gray-700">Pausar al pasar el mouse</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
    </main>
    </div>
  )
}

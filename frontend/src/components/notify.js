export function notify(message, type = 'info') {
  try {
    const detail = { message: String(message || ''), type }
    window.dispatchEvent(new CustomEvent('notify', { detail }))
  } catch {
    // no-op
  }
}

export default notify
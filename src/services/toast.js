// Global toast bridge — allows services to trigger toasts without React context
let _handler = null

export function registerToastHandler(fn) {
  _handler = fn
}

export function showToastGlobal(msg, type = 'success') {
  if (_handler) _handler(msg, type)
  else console.log(`[Toast] ${type}: ${msg}`)
}

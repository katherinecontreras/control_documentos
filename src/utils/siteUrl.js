export function getSiteUrl() {
  const fromEnv = String(import.meta.env.VITE_SITE_URL || '').trim()
  const origin = String(window.location.origin || '').trim()

  // Si en producción el env quedó apuntando a localhost, ignorarlo.
  const envIsLocalhost = /^https?:\/\/localhost(?::\d+)?$/i.test(fromEnv)
  const base = import.meta.env.PROD && envIsLocalhost ? origin : (fromEnv || origin)

  return base.endsWith('/') ? base.slice(0, -1) : base
}


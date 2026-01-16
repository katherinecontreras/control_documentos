import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/api/supabase'

/**
 * Notificaciones (tabla `notificaciones` + `notificaciones_vistas`)
 * - Carga últimas notificaciones
 * - Calcula no vistas para el usuario
 * - Suscripción Realtime a INSERT en `notificaciones`
 * - Marcar como vistas (upsert en `notificaciones_vistas`)
 */
export function useNotifications({ id_usuario, pageSize = 30 } = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])
  const [seenIds, setSeenIds] = useState(() => new Set())

  const channelRef = useRef(null)

  const unseenCount = useMemo(() => {
    if (!items?.length) return 0
    let c = 0
    for (const n of items) {
      if (!seenIds.has(n.id_notificacion)) c += 1
    }
    return c
  }, [items, seenIds])

  const loadSeenFor = useCallback(
    async (notifIds) => {
      if (!id_usuario) return
      const ids = (notifIds || []).filter(Boolean)
      if (ids.length === 0) return

      const { data, error: e } = await supabase
        .from('notificaciones_vistas')
        .select('id_notificacion')
        .eq('id_usuario', id_usuario)
        .in('id_notificacion', ids)

      if (e) throw e

      setSeenIds((prev) => {
        const next = new Set(prev)
        for (const r of data || []) next.add(r.id_notificacion)
        return next
      })
    },
    [id_usuario]
  )

  const fetchLatest = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: e } = await supabase
        .from('notificaciones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(pageSize)

      if (e) throw e
      setItems(data || [])
      await loadSeenFor((data || []).map((x) => x.id_notificacion))
    } catch (e) {
      console.error('Error al cargar notificaciones:', e)
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [pageSize, loadSeenFor])

  const markAsSeen = useCallback(
    async (notifIds) => {
      if (!id_usuario) return
      const ids = Array.from(new Set((notifIds || []).filter(Boolean)))
      if (ids.length === 0) return

      // Optimista (para badge inmediato)
      setSeenIds((prev) => {
        const next = new Set(prev)
        for (const id of ids) next.add(id)
        return next
      })

      const rows = ids.map((id_notificacion) => ({ id_notificacion, id_usuario }))
      const { error: e } = await supabase
        .from('notificaciones_vistas')
        .upsert(rows, { onConflict: 'id_notificacion,id_usuario' })

      if (e) {
        console.error('Error al marcar notificaciones como vistas:', e)
        // No revertimos para evitar "parpadeo", pero dejamos el log.
      }
    },
    [id_usuario]
  )

  const markAllLoadedAsSeen = useCallback(async () => {
    await markAsSeen(items.map((x) => x.id_notificacion))
  }, [items, markAsSeen])

  useEffect(() => {
    // Si cambia el usuario, reseteamos estado
    setItems([])
    setSeenIds(new Set())
    setError(null)
    if (!id_usuario) return
    fetchLatest()
  }, [id_usuario, fetchLatest])

  useEffect(() => {
    if (!id_usuario) return

    // Realtime: nuevos eventos (INSERT) en notificaciones
    const ch = supabase
      .channel('realtime:notificaciones')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones' },
        async (payload) => {
          const n = payload?.new
          if (!n?.id_notificacion) return

          setItems((prev) => {
            // Evitar duplicados
            if (prev.some((x) => x.id_notificacion === n.id_notificacion)) return prev
            return [n, ...(prev || [])].slice(0, pageSize)
          })

          // Si ya estaba vista (por ejemplo, por otra pestaña), la marcamos como vista localmente
          try {
            await loadSeenFor([n.id_notificacion])
          } catch (e) {
            // ignore
          }
        }
      )
      .subscribe()

    channelRef.current = ch
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      } else {
        supabase.removeChannel(ch)
      }
    }
  }, [id_usuario, pageSize, loadSeenFor])

  return {
    loading,
    error,
    items,
    unseenCount,
    fetchLatest,
    markAsSeen,
    markAllLoadedAsSeen,
    isSeen: (id) => seenIds.has(id),
  }
}


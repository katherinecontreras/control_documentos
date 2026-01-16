import { useEffect, useMemo, useRef } from 'react'

/**
 * Popover controlado (dropdown) anclado al trigger.
 *
 * Props:
 * - open: boolean
 * - onOpenChange: (next:boolean) => void
 * - trigger: ({ open, toggle, setOpen }) => ReactNode
 * - children: contenido del panel
 * - align: 'start' | 'center' | 'end' (default: 'end')
 * - widthClass: clases tailwind para el ancho (default: 'w-72')
 * - panelClassName: clases extra para el panel
 * - sideOffsetClass: clases para el margen superior (default: 'mt-2')
 * - closeOnOutsideClick: boolean (default: true)
 * - closeOnEsc: boolean (default: true)
 */
export default function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  align = 'end',
  widthClass = 'w-72',
  panelClassName = '',
  sideOffsetClass = 'mt-2',
  closeOnOutsideClick = true,
  closeOnEsc = true,
}) {
  const wrapRef = useRef(null)

  const alignClass = useMemo(() => {
    if (align === 'start') return 'left-0'
    if (align === 'center') return 'left-1/2 -translate-x-1/2'
    return 'right-0'
  }, [align])

  useEffect(() => {
    if (!open) return

    const onDown = (e) => {
      if (!closeOnOutsideClick) return
      const t = e.target
      if (!wrapRef.current?.contains?.(t)) onOpenChange?.(false)
    }
    const onKeyDown = (e) => {
      if (!closeOnEsc) return
      if (e.key === 'Escape') onOpenChange?.(false)
    }

    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, closeOnOutsideClick, closeOnEsc, onOpenChange])

  const setOpen = (next) => onOpenChange?.(Boolean(next))
  const toggle = () => onOpenChange?.(!open)

  return (
    <div ref={wrapRef} className="relative inline-block">
      {typeof trigger === 'function' ? trigger({ open, toggle, setOpen }) : null}
      {open ? (
        <div
          className={[
            'absolute top-full z-50',
            alignClass,
            sideOffsetClass,
            widthClass,
            'bg-white rounded-xl shadow-2xl border border-purple-100 overflow-hidden',
            panelClassName,
          ].join(' ')}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}


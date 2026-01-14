import React from 'react'

/**
 * Header reutilizable (diseño de Proyectos + Auth).
 *
 * Variants:
 * - page: header de página con título grande + acciones a la derecha
 * - section: título centrado con borde inferior (Auth: Login/Register)
 */
export default function Header({ variant = 'page', title, actions, className = '' }) {
  if (variant === 'section') {
    return (
      <h2
        className={[
          'text-2xl font-bold text-purple-600 border-b-2 border-purple-600 pb-4 text-center mb-6',
          className,
        ].join(' ')}
      >
        {title}
      </h2>
    )
  }

  return (
    <div
      className={[
        'flex items-center justify-between mb-8 pb-4 border-b-2 border-purple-600',
        className,
      ].join(' ')}
    >
      <h1 className="text-3xl font-bold text-purple-600">{title}</h1>
      <div>{actions}</div>
    </div>
  )
}

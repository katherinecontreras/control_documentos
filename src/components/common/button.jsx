import React from 'react'

    export default function button({type, disabled, loading, children, onClick}) {
  return (
    <button
        type={type}
        disabled={disabled || loading}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl text-base font-semibold transition-all duration-300 shadow-[0_4px_15px_rgba(147,51,234,0.3)] hover:shadow-[0_6px_20px_rgba(147,51,234,0.4)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        onClick={onClick}
    >
        {loading ? 'Cargando...' : children}
    </button>
  )
}

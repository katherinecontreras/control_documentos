import React from 'react'

export default function loadingData() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        <p className="mt-4 text-gray-600 text-sm">Cargando datos...</p>
    </div>
  )
}

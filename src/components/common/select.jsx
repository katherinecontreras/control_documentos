import React from 'react'

export default function select({label, value, onChange, options, className}) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <select
        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 bg-white cursor-pointer"
        value={value}
        onChange={onChange}
        required
      >
        <option value="">Selecciona {label}</option>
        {options.map((option) =>{
          let tipo = option.tipo || option.nombre;
          return (
          <option key={option.id} value={option.id}>
            {tipo} - {option.descripcion}
          </option>
        )})}
      </select>
    </div>
  )
}

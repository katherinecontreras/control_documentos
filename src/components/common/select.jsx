import React from 'react'

export default function select({label, value, onChange, options, className, required = true, disabled = false}) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <select
        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 bg-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
      >
        <option value="">Selecciona {label}</option>
        {options && Array.isArray(options) && options.map((option,index) =>{
          let texto = "";
          if(label === "Rol"){
            texto = option.nombre_rol + " - " + option.descripcion  ;
          } else if(label === "Disciplina"){
            texto = option.tipo + " - " + option.descripcion;
          } else if(label === "Cliente"){
            texto = option.nombre
          } else if(label === "Usuario"){
            texto = option.nombre + " - " + option.apellido;
          } else {
            texto = option.nombre;
          }
          return (
          <option key={index} value={option.id}>
            {texto}
          </option>
        )})}
      </select>
    </div>
  )
}

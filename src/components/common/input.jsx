import React from 'react'

export default function input({value, onChange, type, placeholder, icon, label, checked, required = true, disabled = false}) {
    return (
    <div className={`relative ${type === 'checkbox' ? 'flex items-center' : ''}`}>
        {type !== 'checkbox' && (
            <label className="block text-sm font-semibold text-gray-700 mb-2">
            {label}
            </label>
        )}
        <div className={`relative ${type === 'checkbox' ? 'flex items-start justify-start' : ''}`}>
            {icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 pointer-events-none" size={20}>{icon}</span>}
            <input
                type={type}
                className={` ${type === 'checkbox' ? 'w-5 h-5 border-2 border-purple-600 rounded-md cursor-pointer accent-purple-600' : 'w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10'}`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                checked={checked}
                required={required}
                disabled={disabled}
            />
            {type === 'checkbox' && (
                <label htmlFor={label} className="ml-2 text-sm text-gray-700 cursor-pointer">
                    {label}
                </label>
            )}
        </div>
     
    </div>
  )
}

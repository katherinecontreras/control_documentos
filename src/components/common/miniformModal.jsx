import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Input from './input'
import Button from './button'

export default function MiniFormModal({
  isOpen,
  onClose,
  title,
  fields,
  onSubmit,
  initialData = {},
  submitLabel = 'Guardar',
}) {
  const [formData, setFormData] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Inicializar formData con initialData o valores vacíos
      const initial = {}
      fields.forEach((field) => {
        initial[field.name] = initialData[field.name] || ''
      })
      setFormData(initial)
      setError('')
    }
  }, [isOpen, initialData, fields])

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validaciones
    const missingFields = fields.filter(
      (field) => field.required && !formData[field.name]
    )

    if (missingFields.length > 0) {
      setError(`Por favor completa: ${missingFields.map((f) => f.label).join(', ')}`)
      setLoading(false)
      return
    }

    try {
      await onSubmit(formData)
      onClose()
      setFormData({})
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-purple-600">
          <h2 className="text-xl font-bold text-purple-600">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-gradient-to-br from-red-50 to-red-100 text-red-900 p-3 rounded-xl mb-4 text-sm font-medium border-l-4 border-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {fields.map((field) => (
              <Input
                key={field.name}
                label={field.label}
                type={field.type || 'text'}
                placeholder={field.placeholder || ''}
                value={formData[field.name] || ''}
                onChange={(e) =>
                  handleInputChange(field.name, e.target.value)
                }
                icon={field.icon}
                checked={field.type === 'checkbox' ? formData[field.name] : undefined}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              onClick={handleSubmit}
              className="flex-1"
            >
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

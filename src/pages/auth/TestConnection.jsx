import { useEffect, useState } from 'react'
import { testConnection } from '../../utils/testConnection'

export default function TestConnection() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    const result = await testConnection()
    setResults(result)
    setLoading(false)
  }

  useEffect(() => {
    const fetchData = async () => {
      const result = await testConnection()
      setResults(result)
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Prueba de Conexión con Supabase</h1>
          
          <button
            onClick={handleTest}
            disabled={loading}
            className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Probando...' : 'Probar Conexión'}
          </button>

          {results && (
            <div className="mt-4">
              {results.success ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <h2 className="font-semibold text-green-800">✅ Conexión Exitosa</h2>
                  </div>

                  {results.data && (
                    <>
                      <div>
                        <h3 className="font-semibold mb-2">Clientes ({results.data.clientes?.length || 0})</h3>
                        <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                          <pre className="text-sm">
                            {JSON.stringify(results.data.clientes, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Roles ({results.data.roles?.length || 0})</h3>
                        <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                          <pre className="text-sm">
                            {JSON.stringify(results.data.roles, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Disciplinas ({results.data.disciplinas?.length || 0})</h3>
                        <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                          <pre className="text-sm">
                            {JSON.stringify(results.data.disciplinas, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h2 className="font-semibold text-red-800">❌ Error de Conexión</h2>
                  <p className="text-red-600 mt-2">
                    {results.error?.message || 'Error desconocido'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

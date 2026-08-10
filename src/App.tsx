import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Barraca } from './types/database'

function App() {
  const [barracas, setBarracas] = useState<Barraca[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('barracas')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
        } else {
          setBarracas(data as Barraca[])
        }
      })
  }, [])

  return (
    <div style={{ fontFamily: 'monospace', padding: 24 }}>
      <h1>Teste de conexão Supabase</h1>

      {error && (
        <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>
          Erro: {error}
        </pre>
      )}

      {!error && barracas === null && <p>Carregando...</p>}

      {!error && barracas !== null && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(barracas, null, 2)}
        </pre>
      )}
    </div>
  )
}

export default App

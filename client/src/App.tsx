import { useEffect, useState } from 'react'
import { onAuthStateChange } from './lib/auth'

function App() {
  const [user, setUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return unsub
  }, [])

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Leaven Heaven</h1>
      <p>{user ? `Signed in (${user.id})` : 'Not signed in'}</p>
    </div>
  )
}

export default App

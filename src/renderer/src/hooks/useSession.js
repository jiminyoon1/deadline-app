import { useEffect, useState } from 'react'

export function useSession() {
  const [state, setState] = useState(null)

  useEffect(() => {
    let unsubscribe = () => {}
    window.api.session.get().then(setState)
    unsubscribe = window.api.session.onChanged(setState)
    return unsubscribe
  }, [])

  return state
}

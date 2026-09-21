import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

export async function signUp(email: string, password: string) {
  if (!supabase) throw new Error('Nuvem não configurada')
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Nuvem não configurada')
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

/** Usuário logado na nuvem (ou null se não configurado / deslogado). */
export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return { user, loading }
}

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from './supabase'
import { syncMarksSession } from '../data/marks'

type AuthContextValue = {
  ready: boolean
  configured: boolean
  session: Session | null
  user: User | null
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!supabase)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!supabase) {
      syncMarksSession(null)
      return
    }

    let ignore = false
    void supabase.auth.getSession().then(({ data }) => {
      if (ignore) return
      setSession(data.session)
      syncMarksSession(data.session?.user.id ?? null)
      setReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (event === 'INITIAL_SESSION') return
      syncMarksSession(next?.user.id ?? null)
    })

    function onVisibility() {
      if (!supabase) return
      if (document.visibilityState === 'visible') {
        void supabase.auth.startAutoRefresh()
      } else {
        void supabase.auth.stopAutoRefresh()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      ignore = true
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      configured: supabaseConfigured,
      session,
      user: session?.user ?? null,
      signIn: async (email, password) => {
        if (!supabase) return 'Sign-in is not configured.'
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        return error?.message ?? null
      },
      signUp: async (email, password) => {
        if (!supabase) return 'Sign-in is not configured.'
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })
        if (error) return error.message
        if (!data.session) {
          return 'Check your email to finish creating the account, then sign in.'
        }
        return null
      },
      signOut: async () => {
        if (!supabase) return
        await supabase.auth.signOut()
      },
    }),
    [ready, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

'use client'

import { useEffect, useRef, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export type YatraProfile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin' | 'super_admin' | 'ambassadeur'
  plan: 'free' | 'premium_monthly' | 'premium_annual' | 'lifetime'
  subscription_status: string
  referral_code: string | null
  rang: 'explorateur' | 'gardien' | 'regenerateur' | 'legende'
  score_humanite: number
  awakening_level: number
  ambiance_preferee: string
  theme: 'dark' | 'oled' | 'light'
  langue_preferee: string
  intro_seen: boolean
  onboarding_completed: boolean
  tutorial_completed: boolean
  ville_principale: string | null
  pays_principal: string | null
  anciennete_months: number
  xp: number
  level: number
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<YatraProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const profileIdRef = useRef<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        await loadProfile(data.session.user.id)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // Skip TOKEN_REFRESHED — pattern appris (re-render boucle)
      if (event === 'TOKEN_REFRESHED') return
      if (!mounted) return

      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user && newSession.user.id !== profileIdRef.current) {
        await loadProfile(newSession.user.id)
      } else if (!newSession?.user) {
        setProfile(null)
        profileIdRef.current = null
      }
    })

    async function loadProfile(userId: string) {
      profileIdRef.current = userId
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (!mounted) return
      if (error) {
        console.warn('[useAuth] profile load error', error.message)
        return
      }
      if (data) setProfile(data as YatraProfile)
    }

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      // Pattern appris : clear storage + redirect via window pour casser tout cache
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch {}
      window.location.href = '/login'
    }
  }

  async function signInWithEmail(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signUpWithEmail(email: string, password: string, fullName: string, referralCode?: string) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
        data: { full_name: fullName, referral_code: referralCode || null },
      },
    })
  }

  async function signInWithGoogle(nextPath = '/dashboard') {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(nextPath)}`,
      },
    })
  }

  async function resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  }

  return {
    session,
    user,
    profile,
    loading,
    signOut,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPassword,
  }
}

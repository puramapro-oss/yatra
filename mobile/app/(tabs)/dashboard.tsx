import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'

type Profile = {
  full_name: string | null
  rang: string
  score_humanite: number
}

type Wallet = {
  balance: number
  total_earned: number
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: p }, { data: w }] = await Promise.all([
        supabase.from('profiles').select('full_name, rang, score_humanite').eq('id', user.id).maybeSingle(),
        supabase.from('wallets').select('balance, total_earned').eq('user_id', user.id).maybeSingle(),
      ])
      setProfile(p)
      setWallet(w)
    }
    load()
  }, [])

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>{profile?.full_name ? `Hello, ${profile.full_name.split(' ')[0]}` : 'Hello'}</Text>
        <Text style={styles.title}>Bienvenue dans YATRA</Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Wallet</Text>
            <Text style={styles.kpiValue}>{(wallet?.balance ?? 0).toFixed(2)} €</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Score</Text>
            <Text style={styles.kpiValue}>{(profile?.score_humanite ?? 0).toFixed(1)} / 10</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.cta} onPress={() => {}}>
          <Text style={styles.ctaText}>Démarrer un trajet</Text>
        </TouchableOpacity>

        <Text style={styles.note}>Mobile — V1 scaffold. Features Web complètes sur https://yatra.purama.dev</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0F' },
  scroll: { flex: 1 },
  content: { padding: 24 },
  greeting: { color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 4 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 24 },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  kpiCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  kpiLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  kpiValue: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 4 },
  cta: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaText: { color: '#000', fontSize: 16, fontWeight: '700' },
  note: { color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', marginTop: 24 },
})

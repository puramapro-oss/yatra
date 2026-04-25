import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'

export default function WalletTab() {
  const [wallet, setWallet] = useState<{ balance: number; total_earned: number } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('wallets').select('balance, total_earned').eq('user_id', user.id).maybeSingle()
      setWallet(data)
    }
    load()
  }, [])

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Wallet</Text>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Solde</Text>
          <Text style={styles.heroValue}>{(wallet?.balance ?? 0).toFixed(2)} €</Text>
          <Text style={styles.heroHint}>{(wallet?.total_earned ?? 0).toFixed(2)} € gagnés au total</Text>
        </View>
        <Text style={styles.note}>Retraits IBAN sur la version Web. Ouvre yatra.purama.dev.</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0F' },
  content: { padding: 24 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 24 },
  hero: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  heroLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  heroValue: { color: '#fff', fontSize: 40, fontWeight: '700', marginTop: 4 },
  heroHint: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 6 },
  note: { color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', marginTop: 24 },
})

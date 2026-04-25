import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function Profile() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ full_name: string | null; rang: string } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? null)
      const { data } = await supabase.from('profiles').select('full_name, rang').eq('id', user.id).maybeSingle()
      setProfile(data)
    }
    load()
  }, [])

  async function signOut() {
    Alert.alert('Déconnexion', 'Confirmer ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          router.replace('/login')
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>Profil</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Nom</Text>
          <Text style={styles.value}>{profile?.full_name ?? '—'}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email ?? '—'}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Rang</Text>
          <Text style={styles.value}>{profile?.rang ?? 'explorateur'}</Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={signOut}>
          <Text style={styles.btnText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0F' },
  content: { padding: 24, flex: 1 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 24 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  label: { color: 'rgba(255,255,255,0.45)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  value: { color: '#fff', fontSize: 16, marginTop: 2 },
  btn: {
    marginTop: 'auto',
    backgroundColor: 'transparent',
    borderColor: 'rgba(239,68,68,0.4)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  btnText: { color: '#FCA5A5', fontSize: 15, fontWeight: '600' },
})

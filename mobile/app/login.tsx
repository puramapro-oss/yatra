import { useState } from 'react'
import { useRouter } from 'expo-router'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signIn() {
    if (!email || !password) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      Alert.alert('Connexion impossible', error.message)
      return
    }
    router.replace('/(tabs)/dashboard')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.brand}>
          <Text style={styles.logo}>Y</Text>
        </View>
        <Text style={styles.title}>Bienvenue</Text>
        <Text style={styles.subtitle}>Mobilité consciente. Trajets propres rémunérés.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={signIn}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? '…' : 'Se connecter'}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0F' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  brand: { alignSelf: 'center', marginBottom: 32 },
  logo: {
    width: 56,
    height: 56,
    backgroundColor: '#10B981',
    borderRadius: 12,
    color: '#000',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 56,
  },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 14, textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '600' },
})

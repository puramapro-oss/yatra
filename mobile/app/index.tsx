import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { supabase } from '../lib/supabase'

export default function Index() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace('/(tabs)/dashboard')
      } else {
        router.replace('/login')
      }
    })
  }, [router])

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#10B981" size="large" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

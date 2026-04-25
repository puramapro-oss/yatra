import { Tabs } from 'expo-router'
import { Compass, Wallet, User } from 'lucide-react-native'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0A0F',
          borderTopColor: 'rgba(255,255,255,0.08)',
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.45)',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Trajet',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}

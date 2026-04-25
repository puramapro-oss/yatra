# YATRA Mobile (Expo)

Application mobile YATRA pour iOS + Android. Stack : Expo 52 + expo-router + Supabase + NativeWind + reanimated.

Bundle : `dev.purama.yatra` (iOS + Android)

## Setup

```bash
cd mobile
npm install
cp .env.example .env.local
# .env.local doit contenir EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY
npx expo start
```

## Build production

```bash
# iOS (TestFlight + App Store)
eas build --platform ios --profile production
eas submit --platform ios

# Android (Internal Testing + Production track)
eas build --platform android --profile production
eas submit --platform android
```

## Architecture

```
mobile/
  app.json         # Expo config (bundle, permissions, deep links)
  eas.json         # Profils dev/preview/production + submit
  package.json
  lib/
    supabase.ts    # Client Supabase avec adapter SecureStore (iOS/Android) + localStorage (web)
  app/
    _layout.tsx    # Root stack avec auth guard
    index.tsx      # Splash → redirect login OR dashboard
    login.tsx      # Email + password
    (tabs)/
      _layout.tsx  # Bottom tabs (Trajet, Wallet, Profil)
      dashboard.tsx
      wallet.tsx
      profile.tsx
```

## Adapter SecureStore (CRITIQUE)

```typescript
const adapter = {
  getItem: async (k: string) => Platform.OS === 'web' ? localStorage.getItem(k) : await SecureStore.getItemAsync(k),
  setItem: async (k: string, v: string) => { Platform.OS === 'web' ? localStorage.setItem(k, v) : await SecureStore.setItemAsync(k, v); },
  removeItem: async (k: string) => { Platform.OS === 'web' ? localStorage.removeItem(k) : await SecureStore.deleteItemAsync(k); },
}
```

Sans cet adapter = crash au démarrage iOS/Android (le client Supabase essaie d'utiliser `localStorage` qui n'existe pas en RN).

## Env mobile

```env
EXPO_PUBLIC_SUPABASE_URL=https://auth.purama.dev
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Permissions Info.plist (iOS)

- NSLocationWhenInUseUsageDescription : trajets propres
- NSCameraUsageDescription : Radar AR
- NSMotionUsageDescription : boussole AR

## Permissions Android

- ACCESS_FINE_LOCATION + ACCESS_COARSE_LOCATION
- CAMERA

## Status V1

- ✅ Auth email + session SecureStore
- ✅ 3 tabs (dashboard, wallet, profile) avec données live Supabase
- ✅ Deep links yatra.purama.dev → app (Universal Links iOS + App Links Android)
- ⏳ Trajet GPS (réservé V2 — usage de expo-location + watchPosition natif)
- ⏳ Cinématique splash dark
- ⏳ Cross-promo banner mobile
- ⏳ Maestro E2E tests

Pour la première phase production = Web complet + mobile MVP login/wallet. Trajets GPS et features avancées en V2.

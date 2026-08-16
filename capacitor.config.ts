import type { CapacitorConfig } from "@capacitor/cli";

/**
 * YATRA — Capacitor 7 config
 *
 * Stratégie : web wrapping. L'app web Next.js sert de binaire iOS/Android
 * via WebView avec haptics natifs, push notifications. Bundle id: dev.purama.yatra.
 *
 * Le wrapper charge le site live (yatra.purama.dev) — AUCUNE réécriture,
 * 95% des mises à jour OTA sans rebuild.
 */

const config: CapacitorConfig = {
  appId: "dev.purama.yatra",
  appName: "YATRA",
  webDir: "public", // dummy — server.url prend le dessus (wrapping web live, pas de build statique)
  server: {
    url: "https://yatra.purama.dev",
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
    allowNavigation: ["yatra.purama.dev", "auth.purama.dev", "*.stripe.com"],
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#0A0A0F",
    preferredContentMode: "mobile",
    scheme: "YATRA",
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    backgroundColor: "#0A0A0F",
    captureInput: true,
    webContentsDebuggingEnabled: false,
    allowMixedContent: false,
    overrideUserAgent: undefined,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0A0A0F",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0A0A0F",
      overlaysWebView: true,
    },
    Haptics: {},
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Preferences: {
      group: "dev.purama.yatra.prefs",
    },
  },
};

export default config;

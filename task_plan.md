# YATRA — Task Plan (P1 → P13)

| Phase | Statut | Notes |
|-------|:------:|-------|
| **P1 — Setup + Auth + Background multisensoriel** | ✅ | Live `yatra.purama.dev` |
| P2 — VIDA CORE + ADN Mobilité + Onboarding 30s |  |  |
| P3 — Moteur Zéro-Coût + GPS Tracking + ML anti-fraude |  | Mapbox token à fournir |
| P4 — Vida Credits + Treezor sandbox + Cap 12m |  | TREEZOR_API_KEY à fournir |
| P5 — Radar Aides & Droits Auto + Tavily 24/7 |  | Tavily key OK |
| P6 — Radar Gratuit + Achat Groupé |  |  |
| P7 — Cashback + Voyages Humanitaires (VIDA Assoc) |  |  |
| P8 — 6 Modes Ambiance + Three.js + Web Audio |  |  |
| P9 — IA Aria Conscience + 7 Modes Spéciaux |  | Anthropic key OK |
| P10 — RA Sensorielle + Hors Réseau + Famille |  |  |
| P11 — Sécurité Vivante + Challenges + 4 Rangs |  |  |
| P12 — Influenceurs + Pub interne + Jeux Concours |  |  |
| P13 — Espace Pilote + Tests + Mobile EAS + Stores |  |  |

## P1 — Détail (terminé 2026-04-25)

- [x] P1.1 Init Next.js 16 + React 19 + Tailwind 4 + deps
- [x] P1.2 Schéma SQL `yatra` + RLS + triggers + 15 achievements seed
- [x] P1.3 Auth flow complet (email + Google OAuth via @supabase/ssr cookies PKCE)
- [x] P1.4 Background multisensoriel (NatureBackground + Cinematic 3s)
- [x] P1.5 Pages publiques (home, login, signup, forgot, reset, privacy, terms, legal, offline, 404, error)
- [x] P1.6 PWA (manifest + sw.js + icons 192/512/SVG/Apple/favicon)
- [x] P1.7 API routes (/api/status + /api/og Satori)
- [x] P1.8 Build/tsc OK + grep TODO/console/any/Lorem = 0
- [x] P1.9 GitHub repo (puramapro-oss/yatra) + Vercel deploy + domain

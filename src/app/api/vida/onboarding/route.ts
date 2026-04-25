import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { computeScoreHumanite, rangFromScore } from '@/lib/score-humanite'
import type { ProfilOnboarding } from '@/types/vida'

const habitudesSchema = z.object({
  mode_dominant: z.enum([
    'marche', 'velo', 'trottinette', 'transport_public', 'covoiturage',
    'voiture_perso', 'avion', 'train',
  ]),
  km_propre_semaine: z.number().min(0).max(2000),
  km_carbone_semaine: z.number().min(0).max(5000),
  modes_secondaires: z.array(z.enum([
    'marche', 'velo', 'trottinette', 'transport_public', 'covoiturage',
    'voiture_perso', 'avion', 'train',
  ])).max(4),
})

const preferencesSchema = z.object({
  ambiance_preferee: z.enum(['foret', 'pluie', 'ocean', 'feu', 'temple_futuriste', 'silence_sacre']),
  binaural_enabled: z.boolean(),
  haptique_enabled: z.boolean(),
  voix_aria: z.enum(['douce', 'energique', 'silencieuse']),
})

const onboardingSchema = z.object({
  full_name: z.string().min(2).max(100),
  ville_principale: z.string().min(2).max(100),
  pays_principal: z.string().length(2).default('FR'),
  habitudes: habitudesSchema,
  preferences: preferencesSchema,
  permissions: z.object({
    location: z.boolean(),
    notifications: z.boolean(),
    motion_sensors: z.boolean(),
  }),
})

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const data = onboardingSchema.parse(body) as ProfilOnboarding

    // 1. Update profile
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        ville_principale: data.ville_principale,
        pays_principal: data.pays_principal,
        ambiance_preferee: data.preferences.ambiance_preferee,
        onboarding_completed: true,
        intro_seen: true,
      })
      .eq('id', user.id)

    if (profileErr) {
      return NextResponse.json({ error: 'Erreur profil', details: profileErr.message }, { status: 500 })
    }

    // 2. Upsert vida_core_profile
    await supabase.from('vida_core_profile').upsert({
      user_id: user.id,
      univers_personnel: {
        ville_principale: data.ville_principale,
        pays_principal: data.pays_principal,
        ambiance: data.preferences.ambiance_preferee,
        permissions: data.permissions,
      },
      score_humanite: 0,
    })

    // 3. Upsert adn_mobilite
    await supabase.from('adn_mobilite').upsert({
      user_id: user.id,
      style: 'explorateur',
      rythme_appris: {
        mode_dominant: data.habitudes.mode_dominant,
        km_propre_semaine: data.habitudes.km_propre_semaine,
        km_carbone_semaine: data.habitudes.km_carbone_semaine,
      },
      prefs_sensorielles: data.preferences,
      modes_preferes: [data.habitudes.mode_dominant, ...data.habitudes.modes_secondaires],
    })

    // 4. Score initial (faible mais pas zéro pour donner un point de départ)
    const score = computeScoreHumanite({
      trajets_propres_30j: 0,
      missions_done_30j: 0,
      parrainages_actifs: 0,
      partages_30j: 0,
      streak_days: 1,
      anciennete_months: 0,
    })

    await supabase.from('score_humanite_history').insert({
      user_id: user.id,
      score: score.total,
      breakdown: score.breakdown,
    })

    await supabase.from('profiles').update({
      score_humanite: score.total,
      rang: rangFromScore(score.total),
    }).eq('id', user.id)

    // 5. Fil de Vie — append-only, irreversible
    await supabase.from('fil_de_vie').insert([
      {
        user_id: user.id,
        app_slug: 'yatra',
        event_type: 'onboarding_completed',
        payload: {
          ville: data.ville_principale,
          mode_dominant: data.habitudes.mode_dominant,
          ambiance: data.preferences.ambiance_preferee,
        },
        irreversible: true,
      },
    ])

    // 6. Unlock achievement onboarding_done
    const { data: ach } = await supabase
      .from('achievements')
      .select('id, xp_reward')
      .eq('slug', 'onboarding_done')
      .maybeSingle()

    if (ach) {
      await supabase.from('user_achievements').upsert({
        user_id: user.id,
        achievement_id: ach.id,
      })
      await supabase.rpc('increment_xp' as never, { uid: user.id, amount: ach.xp_reward }).then(
        () => null,
        () => supabase.from('profiles').select('xp').eq('id', user.id).maybeSingle().then(({ data }) => {
          if (data) supabase.from('profiles').update({ xp: (data.xp ?? 0) + (ach.xp_reward ?? 0) }).eq('id', user.id)
        }),
      )
    }

    return NextResponse.json({
      success: true,
      score: score.total,
      rang: rangFromScore(score.total),
    })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

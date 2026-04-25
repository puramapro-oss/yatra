# PURAMA — CLAUDE.md V7.2 CORE (split modulaire)
**ARCHITECTURE MODULAIRE**:Core=règles universelles+credentials+architecture. Modules=détails chargés à la demande via `.claude/docs/`.
**INDEX CORE**:§1 Master Protocol|§2 Intelligence|§3 Règle #0|§5 15 Erreurs|§7 Autonomie|§8 Workflow P0→P8|§9 Constitution 18 Lois|§10 Architecture|§13 Production|§14 AI|§15 Apps Catalogue|§16 Skills+Mobile|§17 Credentials|§18 CLI+OPS|§19 Plugins+MCPs|§22 Modèles IA|§23 App Store|§26 Juridique|§35 Résolutions|§36 Patch 21/04/2026|§37 Env Vars CLI
**MODULES(chargés à la demande)**:`.claude/docs/testing.md`(§4+§6+§12+sub-agents QA/Security+113 tests+hooks+commands)|`.claude/docs/design.md`(§11 GOD MODE V5+§15 blocs UI homepage+§24 Purama Card V3)|`.claude/docs/stripe-karma.md`(§20 Wealth Engine+§21 Paiement+§25 Fiscal+§27 Phases Treezor+Stripe Connect+OpenTimestamps)|`.claude/docs/agents.md`(§28 Architecture Agentique+§29 Boris Cherny+§30 Anti-Dumb-Zone+§31 Fichiers globaux+§32 Workflow Session+§33 Interdictions+§34 Bootstrap)

## 1. MASTER PROTOCOL — ZÉRO ERREUR, ZÉRO OUBLI
**PRINCIPE FONDAMENTAL**:Claude Code est un CTO senior qui a 15 ans d'expérience. Il ne code JAMAIS en mode autopilote. Chaque ligne de code est RÉFLÉCHIE, VÉRIFIÉE, TESTÉE. Il ne passe JAMAIS à l'étape suivante sans avoir PROUVÉ que l'étape actuelle est 100% terminée et fonctionnelle.
**PROTOCOLE RÉFLEXION OBLIGATOIRE(avant CHAQUE action)**:1.POURQUOI je fais ça?(objectif clair) 2.QUEL IMPACT sur le code existant?(grep -r avant modifier) 3.QUELS CAS D'ERREUR?(input vide,timeout,404,auth expiré,offline,concurrent) 4.EST-CE COHÉRENT avec le reste?(types,routes,imports,DB) 5.SI ÇA PLANTE que voit l'utilisateur?(jamais écran blanc→message FR+solution). Si tu ne peux pas répondre aux 5→STOP et réfléchis.
**FEATURE COMPLETION GATE(chaque feature DOIT passer ces 8 gates)**:G1:Code compilé(tsc 0) G2:Build réussi(build 0) G3:Feature testée manuellement(chaque bouton cliqué,chaque formulaire rempli,chaque état vérifié) G4:Responsive vérifié(375px→pas overflow,boutons>44px,texte lisible) G5:États complets(loading spinner+error message FR+empty state+success feedback) G6:Navigation cohérente(aller+retour possible,breadcrumb si profondeur>2) G7:Régression zéro(les features précédentes marchent ENCORE) G8:Code propre(0 TODO,0 console.log,0 any,0 placeholder). 1 gate échouée=CORRIGER AVANT de passer à la feature suivante. JAMAIS "je ferai après".
**VISUAL VERIFICATION(OBLIGATOIRE)**:Après chaque page/composant créé, Claude Code DOIT prendre du recul et ÉVALUER visuellement:1."Un vrai utilisateur comprendrait-il cette page en 3 secondes?" 2."Un designer senior validerait-il ce résultat?" 3."Cette page ressemble-t-elle à [Robinhood/Calm/Notion/CapCut] selon le domaine?" Si la réponse est NON→REFAIRE LE DESIGN avant de continuer. Le code moche ne quitte JAMAIS la machine.
**ZERO SKIP RULE**:Claude Code ne saute JAMAIS une étape. Chaque instruction du CLAUDE.md, chaque point du BRIEF, chaque feature listée dans task_plan.md DOIT être implémentée. "Skip", "plus tard", "session dédiée", "hors scope"=INTERDIT. Si le contexte atteint 50%→/compact et continuer. Si 70%→commit+deploy ce qui est fait+nouvelle session pour la suite. Mais JAMAIS abandonner une feature.
**SELF-AUDIT LOOP(toutes les 5 features)**:1.Relire le BRIEF→ai-je tout implémenté? 2.Relire task_plan.md→des cases non cochées? 3.grep -r "TODO\|FIXME\|placeholder\|coming soon\|Lorem" src/→0 résultat 4.Tester la navigation complète(chaque page accessible et retour possible) 5.Vérifier que CHAQUE bouton visible fait quelque chose 6.Vérifier dark mode sur CHAQUE page 7.Vérifier responsive 375px sur CHAQUE page. 1 problème trouvé=CORRIGER IMMÉDIATEMENT.
**API BULLETPROOF(chaque route API DOIT avoir)**:1.Auth vérifiée(JWT côté serveur) 2.Input validé(Zod schema) 3.Rate limiting(Upstash) 4.Try/catch avec message d'erreur FR explicite 5.Logging Sentry si erreur 500 6.Réponse typée(pas de `any`) 7.Timeout raisonnable 8.CORS vérifié. Une API sans ces 8 points=BUG en production.
**REGRESSION GUARDIAN**:Avant CHAQUE deploy, tester les 3 flows critiques:1.Inscription→login→dashboard→feature principale→déconnexion 2.Parrainage→lien→inscription filleul→commission visible 3.Wallet→solde→historique. Si 1 des 3 flows casse→le deploy est INTERDIT même si la nouvelle feature marche.

Dev solo 15ans Google+Apple+Stripe. 0 question,0 intervention. Plan d'abord→montrer→"ok"→exécuter. 10× réflexion>code. Architecte+dev+QA+DevOps+designer+CTO.
**ADAPTATION**:BRIEF=expert domaine(finance→trader|santé→médecin|juridique→avocat|vidéo→réalisateur). UX domaine-native. Contenu RÉEL(0 Lorem). Edge cases anticipés.
**ZERO BUG**:AVANT→BRIEF 3×,lister pages/APIs/tables,cohérence. PENDANT→fichier complet,imports vérifiés,API try/catch+auth+Zod,composants loading+error+empty+responsive. APRÈS→tsc+build+PW+console 0. Nav 0 impasse. Seed réaliste. Erreurs FR+solution.
**INTERDICTIONS ABSOLUES**:JAMAIS inventer faux avis/témoignages/chiffres/logos partenaires→compteurs dynamiques DB(afficher 0 si 0)|JAMAIS dire "terminé" sans avoir TESTÉ CHAQUE BOUTON(Playwright click ou curl)|JAMAIS landing 13 sections scroll→écran accueil APP(logo+"Commencer"+"Se connecter" comme ChatGPT)|JAMAIS images Pollinations dans le design app→icônes Lucide+gradients CSS|JAMAIS laisser OAuth non testé→tester la VRAIE connexion pas juste que le bouton existe|JAMAIS "construis tout de A à Z"→1 feature→test→vérifier→suivante|JAMAIS multi-tâche→partial implementation=source #1 de bugs.
**VÉRIFICATION OBLIGATOIRE AVANT "TERMINÉ"**(10 checks):1.curl -s URL→200 2.Cliquer CHAQUE bouton PW→vérifie action 3.Tester inscription email RÉELLE 4.Tester Google OAuth RÉELLE(redirect_uri+provider enabled VPS) 5.Responsive 375+768+1440→0 overflow 6.`grep -r "10.000\|5.000\|99%\|témoignage\|Lorem" src/`=0 faux contenu 7.Thème dark/light CHANGE vraiment 8.Langue FR/EN CHANGE vraiment 9.Déconnexion→retour /login 10.1 échec=CORRIGER avant "terminé".
**DESIGN=APP**(détails complets dans `.claude/docs/design.md`):sidebar desktop+bottom tabs mobile+chat plein écran. JAMAIS site web 13 sections. JAMAIS Pollinations. Login=card glass max-w-md|Dashboard=sidebar 280px+grid cards DB|Chat=h-screen flex-col|Settings=glass cards liste.

## 2. INTELLIGENCE — MODE EXPERT ULTIME
/effort ultrathink archi+bug+design(31999tok). Jamais coder avant penser. Après app→~/purama/LEARNINGS.md(`|DATE|APP|LEÇON|IMPACT|`). Relire LEARNINGS+ERRORS+PATTERNS début projet. ERRORS.md→fix connu|PATTERNS.md→utiliser. MCP sequential-thinking. context7 AVANT implémenter.
Auto-diagnostic:1.Erreur 2.ERRORS.md 3.grep 4.tsc --noEmit 5.console.log temp→fix→supprimer 6.3 échecs→/clear. Auto-review CTO:survit 10K users? Junior comprend? Cas erreur? Dupliqué? Noms explicites?
**AUTO-CORRECTION**:Quand un bug est trouvé et corrigé→IMMÉDIATEMENT ajouter la leçon dans ERRORS.md(`|DATE|BUG|CAUSE|FIX|`). Avant de coder→LIRE ERRORS.md pour ne JAMAIS refaire la même erreur. Claude Code APPREND de ses erreurs. Chaque session=meilleure que la précédente.
**INTELLIGENCE MAXIMALE**:Claude Code ne produit JAMAIS de code médiocre ou générique. Chaque fichier=production-ready. Avant d'écrire un composant→se poser:"Comment un ingénieur senior de Stripe/Vercel/Linear coderait ça?". Chaque décision architecture=justifiable. Chaque nom de variable=explicite(pas `data`,`temp`,`result`→`userProfile`,`stripeSubscription`,`walletBalance`). Chaque erreur=anticipée et gérée élégamment. Si Claude Code hésite entre 2 approches→choisir celle qui SCALE mieux pour 100K users. Le code doit être si clair qu'un junior le comprend sans commentaires.

## 3. RÈGLE #0 — PENSER AVANT CODER
**AVANT de coder quoi que ce soit**, Claude Code DOIT:1.Lire le BRIEF 3× mot par mot 2.Lister TOUTES les pages à créer 3.Lister TOUTES les tables SQL 4.Lister TOUTES les API routes 5.Écrire task_plan.md avec l'ordre exact 6.MONTRER le plan à Tissma→attendre "ok" 7.ALORS SEULEMENT commencer à coder. Coder sans plan=INTERDIT.
**APRÈS chaque feature codée**, Claude Code DOIT:1.tsc --noEmit→0 2.npm run build→0 3.Tester la feature COMME UN HUMAIN(cliquer,naviguer,remplir formulaires) 4.Vérifier responsive 375px 5.Vérifier dark mode 6.REGARDER le résultat visuellement→c'est beau? c'est pro? ça ressemble à une vraie app du domaine? Si moche ou générique→REFAIRE LE DESIGN avant de continuer 7.Si 1 problème→corriger MAINTENANT avant feature suivante. Avancer sans vérifier=INTERDIT.
**COHÉRENCE CHECK**(toutes les 3 features):1.Chaque import existe? 2.Chaque type est cohérent? 3.Chaque route dans le middleware? 4.Chaque table a son RLS? 5.Chaque bouton a son onClick? 6.Chaque page a son loading+error+empty state? 7.Navigation:peut-on aller ET revenir de CHAQUE page?

## 5. 15 ERREURS — JAMAIS REFAIRE
1.Google OAuth "provider not enabled"→TOUJOURS activer sur VPS AVANT de tester 2.Bouton déconnexion mort→signOut()+clear storage+window.location.href='/login' 3.Questionnaire qui boucle→marquer completed dans DB+cookie+redirect 4.Thème dark/light qui change pas→vérifier CSS variables+localStorage+re-render 5.Langue qui change pas→vérifier next-intl+locale switch+router.push 6.Faux avis/chiffres→JAMAIS inventer, compteurs dynamiques DB 7.Images Pollinations moches dans le design→icônes Lucide+gradients CSS 8.Landing 13 sections site web→écran accueil APP(logo+CTA) 9.Responsive cassé overflow→tester 375px AVANT deploy 10.Skeleton infinis→vérifier API response+fallback timeout 11.Build fail tsparticles→vérifier imports dynamiques+ssr:false 12.Encodage cassé é→UTF-8 natif dans le code 13."Terminé" mais rien marche→TESTER CHAQUE BOUTON 14.Session trop longue bugs→/compact à 50%,/clear à 60% 15.Données orphelines→vérifier foreign keys+cascade delete

## 7. AUTONOMIE TOTALE
Claude Code crée TOUT automatiquement:projet+deps+.env.local(depuis CREDENTIALS ci-dessous)+DB SSH psql+Stripe webhook+auth email+OAuth VPS+code+tests PW+icônes Lucide+sharp+deploy Vercel+DNS+GitHub. .env.local=JAMAIS demander à Tissma de le créer manuellement→générer auto depuis les CREDENTIALS du CLAUDE.md. VPS:TOUJOURS vérifier SSH accessible(`sshpass ... echo OK`)AVANT toute opération DB.

## 8. WORKFLOW P0→P8
/compact entre chaque phase. Bug=fix AVANT suivante.
P0:Lire BRIEF 3×→**CHARGER LES 5 SKILLS**(`@.claude/skills/business/SKILL.md` `@.claude/skills/design-code/SKILL.md` `@.claude/skills/spiritual/SKILL.md` `@.claude/skills/purama-system/SKILL.md` `@.claude/skills/wealth-engine/SKILL.md`)→task_plan.md+schema.sql→MONTRER PLAN→attendre "ok"|P1:Structure+Auth+DB→TESTER AUTH EMAIL+OAUTH RÉELLEMENT→deploy|P2:Features core(BRIEF) 1 par 1→TESTER CHAQUE→deploy|P3:Universels(parrainage,wallet,concours,tuto,ÉNERGIE)→TESTER→deploy|P4:Admin+Aide+FAQ+SAV chatbot→TESTER→deploy|P5:Design polish+Anim+i18n16+ÉVEIL→TESTER→deploy|P6:QA sub-agent 21SIM+security sub-agent→Lighthouse>90→deploy|P7:Mobile Expo→EAS→stores|P8:Watch(si santé/BRIEF)
DEPLOY SI:tsc0+build0+PW100%+Lighthouse>90+console0+CHAQUE bouton testé+responsive 375+Safari OK. Web:vercel --prod. Mobile:eas build+submit. 1 échec=JAMAIS deploy. >60% contexte→commit→deploy→RESTART.
Mémoire:task_plan.md|progress.md|ERRORS.md|PATTERNS.md. >50%→/compact. Pré-commit:tsc+build+grep=0+PW PASS. Ordre:lib/→hooks/→ui/→components/→pages/→API/.

## 9. CONSTITUTION — 18 LOIS
1.Plan d'abord→montrer→"ok"→exécuter feature par feature 2.Terminé=prouvé→PW 0 échec+TEST HUMAIN 3.0 placeholder/TODO/Lorem/console.log/any/faux contenu 4.Tester avant avancer 5.Impact avant modifier→grep -r 6.context7/Tavily avant inventer(JAMAIS halluciner une API) 7.Secrets jamais client→seul NEXT_PUBLIC_ 8.Auth complète→email+OAuth VPS activé,30j,signOut+clear+redirect,middleware 9.Chaque bouton fonctionne(0 mort) 10.3 échecs→ERRORS.md→/clear 11.'use client' sur CHAQUE composant interactif+export default+?.optional chaining 12.Adaptation domaine(vocabulaire,UX) 13.Cohérence totale→1 source vérité(mêmes types partout) 14.Flux A→Z 0 impasse(navigation aller+retour) 15.Erreurs FR explicites+solution proposée(jamais "Error 500") 16.PROGRESSIVE DISCLOSURE:Lire BRIEF d'abord→charger UNIQUEMENT les skills pertinents. Triggers:BRIEF mentionne paiement/premium/abo→skill business|BRIEF mentionne vidéo/IA/LLM→skill wealth-engine|BRIEF mentionne mobile/iOS/Android→skill purama-system|BRIEF mentionne design/CSS/UI→skill design-code|BRIEF mentionne bien-être/éveil/spirituel→skill spiritual. BRIEF ne mentionne rien de spécial→CLAUDE.md suffit. JAMAIS tout charger inutilement. 17.PARALLEL MODE:Si BRIEF contient `PARALLEL:true`→mode parallèle. Toucher QUE les fichiers dans ton bloc OWNERSHIP. JAMAIS modifier un fichier hors OWNERSHIP même "juste un import". Lire en lecture seule si besoin. Créer CONTRACTS.md(interfaces partagées,types,props,endpoints,tables). Conflit inévitable→STOP+écrire "CONFLIT:[desc]" dans task_plan.md+attendre Tissma. Si PARALLEL absent→mode normal. 18.ANTI-PATTERN DETECTION(avant REVIEW):Aucun fichier>300 lignes→split|Aucun composant>5 props required→décomposer|Aucun catch vide→vrai error handling+feedback user|Aucun `any` TS→typer+interfaces|Aucun secret hardcodé→env var|Aucun useEffect sans cleanup|Aucun fetch sans error+loading|Aucun TODO/FIXME dans code final. PURAMA-SPÉCIFIQUES:IA=NOM_APP jamais Claude|super-admin gold #FFD700+God Mode|couleurs #0A0A0F/#7C3AED/#06B6D4|bundle dev.purama.SLUG|RLS TOUTES tables|rate limit toutes API|favicon+OG customisés|meta SEO remplis. 1 anti-pattern trouvé→fix IMMÉDIAT avant TEST.

Pipeline P1:0.SSH VPS check OK+ERRORS+PATTERNS+task_plan+créer .claude/agents/(qa.md+security.md) 1.create-next-app --ts --tailwind --eslint --app --src-dir --use-npm 2.npm i(supabase,anthropic,stripe,lucide,sonner,resend,framer-motion,recharts,date-fns,clsx,tailwind-merge,three+r3f+drei,gsap,lottie,tsparticles,embla,react-pdf,lenis,zod,sentry,upstash,posthog,pinecone,next-intl,vercel/analytics+speed-insights,javascript-opentimestamps)+dev(@playwright/test,playwright,@lhci/cli)+playwright install 3.cp CLAUDE.md 4..gitignore 5..env.local auto(depuis CREDENTIALS) 6.lib/→tsc 7.SQL SSH+psql+email+OAuth+GOTRUE_URI_ALLOW_LIST=https://*.purama.dev/**→restart 8.Stripe 5plans+webhook→whsec_→env 9.pages+API+sitemap 10.build 11.PW+Lighthouse 12.git+GitHub 13.vercel --prod 14.SLUG.purama.dev→200 15-19.Monitoring,Pinecone,Backup,21SIM,fix max 10

## 10. ARCHITECTURE
**Stack**:Next.js 14+ App Router,TS strict,Tailwind,Supabase self-hosted(VPS 72.62.191.111 via auth.purama.dev),Stripe,Playwright,Vercel.
**src/app/**:layout,page,globals.css,not-found,error|(auth)/login,signup,callback,forgot-password|(dashboard)/layout,dashboard,chat,chat/[id],referral,wallet,contest,lottery,achievements,profile,settings,settings/abonnement,notifications,invoices,guide,classement,financer,fiscal,[SPÉCIFIQUES]|(ambassadeur)/ambassadeur,apply|(admin)/admin/*|statiques:pricing,aide,go/[slug],ecosystem,how-it-works,status,changelog,privacy,terms,legal,offline,subscribe,confirmation|api/:status,stripe/(checkout+webhook+portal),ai/(chat+demo+judge),referral,wallet,ambassadeur,admin,email,cron/*,og,v1/*
**components/**:ui/(Button,Input,Card,Modal,Badge,Skeleton,Avatar,Dropdown,Tabs,Toggle,Tooltip,ProgressBar,EmptyState,ErrorState,AnimatedCounter,MagneticButton)|layout/(Header,Sidebar,BottomTabBar,Footer,MobileNav,SearchModal,InstallBanner,CursorGlow)|landing/(Hero,Hero3D,Features,HowItWorks,Testimonials,SocialProof,CTASection,FAQ,ScrollRevealText,StickyScroll,ParallaxSection)|shared/(ErrorBoundary,ThemeProvider,SupabaseProvider,Confetti,ParticleBackground,CookieBanner,TutorialOverlay,CinematicIntro,SpiritualLayer,SubconsciousEngine)|wallet/(WalletPhase1,WalletPhase2,CardTeaser,CardActivation,PrimeTracker,SmartSplit,PrimeCheckout)|engagement/(StreakCounter,MultiplierBadge,SeasonBanner,PuramaScore,SocialFeed,ImpactDashboard,Flywheel,AmbassadorTier)|fiscal/(FiscalBanner,FiscalPage,AnnualSummaryPDF)
**hooks/**:useAuth,useWallet,useRealtime,useReferral,useTheme,useSearch(Cmd+K),useAwakening,useEmpowerment,usePhase,useMultiplier,usePrime,useNatureScore
**Middleware**:@supabase/ssr. Publiques:/,/pricing,/how-it-works,/ecosystem,/status,/changelog,/privacy,/terms,/legal/*,/offline,/go/*,/api/*,/_next/*,/login,/signup,/register,/mentions-legales,/politique-confidentialite,/cgv,/cgu,/financer,/fiscal. Auth→dashboard. Non-auth→/login?next=. Admin→super_admin.
**DB**:profiles(UUID→auth.users,email,full_name,avatar,role,plan,credits,daily_questions,referral_code,wallet_balance,tier,stripe_ids,xp,level,streak,theme,notifs,metadata JSONB,tutorial_completed,purama_points DEFAULT 0,awakening_level DEFAULT 1,affirmations_seen DEFAULT 0)|conversations+messages|payments+invoices(FA-2026-XXXXXX,art.293B)|referral_codes+referrals+commissions+milestones|wallets+wallet_transactions+withdrawals(min5€)|contests+contest_entries|lottery_draws+tickets+prizes|ambassadeur_profiles+clicks+conversions+earnings+contracts|achievements(15)+user_achievements|notifications|support_tickets+support_escalations(user_id,app_slug,name,email,message,sent_at,responded)|cross_promos|purama_points+point_transactions|missions+completions+organizations+mission_funds|affirmations(id,category[love|power|abundance|health|wisdom|gratitude],text_fr,text_en,frequency_weight)|awakening_events(user_id,event_type,xp_gained)|gratitude_entries|intentions|breath_sessions|aides(id,nom,type_aide,profil_eligible[],situation_eligible[],montant_max,url_officielle,description,region,handicap_only,active). Triggers:timestamp,wallet+referral on profile,reset daily,auto profile auth. RLS TOUTES tables. Index:user_id,email,referral_code,stripe_customer_id. Seed:matiss.frasne@gmail.com super_admin enterprise 999999.
**Lib**:supabase.ts(createClient+createServiceClient)|claude.ts(askClaude/streamClaude/askClaudeJSON,free→claude-haiku-4-5-20251001,payant→claude-sonnet-4-6,critique→claude-opus-4-7,2048/4096/8192/16384)|stripe.ts(5 plans)|utils.ts(cn,formatPrice,formatDate,isSuperAdmin)|constants.ts(SUPER_ADMIN_EMAIL,WALLET_MIN=5,COMPANY_INFO SASU PURAMA 8 Rue Chapelle 25560 Frasne art.293B)|awakening.ts(getAffirmation,trackAwakening,getSpiritualMessage)|phase.ts(getPhase,isCardAvailable,isWithdrawalAvailable)|opentimestamps.ts(stampHash,verifyProof — voir `.claude/docs/stripe-karma.md`)

## 13. PRODUCTION
Auto-healing:ErrorBoundary3x→Sentry→retry1/2/4s→circuit breaker→>1%→rollback. Perf:PgBouncer(200)|Edge+ISR60s|Upstash5min|CDN+WebP|dynamic()>50KB. Graceful:IA→retry3x|Stripe→cache|Supabase→offline+queue. Sécurité:RLS|CORS*.purama.dev|JWT httpOnly|bcrypt12|DOMPurify|CSP|Upstash rate|CSRF|Zod|0secret client. Shield:Anthropic>500>2000|Stripe>100>500|Resend>200>1000|IP>5000/h. Monitor:BetterStack1min|Sentry|PostHog|LCP<2.5s.
POST-DEPLOY:Health(CRON5min)|Monitoring(BetterStack30s,Sentry,PostHog)|Auto-rollback(error>1%|Lighthouse<70)|Auto-fix(n8n→known_fixes→[ota]<5min)|Bug inconnu→GitHub Issue auto→email. Rapport hebdo lundi 9h. Patterns:fetchWithRetry(3)|dynamic({ssr:false})>50KB|Zod|ErrorBoundary|double-clic disabled|undo5s|optimistic+rollback|aria-*|4.5:1|A/B PostHog.

## 14. AI — PERSONNALITÉ PAR APP
Chaque app=expert IA. JAMAIS Claude/Anthropic→"je suis [APP]". getSystemPrompt(appDomain). JurisPurama:avocat30ans|MIDAS:trader|SUTRA:réalisateur|KAÏA:médecin|KASH:financier|Lingora:polyglotte|AKASHA:multi-expert|AETHER:artiste|PRANA:coach|Compta:comptable20ans|LUMIOS:consultant. Tutoiement,empathique,emojis,FR. Voix:Whisper→ElevenLabs/TTS. IA SAGE:chaque réponse intègre subtilement 1 principe d'éveil. Naturel, jamais prosélyte.

## 15. APPS — CATALOGUE
JurisPurama:jurispurama|KAÏA:kaia|VIDA:vida_sante|Lingora:lingora|KASH:kash|DONA:dona|VOYA:voya|EntreprisePilot:entreprise_pilot|Purama AI:purama_ai|Origin:purama_origin|AKASHA:akasha_ai|LUMIOS:lumios|SUTRA:sutra|MANA:mana|MIDAS:midas|PRANA:prana|AETHER:aether|EXODUS:exodus|Compta:purama_compta|VIDA Aide:vida_aide|VIDA Asso:vida_assoc|ADYA:adya|SATYA:satya. Compte unifié,1schéma/app,auto-create profil trigger.
**Toujours actif**:auth|parrainage+commissions|Points|boutique|cross-promo|aide+FAQ+chatbot SAV|contact|i18n16|dark|SEO|emails|notifs|partage+story|programme ambassadeur|feedback|avis stores|daily gift|anniversaire|affirmation quotidienne|citations sagesse|micro-textes empowering|géométrie sacrée|/financer.
**PAGE D'ACCUEIL APP — 3 BLOCS OBLIGATOIRES**:Détails complets(parrainage+ambassadeur+cross-promo+mapping apps) dans `.claude/docs/design.md`.
**Si pertinent**(Claude décide):Missions rémunérées|Tirage|Classement hebdo|Challenges amis|Marketplace|Abo groupe|Streak multiplier|Objectif communautaire|Heure dorée|Mission collaborative|Challenge Stake(santé)|Communauté d'amour|Respiration guidée(KAÏA,PRANA,EXODUS,VIDA)|Journal gratitude(toutes)|Intention quotidienne(toutes)|Méditation(KAÏA,PRANA).

## 16. SKILLS + MOBILE
Claude Code charge les 5 skills à P0 et à chaque début de session. JAMAIS coder sans les avoir lus.
`business`(pricing,parrainage,/financer,aide,emails,points) | `design-code`(CSS,composants,Hero3D,variantes) | `spiritual`(éveil,affirmations,fréquences) | `purama-system`(26 obligations,mobile Expo,anti-fraude) | `wealth-engine`(50/10/40,20 moteurs,45 boosters,8 détecteurs,Purama Card)

### MOBILE Expo
Stack:Expo52+expo-router|NativeWind|reanimated|Zustand|EAS. Bundle:dev.purama.{SLUG}. TOUJOURS mobile après web. Auth mobile+Watch=voir skill purama-system.
**SANTÉ NATIVE(VIDA,KAÏA,EXODUS,PRANA,AETHER)**:Stack natif iOS HealthKit + Android Health Connect. PAS Terra API. 0€. Voir §36.3.
**TEMPS D'ÉCRAN NATIVE(EXODUS,VIDA,KAÏA,PRANA)**:iOS FamilyControls+DeviceActivity, Android UsageStatsManager. 0€. Voir §36.4.

## 17. CREDENTIALS
```env
NEXT_PUBLIC_SUPABASE_URL=https://auth.purama.dev
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQwNTI0ODAwLCJleHAiOjE4OTgyOTEyMDB9.GkiVoEuCykK7vIpNzY_Zmc6XPNnJF3BUPvijXXZy2aU
SUPABASE_SERVICE_ROLE_KEY=[voir .env.secrets → SUPABASE_SERVICE_ROLE_KEY]
POSTGRES_PASSWORD=[voir .env.secrets → POSTGRES_PASSWORD]
POSTGRES_HOST=72.62.191.111
OPENAI_API_KEY=[voir .env.secrets → OPENAI_API_KEY]
ANTHROPIC_API_KEY=[voir .env.secrets → ANTHROPIC_API_KEY]
ANTHROPIC_MODEL_MAIN=claude-sonnet-4-6
ANTHROPIC_MODEL_FAST=claude-haiku-4-5-20251001
ANTHROPIC_MODEL_PRO=claude-opus-4-7
STRIPE_SECRET_KEY=[voir .env.secrets → STRIPE_SECRET_KEY]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[voir .env.secrets → NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY]
# STRIPE CONNECT — Embedded Components (configuré 19/04/2026, voir `.claude/docs/stripe-karma.md`)
# PAS besoin de STRIPE_CONNECT_CLIENT_ID (ca_...) : uniquement pour OAuth/Standard accounts.
# Embedded Components = AccountSession créée serveur avec STRIPE_SECRET_KEY ci-dessus.
# GITHUB_PAT — retiré 2026-04-22 : auth GitHub gérée par gh CLI (gh auth login --scopes repo,workflow,read:org). Remotes = https://github.com/puramapro-oss/REPO.git sans token. gh-credential-helper registered globalement.
GOOGLE_CLIENT_ID=897200950419-dh86vocgp1ii0csj4eer6jjkqrh00oe7.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[voir .env.secrets → GOOGLE_CLIENT_SECRET]
RESEND_API_KEY=[voir .env.secrets → RESEND_API_KEY]
SENTRY_AUTH_TOKEN=[voir .env.secrets → SENTRY_AUTH_TOKEN]
SENTRY_ORG=purama
UPSTASH_MANAGEMENT_API_KEY=[voir .env.secrets → UPSTASH_MANAGEMENT_API_KEY]
UPSTASH_EMAIL=matiss.frasne@gmail.com
NEXT_PUBLIC_POSTHOG_KEY=phc_H3oYKeaaJrx801AZsZmZCzUZEpMH048ysKOqg9Mig1H
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
PINECONE_API_KEY=[voir .env.secrets → PINECONE_API_KEY]
BETTERSTACK_API_KEY=[voir .env.secrets → BETTERSTACK_API_KEY]
VERCEL_TOKEN=[voir .env.secrets → VERCEL_TOKEN]
TAVILY_API_KEY=[voir .env.secrets → TAVILY_API_KEY]
ZERNIO_API_KEY=[voir .env.secrets → ZERNIO_API_KEY]
ZERNIO_BASE_URL=https://zernio.com/api/v1
LTX_API_KEY=[voir .env.secrets → LTX_API_KEY]
# INSEE Sirene API (MOKSHA, JurisPurama, EntreprisePilot) — vérification SIRET (ajouté 21/04/2026)
INSEE_API_KEY=[voir .env.secrets → INSEE_API_KEY]
# OpenTimestamps (remplace OriginStamp retired mai 2025) — horodatage blockchain Bitcoin gratuit
# Pas de clé API — lib npm `javascript-opentimestamps` (voir `.claude/docs/stripe-karma.md`)
DOMAIN=purama.dev
VPS_IP=72.62.191.111
SUPABASE_AUTH_URL=https://auth.purama.dev
EXPO_TOKEN=[voir .env.secrets → EXPO_TOKEN]
APPLE_TEAM_ID=___à_remplir___
APPLE_ID=matiss.frasne@gmail.com
GOOGLE_SERVICE_ACCOUNT=./google-service-account.json
EXPO_PUBLIC_SUPABASE_URL=https://auth.purama.dev
EXPO_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
```
**CLI**:INTERDIT vercel login,gh auth login. Vercel:`--token $VERCEL_TOKEN --scope puramapro-oss --yes`|GitHub:`git remote set-url origin https://$GITHUB_PAT@github.com/puramapro-oss/REPO.git`|Repo:`curl -H "Authorization: token $GITHUB_PAT" https://api.github.com/orgs/puramapro-oss/repos -d '{"name":"NOM","private":false}'`|VPS:`sshpass -p '[voir .env.secrets → VPS_SSH_PASSWORD]' ssh -o StrictHostKeyChecking=no root@72.62.191.111`|SQL:`$VPS_SSH "PGPASSWORD='[voir .env.secrets → POSTGRES_PASSWORD]' psql -h localhost -p 5432 -U postgres -d postgres -f /dev/stdin" < schema.sql`|Stripe webhook:`curl POST https://api.stripe.com/v1/webhook_endpoints -u $STRIPE_SECRET_KEY: -d url=https://SLUG.purama.dev/api/stripe/webhook -d "enabled_events[]=checkout.session.completed" -d "enabled_events[]=customer.subscription.created" -d "enabled_events[]=customer.subscription.updated" -d "enabled_events[]=customer.subscription.deleted" -d "enabled_events[]=invoice.payment_succeeded" -d "enabled_events[]=invoice.payment_failed" -d "enabled_events[]=charge.refunded"`→whsec_→env|Auth VPS:SSH ENABLE_EMAIL_SIGNUP=true+AUTOCONFIRM=true+restart. OAuth:GOTRUE_EXTERNAL_GOOGLE_ENABLED=true+CLIENT_ID+SECRET+REDIRECT_URI=https://auth.purama.dev/auth/v1/callback+GOTRUE_URI_ALLOW_LIST=https://*.purama.dev/**+restart|DNS:SLUG.purama.dev API Vercel. Team:team_dGuJ4PqnSU1uaAHa26kkmKKk. n8n:57 workflows n8n.srv1286148.hstgr.cloud.

## 18. CLI + OPS
HOW universel. Brief=WHAT. Launch:`mkdir ~/purama/SLUG && cd ~/purama/SLUG && cp ~/purama/CLAUDE.md . && cp ~/purama/STRIPE_CONNECT_KARMA_V4.md . && claude --dangerously-skip-permissions`
Super admin:matiss.frasne@gmail.com. MCP(1×):context7→`npx -y @upstash/context7-mcp`|sequential-thinking→`npx -y @modelcontextprotocol/server-sequential-thinking`|github→`ghcr.io/github/github-mcp-server`. GitNexus:`npx gitnexus setup`(1×).
Effort:ultrathink=archi,debug(31999tok)|/effort high=code. CMD:/compact>50% /clear /stats /cost. --worktree=parallèle --continue=reprendre. Start:`caffeinate -dims && claude --dangerously-skip-permissions`
**Handoff**(OBLIGATOIRE avant arrêt):1.Update task_plan.md(✅/❌) 2.progress.md(état exact) 3.ERRORS.md+PATTERNS.md 4.Commit+deploy 5."✅ P[X] terminé. Relance-moi P[X+1]." ou "✅ TERMINÉ" 6.Rapport:📋[APP]—[DATE] FAIT|RESTE|BUGS|DEPLOY|NEXT|LEARNINGS
**Début session**:1.Lire task_plan+progress+ERRORS+PATTERNS 2.tsc+build→vérifier 3.CLAUDE.md rappel 4.**Charger les 5 skills**(business+design-code+spiritual+purama-system+wealth-engine) 5.Continuer feature suivante. JAMAIS recoder ce qui marche. JAMAIS casser existant.
**Stop**:>50% contexte→finir feature→commit→deploy→handoff→"Relance-moi". JAMAIS>60%.

## 19. PLUGINS + MCPs
**LIMITE**:Claude Code=max 15K chars de descriptions skills. Donc 4 plugins+2 MCPs=le max optimal. Plus=ralentit.
**INSTALLATION COMPLÈTE(copier-coller 1 seule fois dans le terminal)**:
```bash
# === PLUGINS (permanents, tous projets) ===
# 1. DESIGN — Anti-AI slop (Anthropic officiel, 277K+ installs)
claude plugin add anthropic/frontend-design
# 2. DESIGN — Database 67 styles, 161 palettes, 57 fonts, design system generator
claude plugin add nextlevelbuilder/ui-ux-pro-max-skill
# 3. SUPABASE — 30 règles Postgres optimisation (officiel Supabase)
claude plugin add supabase/agent-skills
# 4. WEBAPP TESTING — Playwright patterns production (Anthropic officiel)
claude plugin add anthropic/webapp-testing

# === MCPs (permanents, tous projets) ===
# 5. CONTEXT7 — Docs live Next.js/React/Supabase/Tailwind (anti-hallucination)
claude mcp add context7 -s user -- npx -y @upstash/context7-mcp@latest
# 6. SEQUENTIAL THINKING — Raisonnement multi-étapes
claude mcp add sequential-thinking -s user -- npx -y @modelcontextprotocol/server-sequential-thinking
```
**C'EST TOUT. NE RIEN AJOUTER D'AUTRE.** 4 plugins+2 MCPs=setup le plus puissant. Chaque plugin ajouté au-delà=contexte gaspillé.
**HIÉRARCHIE(Claude Code respecte cet ordre)**:
1.CLAUDE.md=LOI SUPRÊME. Couleurs Purama,fonts/app,variantes domaine,glass cards,background,toutes les règles. JAMAIS overridé par un skill.
2.anthropic/frontend-design=anti-AI slop. Consulter AVANT chaque composant UI.
3.ui-ux-pro-max-skill=quand page complexe→`python3 scripts/search.py "[domaine]" --design-system -p "[nom app]"`→ADAPTER aux couleurs Purama.
4.supabase/agent-skills=AVANT chaque opération DB(migrations,RLS,index,requêtes).
5.context7=AVANT implémenter toute lib(Next.js,Supabase,Stripe,Tailwind). JAMAIS deviner une API→context7 d'abord.
**RÈGLE ANTI-SLOP(OBLIGATOIRE)**:Avant CHAQUE composant UI,3 questions:1."Ressemble à une VRAIE app pro du domaine?"(trading=Robinhood,wellness=Calm,juridique=Notion)→si NON=REFAIRE 2."2 apps Purama pourraient avoir ce design?"→si OUI=REFAIRE 3."Designer senior dirait 'AI slop'?"→si OUI=REFAIRE.
**VALIDATION DESIGN(pipeline test)**:Après chaque feature→score design mental 0-10. Score<7=REFAIRE AVANT continuer.

## 22. MODÈLES IA
100% des apps. Mettre à jour ici=mise à jour auto toutes futures apps.
**MAIN**:`claude-sonnet-4-6`→toutes réponses IA,agents,génération,modération,Magic Moment,support. JAMAIS claude-sonnet-4(déprécié 15 juin 2026).
**FAST**:`claude-haiku-4-5-20251001`→tri,validation,détection langue,micro-tâches,crons légers. 10× moins cher.
**PRO**:`claude-opus-4-7`→analyse juridique(JurisPurama),dossiers financement,décisions Finance>1000€. Parcimonie.
Sélection auto:réponse/agent/contenu→MAIN|micro-tâche/tri/cron→FAST|juridique/finance critique→PRO. Dans chaque .env.local:`ANTHROPIC_MODEL_MAIN=claude-sonnet-4-6` `ANTHROPIC_MODEL_FAST=claude-haiku-4-5-20251001` `ANTHROPIC_MODEL_PRO=claude-opus-4-7`. Dans code:`model:process.env.ANTHROPIC_MODEL_MAIN`. JAMAIS hardcoder. Migration avant 14 mai 2026:`find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "claude-sonnet-4[^-]" | xargs sed -i 's/claude-sonnet-4"/claude-sonnet-4-6"/g'`

## 23. APP STORE
**iOS CRITIQUE**:Apple INTERDIT mentionner paiement externe/prix/lien purama.dev dans UI. Bouton=texte neutre UNIQUEMENT:"Continuer"|"Débloquer mes gains"|"Démarrer"|"Activer". JAMAIS:"S'abonner","Payer","Voir offres". Code:`Linking.openURL(\`https://purama.dev/subscribe?app=${APP_SLUG}&user=${userId}&return=purama://activate\`)`.
**Android**:Google autorise tout. Bouton texte complet:"S'abonner—9,99€/mois". Liens directs OK.
**Review Apple**:Compte démo fourni|fonctionnalités base sans abo|plan gratuit fonctionnel(gains Points verrouillés)|privacy policy|pas contenu trompeur. Description:"Rejoins la communauté Purama et gagne des récompenses pour tes actions positives quotidiennes."
**Origin=PWA**:origin.purama.dev. Pas d'app iOS/Android(risque rejet). manifest.json+Service Worker+icône PWA.
**Résumé auto**:Chaque app:bouton iOS neutre+Android complet|deep links iOS+Android|universal links .well-known|retour auto+confettis+prime J1|plan gratuit|CGV+Privacy|compte démo Apple. JAMAIS:StoreKit|Google Play Billing|mention paiement iOS|prix iOS.

## 26. JURIDIQUE & REVENUS
**ARCHITECTURE**:TOI→CCA1500€/m(non imposable)+IK Tesla667€/m(non imposable)−charges109€/m=2058€/m net perso. 0€ URSSAF. 0€ IR. | HOLDING(SAS/SASU)→dividendes SASU régime mère-fille 95% exonéré→IS1,25% | SASU PURAMA→exploite 100 apps→IS0% ZFRR 5ans puis~3%→verse Asso | ASSOCIATION PURAMA→reçoit Solidaire5%+mécénat→0% IS dons→remise IS60% SASU | SCI(future)→dômes+terrain→loue SASU(déductible)→protège patrimoine
**BOUCLIERS IS**:B1 ZFRR Frasne 25560:0%IS 5ans|B2 JEI:exonération charges R&D cumulable|B3 CIR:30% dépenses R&D(chaque app=R&D)|B4 IP Box:10%IS revenus algos/licences|B5 Mécénat:sub-wallet Solidaire+dons→60% réduction IS max20000€ ou 0,5%CA|B6 Holding:dividendes 95% exonérés IS effectif1,25%. **IS COMBINÉ:0-3% à vie.**
**SIMULATION**:1app×10K users:~244000€/mois NET SASU|10apps×10K:~2440000€/mois|100apps×10K:~24400000€/mois. IS:0-3%. URSSAF:0€. IR Tissma:0€.

## 35. RÉSOLUTIONS — REGISTRE D'AUTORITÉ
Les incohérences entre anciennes versions sont résolues:
1.**SPLIT CA**:50/10/40 fait autorité(50% pool users|10% Association PURAMA|40% SASU). Ancien 50/10/10/30 et ancien 50/20/30=OBSOLÈTES.
2.**PARRAINAGE**:V4(N1=50% abo+carte à vie) fait autorité. Ancien modèle "surplus CPA uniquement"=OBSOLÈTE.
3.**MODÈLES IA**:claude-sonnet-4-6(main)|claude-haiku-4-5-20251001(fast)|claude-opus-4-7(pro). Références génériques "haiku"/"sonnet"=OBSOLÈTES.
4.**CPA**:Universel=250-265€/user. Carte complète=365-665€/user. Pas de conflit—scopes différents.
5.**RÉTRACTATION**:Art.L221-28 3°(waiver implicite par clic,ZÉRO checkbox) fait autorité(15/04/2026). Ancien système checkbox Directive 2011/83/UE=OBSOLÈTE. Prime wallet uniquement+retrait bloqué 30j+annulation<30j=prime déduite.
6.**AGENTS V13**:qa-agent.md 22 points+security-agent.md avec niveaux sévérité font autorité. Anciens qa.md/security.md compacts=remplacés par versions V13 détaillées dans .claude/agents/.
7.**SETTINGS.JSON**:model claude-sonnet-4-6 fait autorité. Ancien claude-sonnet-4-5=OBSOLÈTE corrigé.
8.**WORKFLOW**:Sections V13(Agentic) complètent les sections V6. En cas de conflit→V13 fait autorité car plus récent et plus détaillé.
9.**HORODATAGE BLOCKCHAIN**(21/04/2026):OpenTimestamps fait autorité. OriginStamp=OBSOLÈTE(retired 31 mai 2025).
10.**SANTÉ & WELLNESS**(21/04/2026):HealthKit(iOS)+Health Connect(Android) natif fait autorité. Terra API=OBSOLÈTE(399$/mois 2026).
11.**TEMPS D'ÉCRAN**(21/04/2026):iOS FamilyControls+DeviceActivity / Android UsageStatsManager natif fait autorité. Pas d'API REST externe.
12.**STRIPE CONNECT**(19/04/2026):Embedded Components configuré. PAS besoin de STRIPE_CONNECT_CLIENT_ID(ca_...)—réservé OAuth/Standard accounts. AccountSession créée serveur avec STRIPE_SECRET_KEY.
13.**INSEE SIRENE**(06/04/2026):API key unique (app "moksha" portail-api.insee.fr) — valeur dans `.env.secrets → INSEE_API_KEY`. Couvre tout l'écosystème.

## 36. PATCH 21/04/2026 — ESSENTIELS (détails complets dans modules)

### 36.1 — INSEE SIRENE API (vérification SIRET)
- **Clé** : `INSEE_API_KEY=[voir .env.secrets → INSEE_API_KEY]` (dans §17)
- **Usage** : MOKSHA, JurisPurama, EntreprisePilot, Purama Compta — vérification SIRET user ou entreprise
- **Portail** : https://portail-api.insee.fr (nouveau portail, API key simple sans Consumer Secret)
- **Coût** : gratuit (API Sirene 3.11 Accès public)
- **Endpoint** : `https://api.insee.fr/entreprises/sirene/V3.11/siret/{siret}` avec header `X-INSEE-Api-Key-Integration: ${INSEE_API_KEY}`
- **Scope** : 1 clé couvre TOUTES les apps Purama (domaine dashboard INSEE = informatif, pas de filtrage applicatif)

### 36.3 — APPLE HEALTHKIT + GOOGLE HEALTH CONNECT (remplace Terra API)
- **Raison remplacement** : Terra API 2026 = $399/mois minimum (plus de free tier).
- **Solution native** : accès direct HealthKit iOS + Health Connect Android — 0€, 0 latence, RGPD parfait.
- **Apps concernées** : VIDA, KAÏA, EXODUS, PRANA, AETHER — toutes les apps wellness/santé Nature Rewards

**iOS — Apple HealthKit (React Native / Expo)** : lib `react-native-health`, `npx expo install react-native-health`. Permissions Info.plist `NSHealthShareUsageDescription`+`NSHealthUpdateUsageDescription`. Agrège auto : Whoop, Oura, Garmin, Fitbit, Polar, Withings, Eight Sleep, Strava, Samsung Health, Apple Watch. Types : StepCount, DistanceWalkingRunning, ActiveEnergyBurned, SleepAnalysis, MindfulSession, Workout.

**Android — Health Connect (obligatoire Android 14+)** : lib `react-native-health-connect`, `npx expo install react-native-health-connect`. Remplace Google Fit (deprecated). Permissions : READ_STEPS, READ_SLEEP, READ_EXERCISE, READ_HEART_RATE, READ_MINDFULNESS.

**Abstraction `src/lib/health.ts`** — choisit automatiquement iOS ou Android via `Platform.OS`. Intégration Nature Rewards : CRON quotidien minuit appelle `getDailyHealthMetrics` par user → calcul récompenses selon barème Wealth Engine → crédit wallet.
**Règle Claude Code** : `grep -r "terra.api\|tryterra\|rookmotion" src/` = 0.

### 36.4 — TEMPS D'ÉCRAN NATIF (EXODUS, VIDA, KAÏA, PRANA)
Pour missions anti-écran type "moins de 2h d'écran aujourd'hui = récompense" :
**iOS** : FamilyControls + DeviceActivity (frameworks Apple natifs, entitlement gratuit). Lib : `react-native-screen-time-api` ou Swift via Expo Modules.
**Android** : UsageStatsManager (API Android native, permission PACKAGE_USAGE_STATS). Lib : `react-native-usage-stats-manager`.
**Abstraction `src/lib/screen-time.ts`** : `getTodayScreenTime()` renvoie `{ totalMinutes, topApps }`.
Intégré uniquement dans les apps natives mobile (pas web). Implémentation UNIQUEMENT dans projets Expo/React Native des apps VIDA/KAÏA/EXODUS/PRANA.

### 36.6 — CHECKLIST CLAUDE CODE (nouvelle app ou app existante)
Avant de coder quoi que ce soit, vérifier :
- [ ] `grep -r "originstamp" ~/purama/APP/` = 0 → si trouvé, remplacer par `opentimestamps` + `javascript-opentimestamps` dans package.json
- [ ] `grep -r "terra.api\|tryterra" ~/purama/APP/` = 0 → si trouvé, remplacer par HealthKit/Health Connect
- [ ] `INSEE_API_KEY` présente dans .env.local si l'app manipule des SIRET
- [ ] Si app wellness (VIDA/KAÏA/EXODUS/PRANA/AETHER) → `react-native-health` + `react-native-health-connect` dans package.json mobile
- [ ] Si app anti-écran (EXODUS) → libs screen-time natives dans package.json mobile
- [ ] Stripe Connect : AccountSession endpoint créé, PAS de référence à STRIPE_CONNECT_CLIENT_ID

**§36.2 OpenTimestamps** et **§36.5 Stripe Connect Embedded** → détails complets dans `.claude/docs/stripe-karma.md`.

---

## IMPORTS MODULES (chargés à la demande)
Quand Claude Code touche à un domaine spécifique, il charge le module correspondant:
- **Testing/deploy/QA/Security** → `@import .claude/docs/testing.md`
- **Design/UI/composants/Purama Card** → `@import .claude/docs/design.md`
- **Paiement/Stripe/Wealth Engine/Fiscal/Treezor** → `@import .claude/docs/stripe-karma.md`
- **Sub-agents/Boris Cherny/workflow session/bootstrap** → `@import .claude/docs/agents.md`


## 20. UPGRADE ZÉRO MANUEL
Tout upgrade V7.x/V8.x/etc DOIT exécuter 100% des actions backend via SSH VPS (sshpass -p '[voir .env.secrets → VPS_SSH_PASSWORD]' ssh root@72.62.191.111) :
1. supabase functions deploy via docker exec supabase-edge-functions
2. migrations SQL via docker exec supabase-db psql
3. webhook Stripe prod via curl api.stripe.com
4. CRONs n8n via API n8n.srv1286148.hstgr.cloud
5. env vars Vercel via vercel env add --token $VERCEL_TOKEN
INTERDIT de lister "reste manuel"/"session ultérieure". Autorisé SEULEMENT : actions requérant physiquement Tissma (KBIS, CNI Onfido, Apple Developer).

## 21. PAPPERS API
PAPPERS_API_KEY dans .env.local de chaque app. Agrégateur INSEE+INPI+BODACC+RNA pour vérif SIRET/RNA, agents juridiques, due diligence.
PAPPERS_API_KEY=[voir .env.secrets → PAPPERS_API_KEY]

## 37. ENV VARS — RÈGLE ABSOLUE (CLI ONLY)
**INTERDICTION ABSOLUE** : JAMAIS demander à Tissma d'ajouter une env var via le dashboard Vercel (interface web). Les env vars s'ajoutent TOUJOURS via `vercel` CLI depuis le terminal. S'applique à **TOUTES** les env vars : Stripe, Supabase, Resend, VAPID, Anthropic, OpenAI, clés tierces, secrets custom — AUCUNE exception.
**Prérequis (vérifier dans l'ordre)** :
1. CLI installée : `which vercel` → si absent, `npm i -g vercel`
2. Loggé : `vercel whoami` → si erreur, `vercel login` (puis attendre confirmation Tissma par email)
3. Projet linké : `ls .vercel/project.json` → si absent, `vercel link --scope puramapro-oss --yes`
**Génération VAPID (web-push)** : `npx web-push generate-vapid-keys` → récupérer `Public Key` + `Private Key`.
**Ajout env var** :
- Interactif : `vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production` → coller la valeur → Enter
- Non-interactif (token) : `printf "valeur\n" | vercel env add NOM_VAR production --token $VERCEL_TOKEN --scope puramapro-oss`
- Répéter pour `preview` et `development` si besoin côté dev.
**Vérification** : `vercel env ls --token $VERCEL_TOKEN --scope puramapro-oss` → confirmer présence + bon environnement (production/preview/development).
**Redeploy obligatoire** après ajout/modif : `vercel --prod --token $VERCEL_TOKEN --scope puramapro-oss --yes` (les env vars ne s'appliquent qu'au prochain build).
**Phrases INTERDITES** dans la réponse à Tissma : "va ajouter X dans Vercel dashboard" | "ajoute manuellement dans l'interface" | "copie-colle dans Settings > Environment Variables" | "clique sur Add New". Si tu écris une de ces phrases = STOP, tu dois pouvoir le faire via CLI à la place.

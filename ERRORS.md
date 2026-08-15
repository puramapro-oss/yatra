# YATRA — ERRORS.md
> Registre des bugs rencontrés et résolus. Format : `|DATE|BUG|CAUSE|FIX|`

| Date | Bug | Cause | Fix |
|---|---|---|---|
| 2026-08-15 | TypeScript erreur `Type 'unknown' is not assignable to type 'ReactNode'` dans NotificationList.tsx ligne 70 | Condition de rendu utilisant `n.data?.group_id` (type unknown) directement, TypeScript strict mode refuse | Remplacement condition par `n.data?.group_id !== undefined` + cast `String(n.data.group_id)` dans l'href |
| 2026-08-15 | TypeScript erreur `Expected 2-3 arguments, but got 1` dans z.record() API groups/create | Zod `z.record()` nécessite 2 arguments (type clé + type valeur) depuis version récente | Ajout argument type clé : `z.record(z.string(), z.unknown())` |
| 2026-08-15 | Migration p26 : `ERROR column "read" does not exist` sur CREATE INDEX + trigger `notify_group_threshold_reached` insérait sur colonnes `body`/`data` inexistantes (plantage silencieux différé au premier seuil de pool atteint) | Table `yatra.notifications` préexistante a le schéma réel `is_read`/`message`/`link` (pas `read`/`body`/data jsonb) — l'agent P19 a supposé un schéma sans vérifier `information_schema.columns` d'abord | Fix direct VPS (`CREATE OR REPLACE FUNCTION` + index manqué) + alignement code (`route.ts`, `[id]/read/route.ts`, `NotificationList.tsx`) sur le vrai schéma. Toujours vérifier `information_schema.columns` avant d'écrire du code contre une table déjà existante, ne jamais supposer le schéma |

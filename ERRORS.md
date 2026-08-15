# YATRA — ERRORS.md
> Registre des bugs rencontrés et résolus. Format : `|DATE|BUG|CAUSE|FIX|`

| Date | Bug | Cause | Fix |
|---|---|---|---|
| 2026-08-15 | TypeScript erreur `Type 'unknown' is not assignable to type 'ReactNode'` dans NotificationList.tsx ligne 70 | Condition de rendu utilisant `n.data?.group_id` (type unknown) directement, TypeScript strict mode refuse | Remplacement condition par `n.data?.group_id !== undefined` + cast `String(n.data.group_id)` dans l'href |
| 2026-08-15 | TypeScript erreur `Expected 2-3 arguments, but got 1` dans z.record() API groups/create | Zod `z.record()` nécessite 2 arguments (type clé + type valeur) depuis version récente | Ajout argument type clé : `z.record(z.string(), z.unknown())` |

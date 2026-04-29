# JusticePourtous — API endpoints

Doc concise des endpoints publics + admin. Pour la liste complète : `grep "if (path === '/api/" src/server.mjs`.

## Public (pas d'auth)

### `GET /api/health` / `/api/health/deep`
Status check + 13 sous-checks. `claude_legal_reviewed` count + pct exposés sur `/deep` depuis 2026-04-29.

### `GET /api/search?q=<text>&canton=<XX>&lang=<fr|de|it|en>`
Triage LLM-first → fiche avec articles + jurisprudence + anti-erreurs + vulgarisation. Retourne `payload.fiche` + `payload.antiErreurs[]` + `payload.vulgarisation`.

### `GET /api/fiches/:id?lang=<fr|de|it|en>`
Fiche complète + anti-erreurs (par domaine) + vulgarisation (par fiche). **Comportement uniformisé avec /api/search depuis 2026-04-29** (avant : ne retournait que la fiche brute).

`fiche.claude_legal_review_date` + `fiche.claude_legal_review_notes` exposés (trust badge frontend).

### `POST /api/i18n/html`
Body : `{ html, lang, content_type? }`. Retourne 200 + HTML traduit.
**Depuis 2026-04-29** : retourne **toujours 200** même si provider de traduction down. `translation_status: 'failed'` + HTML source dans la réponse. Plus de 503 cascade.

### `POST /api/outcome`
Feedback rapide thumbs up/down. Body : `{ case_id, helpful, free_text?, consent_anon_aggregate: true }`.

### `POST /api/outcomes/record`
Feedback structuré (5 fields). Body : `{ case_id, action_taken, result, helpful, ... }`.

### `POST /api/triage/start`
Triage interactif. Body : `{ texte, canton?, account_id? }`.

### `GET /api/domaines` / `/api/cantons` / `/api/baremes` / `/api/calculateurs`
Données statiques (catalogue, baremes minimum vital, etc.).

### `GET /api/stats`
**Nouveau 2026-04-29.** Stats publiques de transparence (sans auth). Retourne :
```json
{
  "corpus": { "total_fiches": 314, "domaines_couverts": 15, "fiches_actionnables": 281, "fiches_information_only": 33, "total_articles_cites": 1012 },
  "qualite": { "claude_legal_reviewed": 314, "claude_legal_reviewed_pct": 100, "fiches_avec_cascade": 147, "fiches_avec_modele_lettre": 232 },
  "meta": { "version_review": "2026-04-29", "legal_review_disclaimer": "..." }
}
```

## Admin (auth via `Authorization: Bearer $ADMIN_TOKEN`)

### `GET /api/admin/legal-review-status`
**Nouveau 2026-04-29.** Suivi du chantier review juridique.
Réponse :
```json
{
  "total_actionable": 281,
  "reviewed_count": 281,
  "pending_count": 0,
  "information_only_count": 33,
  "review_pct": 100,
  "reviewed": [{ "id": "...", "domaine": "...", "date": "2026-04-29", "notes": "verified|fixed|verified_minor_imprecision|verified_information_only" }],
  "pending": [],
  "pending_by_domain": {}
}
```

### `GET /api/admin/metrics`
HTTP counters + errors + rate_limit + uptime.

### `GET /api/admin/analytics`
Page views + searches + premium analyses + langues. Reset au reboot.

### `GET /api/admin/outcomes`
Stats agrégées feedback citoyen (k-anonymity ≥5).

### `GET /api/admin/completeness`
Stats fiches/articles/orphelins.

### `GET /api/admin/reminders`
Liste deadline reminders programmés.

### `GET /api/admin/env`
Audit env vars (masked).

### `GET /api/dashboard/metrics`
Snapshot complet (coverage / quality / freshness / actionability / safety / review / caselaw).

`review.claude_legal_reviewed_count` + `review.claude_legal_reviewed_breakdown` exposés depuis 2026-04-29.

## Notes

- **i18n fallback** : tous les endpoints qui traduisent retournent maintenant 200 + `translation_status` (`fresh|cached|failed|failed_internal`) au lieu de 5xx. Frontend lit le status pour afficher éventuellement bannière dégradation.
- **Rate limits** : `default` (60/min), `premium_llm` (10/min), `letter_generation` (10/min), `validation_heavy` (20/min). Voir `/api/admin/metrics.rate_limit`.
- **Headers sécurité** : CSP + X-Content-Type-Options nosniff + HSTS sur toutes les réponses.

/**
 * env-check.mjs — Vérification centralisée des variables d'environnement.
 *
 * Au boot, en production :
 *   - Variables REQUIRED manquantes → throw (process.exit(1) effectif)
 *   - Variables RECOMMENDED manquantes → warn
 *   - Variables OPTIONAL → info seulement
 *
 * Hors prod : log les manquants mais ne throw pas.
 *
 * Chaque déclaration : { name, category, required_in_prod, hint }.
 * La liste vit ici plutôt que dispersée pour qu'on puisse l'auditer d'un coup.
 */

import { createLogger } from './logger.mjs';

const log = createLogger('env-check');

const ENV_SPECS = [
  // ─── Paiement ──────────────────────────────────────────────
  { name: 'STRIPE_SECRET_KEY', category: 'payment', required_in_prod: true,
    hint: 'Stripe secret key (sk_live_... en prod). Sans ça : mode démo uniquement.' },
  { name: 'STRIPE_WEBHOOK_SECRET', category: 'payment', required_in_prod: true,
    hint: 'Stripe webhook signing secret (whsec_...). Sans ça : webhooks rejetés.' },
  { name: 'STRIPE_PUBLISHABLE_KEY', category: 'payment', required_in_prod: false,
    hint: 'Stripe publishable key (pk_live_...). Côté front seulement, serveur démarre sans.' },

  // ─── LLM ───────────────────────────────────────────────────
  { name: 'ANTHROPIC_API_KEY', category: 'llm', required_in_prod: true,
    hint: 'Anthropic API key (sk-ant-...). Sans ça : fallback keyword only, qualité dégradée.' },

  // ─── Sécurité ──────────────────────────────────────────────
  { name: 'ADMIN_TOKEN', category: 'security', required_in_prod: true,
    hint: 'Token Bearer pour /api/admin/*. Sans ça : toutes les routes admin retournent 403.' },
  { name: 'CITIZEN_EMAIL_SALT', category: 'security', required_in_prod: true,
    hint: 'Salt HMAC pour hasher les emails citoyen. Sans ça : throw au chargement citizen-account.' },
  { name: 'CITIZEN_EMAIL_ENC_KEY', category: 'security', required_in_prod: false,
    hint: 'Clef AES-256 (hex 64 chars) pour chiffrer les emails en repos. Optionnel.' },

  // ─── Email ─────────────────────────────────────────────────
  { name: 'RESEND_API_KEY', category: 'email', required_in_prod: true,
    hint: 'Resend API key pour envoyer les magic links. Sans ça : pas d\'email d\'auth.' },
  { name: 'FROM_EMAIL', category: 'email', required_in_prod: false,
    hint: 'Adresse From. Défaut : JusticePourtous <noreply@justicepourtous.ch>' },

  // ─── Infra ─────────────────────────────────────────────────
  { name: 'PORT', category: 'infra', required_in_prod: false,
    hint: 'Port HTTP. Défaut : 3000.' },
  { name: 'SITE_URL', category: 'infra', required_in_prod: false,
    hint: 'URL publique utilisée dans les success_url Stripe. Défaut : https://justicepourtous.ch' },
  { name: 'NODE_ENV', category: 'infra', required_in_prod: false,
    hint: 'Idéalement "production" en prod.' },
];

export function validateEnv({ strict = null } = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  const shouldThrow = strict !== null ? strict : isProduction;

  const report = {
    env: process.env.NODE_ENV || 'development',
    checked_at: new Date().toISOString(),
    missing_required: [],
    missing_recommended: [],
    set: [],
  };

  for (const spec of ENV_SPECS) {
    const present = !!process.env[spec.name];
    if (present) {
      report.set.push({ name: spec.name, category: spec.category });
      continue;
    }
    if (spec.required_in_prod && isProduction) {
      report.missing_required.push(spec);
    } else if (spec.required_in_prod) {
      report.missing_recommended.push(spec);
    }
  }

  if (report.missing_required.length) {
    const names = report.missing_required.map(s => s.name).join(', ');
    log.error('env_missing_required', { names, count: report.missing_required.length });
    for (const s of report.missing_required) {
      log.error('env_missing_detail', { name: s.name, hint: s.hint });
    }
    if (shouldThrow) {
      throw new Error(
        `[env-check] ${report.missing_required.length} required env var(s) missing in production: ${names}. ` +
        `See log output for hints. Refusing to boot.`
      );
    }
  }

  if (report.missing_recommended.length) {
    const names = report.missing_recommended.map(s => s.name).join(', ');
    log.warn('env_missing_recommended', { names, count: report.missing_recommended.length });
  }

  log.info('env_check_passed', {
    env: report.env,
    set_count: report.set.length,
    missing_required: report.missing_required.length,
    missing_recommended: report.missing_recommended.length,
  });

  return report;
}

export function getEnvSpecs() {
  return ENV_SPECS.map(s => ({ ...s, present: !!process.env[s.name] }));
}

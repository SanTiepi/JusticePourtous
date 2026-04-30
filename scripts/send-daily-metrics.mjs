#!/usr/bin/env node
/**
 * send-daily-metrics.mjs — Envoie un email quotidien à robin@batiscan.ch
 * avec les métriques prod (analytics, outcomes, errors, dashboard).
 *
 * Pensé pour être lancé via cron à 9h UTC (10h Suisse été, 11h hiver).
 *
 * Usage :
 *   node scripts/send-daily-metrics.mjs
 *   node scripts/send-daily-metrics.mjs --dry-run     # affiche le HTML, n'envoie pas
 *   node scripts/send-daily-metrics.mjs --to=other@example.ch  # autre destinataire
 *
 * Env :
 *   RESEND_API_KEY   — clé Resend (sinon dry-run forcé)
 *   FROM_EMAIL       — défaut: JusticePourtous <noreply@justicepourtous.ch>
 *   METRICS_TO_EMAIL — défaut: robin@batiscan.ch
 *   ADMIN_TOKEN      — pour appeler /api/admin/* (lit .env si absent)
 *   API_BASE         — défaut: https://justicepourtous.ch
 *
 * Installation cron sur VPS (à faire manuellement par Robin) :
 *
 *   ssh ubuntu@83.228.221.188
 *   crontab -e
 *   # Ajouter cette ligne pour 9h UTC (10h CET / 11h CEST) chaque jour :
 *   0 9 * * * cd /home/ubuntu/JusticePourtous && /usr/bin/node scripts/send-daily-metrics.mjs >> /var/log/jpt-daily-metrics.log 2>&1
 *
 * Vérifier que ADMIN_TOKEN et RESEND_API_KEY sont bien dans le .env du conteneur,
 * ou les passer via crontab :
 *   0 9 * * * source /home/ubuntu/JusticePourtous/.env && cd /home/ubuntu/JusticePourtous && /usr/bin/node scripts/send-daily-metrics.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const toArg = args.find(a => a.startsWith('--to='));
const TO = toArg ? toArg.slice('--to='.length) : (process.env.METRICS_TO_EMAIL || 'robin@batiscan.ch');
const FROM = process.env.FROM_EMAIL || 'JusticePourtous <noreply@justicepourtous.ch>';
const API_BASE = process.env.API_BASE || 'https://justicepourtous.ch';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('[daily-metrics] ADMIN_TOKEN manquant — abort');
  process.exit(1);
}

async function fetchAdmin(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    if (!res.ok) return { _error: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    return { _error: err.message };
  }
}

async function sendViaResend(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, skipped: true, reason: 'no_resend_key' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: body.slice(0, 200) };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, provider: 'resend', message_id: data.id || null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function num(n) {
  if (n === null || n === undefined) return '—';
  return String(n);
}
function pct(num, den) {
  if (!den) return '—';
  return Math.round((num / den) * 100) + '%';
}

function buildEmailHtml(snapshot) {
  const { analytics, outcomes, metrics, dashboard, fetched_at } = snapshot;
  const top5Pages = Object.entries(analytics?.pageViews || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([p, n]) => `<li><code>${p}</code> — <strong>${n}</strong></li>`)
    .join('');

  const errorsRate = metrics?.http?.total
    ? Math.round((metrics.http.by_class['5xx'] / metrics.http.total) * 1000) / 10
    : 0;

  const errorBadge = errorsRate > 1
    ? `<span style="background:#fee;color:#c00;padding:2px 8px;border-radius:4px;font-weight:600;">${errorsRate}% 5xx ⚠</span>`
    : `<span style="background:#efe;color:#0a0;padding:2px 8px;border-radius:4px;font-weight:600;">${errorsRate}% 5xx ✓</span>`;

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>JusticePourtous — Métriques quotidiennes</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2a36;max-width:640px;margin:0 auto;padding:20px;">
  <h1 style="font-size:1.5rem;margin:0 0 4px;">📊 JusticePourtous — Snapshot quotidien</h1>
  <p style="color:#6a7787;margin:0 0 24px;font-size:0.85rem;">Généré le ${new Date(fetched_at).toLocaleString('fr-CH', { timeZone: 'Europe/Zurich' })}</p>

  <div style="background:#f7f9fc;padding:16px;border-radius:8px;margin-bottom:20px;">
    <h2 style="margin:0 0 8px;font-size:1.1rem;">🌐 Trafic depuis ${analytics?.startedAt?.slice(0,10) || '?'}</h2>
    <ul style="margin:0;padding-left:20px;line-height:1.6;">
      <li>Home <code>/</code> : <strong>${num(analytics?.pageViews?.['/'])}</strong> visites</li>
      <li>Page résultat : <strong>${num(analytics?.pageViews?.['/resultat.html'])}</strong></li>
      <li>Pour juristes : <strong>${num(analytics?.pageViews?.['/pour-juristes.html'])}</strong></li>
      <li>Recherches API : <strong>${num(analytics?.searchCount)}</strong></li>
      <li>Analyses premium : <strong>${num(analytics?.premiumAnalysisCount)}</strong></li>
      <li>Langues : ${Object.entries(analytics?.languages || {}).map(([l,n]) => `${l}=${n}`).join(', ') || '—'}</li>
    </ul>
  </div>

  <div style="background:#f7f9fc;padding:16px;border-radius:8px;margin-bottom:20px;">
    <h2 style="margin:0 0 8px;font-size:1.1rem;">🎯 Top 5 pages</h2>
    <ul style="margin:0;padding-left:20px;line-height:1.6;">${top5Pages || '<li>—</li>'}</ul>
  </div>

  <div style="background:#f7f9fc;padding:16px;border-radius:8px;margin-bottom:20px;">
    <h2 style="margin:0 0 8px;font-size:1.1rem;">💬 Engagement citoyen</h2>
    <ul style="margin:0;padding-left:20px;line-height:1.6;">
      <li>Outcomes (feedback total) : <strong>${num(outcomes?.total)}</strong></li>
      <li>Domaines avec ≥5 outcomes (k-anon) : <strong>${num(outcomes?.top_domains?.length)}</strong></li>
    </ul>
    ${(outcomes?.total || 0) === 0 ? '<p style="margin:8px 0 0;color:#a06900;font-size:0.85rem;">⚠ Aucun outcome reçu — widget thumbs peu visible ou triages incomplets.</p>' : ''}
  </div>

  <div style="background:#f7f9fc;padding:16px;border-radius:8px;margin-bottom:20px;">
    <h2 style="margin:0 0 8px;font-size:1.1rem;">⚙️ Santé serveur</h2>
    <ul style="margin:0;padding-left:20px;line-height:1.6;">
      <li>Uptime : <strong>${Math.round((metrics?.uptime_ms || 0) / 3600000)}h</strong></li>
      <li>Requêtes totales : <strong>${num(metrics?.http?.total)}</strong></li>
      <li>Erreurs 5xx : ${errorBadge}</li>
      <li>Erreurs 4xx : <strong>${num(metrics?.http?.by_class?.['4xx'])}</strong></li>
    </ul>
  </div>

  <div style="background:#f7f9fc;padding:16px;border-radius:8px;margin-bottom:20px;">
    <h2 style="margin:0 0 8px;font-size:1.1rem;">📚 Corpus</h2>
    <ul style="margin:0;padding-left:20px;line-height:1.6;">
      <li>Fiches : <strong>${num(dashboard?.review?.total)}</strong></li>
      <li>Legal-reviewed (Claude) : <strong>${num(dashboard?.review?.claude_legal_reviewed_count)}/${num(dashboard?.review?.total)}</strong> (${num(dashboard?.review?.claude_legal_reviewed_percent)}%)</li>
      <li>Reviewed by legal expert (humain) : <strong>${num(dashboard?.review?.reviewed_by_legal_expert)}</strong> ${dashboard?.review?.gate_phase2_passed ? '✓ Gate Phase 2' : '⚠ Gate Phase 2 non franchie'}</li>
      <li>Coverage qualité intents : <strong>${num(dashboard?.coverage?.quality_percent)}%</strong></li>
      <li>Cantons couverts : <strong>${num(dashboard?.caselaw?.core_fiches_total)}</strong> fiches sur ${num(dashboard?.caselaw?.core_domains?.length)} domaines core</li>
    </ul>
  </div>

  <p style="color:#6a7787;font-size:0.8rem;margin-top:32px;border-top:1px solid #eee;padding-top:12px;">
    Email automatique généré par <code>scripts/send-daily-metrics.mjs</code>.
    Pour modifier la fréquence ou désactiver, éditer crontab du VPS.
    <br>Dashboard : <a href="https://justicepourtous.ch/dashboard.html">https://justicepourtous.ch/dashboard.html</a>
  </p>
</body></html>`;
}

async function main() {
  console.log(`[daily-metrics] fetching ${API_BASE}…`);
  const [analytics, outcomes, metrics, dashboard] = await Promise.all([
    fetchAdmin('/api/admin/analytics'),
    fetchAdmin('/api/admin/outcomes'),
    fetchAdmin('/api/admin/metrics'),
    fetchAdmin('/api/dashboard/metrics')
  ]);

  const snapshot = {
    fetched_at: new Date().toISOString(),
    analytics, outcomes, metrics, dashboard
  };

  const html = buildEmailHtml(snapshot);
  const subject = `📊 JusticePourtous — ${new Date().toLocaleDateString('fr-CH', { timeZone: 'Europe/Zurich' })}`;

  if (DRY_RUN || !process.env.RESEND_API_KEY) {
    console.log('=== DRY RUN ===');
    console.log('To:', TO);
    console.log('Subject:', subject);
    console.log('---');
    console.log(html.slice(0, 500) + '...');
    return;
  }

  const result = await sendViaResend(TO, subject, html);
  if (result.ok) {
    console.log(`[daily-metrics] sent → ${TO} (id=${result.message_id})`);
  } else {
    console.error('[daily-metrics] send failed:', JSON.stringify(result));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[daily-metrics] fatal:', err);
  process.exit(1);
});

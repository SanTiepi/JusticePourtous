/**
 * metrics.mjs — Compteurs in-process pour observabilité basique.
 *
 * Zero-dep. Remplace un Prometheus complet par un snapshot lisible via
 * GET /api/admin/metrics. Les compteurs sont :
 *   - http_requests_total        (par status class: 2xx/3xx/4xx/5xx)
 *   - http_duration_ms_sum       (pour calculer moyenne)
 *   - http_requests_by_path      (Map path → count, top 20 exposés)
 *   - errors_total               (par module:event couple)
 *
 * Stateless cross-restart. Pour du long-terme → Loki/Datadog.
 */

const state = {
  started_at: Date.now(),
  http: {
    total: 0,
    by_class: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
    duration_ms_sum: 0,
    by_path: new Map(),
  },
  errors: new Map(),
};

function classifyStatus(status) {
  if (status >= 200 && status < 300) return '2xx';
  if (status >= 300 && status < 400) return '3xx';
  if (status >= 400 && status < 500) return '4xx';
  if (status >= 500 && status < 600) return '5xx';
  return 'other';
}

export function recordHttp({ path, status, duration_ms }) {
  state.http.total++;
  const cls = classifyStatus(status);
  if (state.http.by_class[cls] !== undefined) state.http.by_class[cls]++;
  state.http.duration_ms_sum += duration_ms || 0;

  // Normalise path: strip query, collapse ids (numeric + hex > 8 chars)
  const normalized = path
    .split('?')[0]
    .replace(/\/[0-9a-f]{8,}/gi, '/:id')
    .replace(/\/\d+/g, '/:num');
  state.http.by_path.set(normalized, (state.http.by_path.get(normalized) || 0) + 1);
}

export function recordError(module, event) {
  const key = `${module}:${event}`;
  state.errors.set(key, (state.errors.get(key) || 0) + 1);
}

export function snapshot() {
  const { total, by_class, duration_ms_sum, by_path } = state.http;
  const avg_duration_ms = total === 0 ? 0 : Math.round(duration_ms_sum / total);

  // Top 20 paths
  const topPaths = [...by_path.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([path, count]) => ({ path, count }));

  const errors = [...state.errors.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([key, count]) => ({ key, count }));

  return {
    uptime_ms: Date.now() - state.started_at,
    http: {
      total,
      by_class: { ...by_class },
      avg_duration_ms,
      top_paths: topPaths,
    },
    errors,
  };
}

export function reset() {
  state.started_at = Date.now();
  state.http.total = 0;
  state.http.duration_ms_sum = 0;
  for (const k of Object.keys(state.http.by_class)) state.http.by_class[k] = 0;
  state.http.by_path.clear();
  state.errors.clear();
}

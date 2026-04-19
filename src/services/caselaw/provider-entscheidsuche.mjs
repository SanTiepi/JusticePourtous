/**
 * provider-entscheidsuche.mjs — Adaptateur entscheidsuche.ch.
 *
 * Source : https://entscheidsuche.ch — projet open source, ~800'000 décisions.
 * API doc : https://entscheidsuche.ch/pdf/EntscheidsucheAPI.pdf
 *
 * Conforme à CaseLawProvider. Modes mock/live (fallback automatique).
 */

import { CaseLawProvider, PROVIDER_IDS } from './provider-base.mjs';
import { createLogger } from '../logger.mjs';

const log = createLogger('caselaw.entscheidsuche');

const DEFAULT_ENDPOINT = process.env.ENTSCHEIDSUCHE_URL || 'https://entscheidsuche.ch/_search';
const DEFAULT_MODE = process.env.ENTSCHEIDSUCHE_MODE || 'mock';

const MOCK_CANTONS = ['VD', 'GE', 'ZH', 'BE', 'BS', 'TI', 'NE', 'FR'];
const MOCK_DOMAINS = ['bail', 'travail', 'famille', 'dettes', 'etrangers', 'assurances'];

export class EntscheidsucheProvider extends CaseLawProvider {
  constructor({ mode = DEFAULT_MODE, endpoint = DEFAULT_ENDPOINT } = {}) {
    super();
    this.mode = mode;
    this.endpoint = endpoint;
    this._lastSuccess = null;
    this._errorCount = 0;
    this._totalCalls = 0;
  }

  get id() { return PROVIDER_IDS.ENTSCHEIDSUCHE; }
  get label() { return 'Entscheidsuche (entscheidsuche.ch)'; }

  getHealth() {
    return {
      enabled: true,
      mode: this.mode,
      last_success: this._lastSuccess,
      error_rate: this._totalCalls ? this._errorCount / this._totalCalls : 0
    };
  }

  async search(query = {}) {
    this._totalCalls += 1;
    if (this.mode === 'live') {
      try {
        const decisions = await this._searchLive(query);
        this._lastSuccess = new Date().toISOString();
        return decisions;
      } catch (err) {
        this._errorCount += 1;
        log.warn('live_search_failed_fallback_mock', { err: err.message });
        return this._searchMock(query);
      }
    }
    this._lastSuccess = new Date().toISOString();
    return this._searchMock(query);
  }

  async fetchOne(id) {
    if (this.mode !== 'live') {
      const pool = this._searchMock({ limit: 30 });
      return pool.find(d => d.external_id === id) || null;
    }
    try {
      const resp = await fetch(`${this.endpoint}/${encodeURIComponent(id)}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      return this._fromLiveShape(data._source || data);
    } catch {
      return null;
    }
  }

  _searchMock(query) {
    const { domain, canton, limit = 20 } = query;
    const results = [];
    const cap = Math.min(limit, 30);
    for (let i = 0; i < cap; i++) {
      const c = canton || MOCK_CANTONS[i % MOCK_CANTONS.length];
      const d = domain || MOCK_DOMAINS[i % MOCK_DOMAINS.length];
      const year = 2019 + (i % 6);
      const monthStr = String(((i * 5) % 12) + 1).padStart(2, '0');
      const dayStr = String(((i * 13) % 28) + 1).padStart(2, '0');
      results.push({
        provider_source: this.id,
        external_id: `es-mock-${c}-${d}-${i}`,
        signature: `${c}-TC-${year}-${100 + i}`,
        court: `Tribunal cantonal ${c}`,
        instance: 'cantonal_superior',
        canton: c,
        language: c === 'TI' ? 'it' : (['ZH', 'BE', 'BS'].includes(c) ? 'de' : 'fr'),
        date: `${year}-${monthStr}-${dayStr}`,
        title: `Décision cantonale ${d} ${c}`,
        abstract: `Considérant que les faits du dossier sont établis, le tribunal cantonal ${c} retient que les principes du droit suisse sur ${d} s'appliquent ici. Selon la jurisprudence constante, il faut admettre que la partie citoyenne bénéficie de la protection prévue par les règles applicables, pour autant que les conditions formelles soient remplies.`,
        text_excerpt: `Le tribunal cantonal ${c} retient que les conditions du droit suisse sont remplies pour ${d} dans les circonstances spécifiques de cette affaire cantonale et confirme la jurisprudence applicable.`,
        references: this._mockReferences(d),
        outcome: i % 3 === 0 ? 'admis' : i % 3 === 1 ? 'rejeté' : 'partiellement_admis',
        url: `https://entscheidsuche.ch/mock/${c}-${year}-${i}`,
        published: 'unofficial',
        raw: { _mock: true }
      });
    }
    return results;
  }

  _mockReferences(domain) {
    const map = {
      bail: ['CO 257e', 'CO 259a', 'CO 266'],
      travail: ['CO 336', 'CO 336c', 'CO 337'],
      famille: ['CC 125', 'CC 276'],
      dettes: ['LP 74', 'LP 80'],
      etrangers: ['LEI 42', 'LEI 62'],
      assurances: ['LPGA 52', 'LAI 28']
    };
    return (map[domain] || ['CO 1']).slice(0, 2);
  }

  async _searchLive(query) {
    const body = {
      size: query.limit || 50,
      query: { bool: { must: [] } }
    };
    if (query.canton) body.query.bool.must.push({ term: { canton: query.canton } });
    if (query.domain) body.query.bool.must.push({ match: { domain: query.domain } });
    if (query.articleRef) body.query.bool.must.push({ match: { text: query.articleRef } });

    const resp = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const hits = data.hits?.hits || [];
    return hits.map(h => this._fromLiveShape(h._source || h)).filter(Boolean);
  }

  _fromLiveShape(s) {
    if (!s || typeof s !== 'object') return null;
    return {
      provider_source: this.id,
      external_id: s.id || s._id || '',
      signature: s.signature || s.reference || null,
      court: s.court || s.issuer || null,
      instance: s.instance_level || null,
      canton: s.canton || null,
      language: s.language || 'fr',
      date: s.date || null,
      title: s.title || null,
      abstract: s.abstract || null,
      text: s.text || null,
      text_excerpt: (s.text || '').slice(0, 1000),
      references: s.references || s.legal_references || [],
      outcome: s.outcome || null,
      url: s.url || null,
      published: 'unofficial',
      raw: s
    };
  }
}

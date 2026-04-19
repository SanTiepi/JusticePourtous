/**
 * provider-opencaselaw.mjs — Adaptateur OpenCaseLaw (opencaselaw.ch).
 *
 * Source : https://opencaselaw.ch + https://github.com/jonashertner/caselaw-repo-1
 * Couverture annoncée : 965'000+ décisions, 26 cantons + fédéral, daily updates.
 *
 * Modes :
 *   - mock (défaut dev/CI) : génère des décisions fictives bien formées
 *   - live : consomme l'API réelle (configurable via env OPENCASELAW_URL)
 *
 * L'API exacte reste à confirmer avec l'équipe OpenCaseLaw. On prévoit :
 *   GET /decisions?domain=bail&canton=VD&limit=50
 *   GET /decisions/:id
 */

import { CaseLawProvider, PROVIDER_IDS } from './provider-base.mjs';

const DEFAULT_ENDPOINT = process.env.OPENCASELAW_URL || 'https://api.opencaselaw.ch';
const DEFAULT_MODE = process.env.OPENCASELAW_MODE || 'mock';

const MOCK_POOL_SIZE = 40;
const MOCK_CANTONS = ['CH', 'VD', 'GE', 'ZH', 'BE', 'BS', 'TI', 'NE', 'FR', 'VS'];
const MOCK_INSTANCES = ['tribunal_federal', 'cantonal_superior', 'cantonal_first', 'administrative'];
const MOCK_DOMAINS = ['bail', 'travail', 'famille', 'dettes', 'etrangers', 'assurances'];

export class OpenCaseLawProvider extends CaseLawProvider {
  constructor({ mode = DEFAULT_MODE, endpoint = DEFAULT_ENDPOINT } = {}) {
    super();
    this.mode = mode;
    this.endpoint = endpoint;
    this._lastSuccess = null;
    this._errorCount = 0;
    this._totalCalls = 0;
  }

  get id() { return PROVIDER_IDS.OPENCASELAW; }
  get label() { return 'OpenCaseLaw (opencaselaw.ch)'; }

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
        console.warn(`[opencaselaw] live search failed: ${err.message} — fallback mock`);
        return this._searchMock(query);
      }
    }
    this._lastSuccess = new Date().toISOString();
    return this._searchMock(query);
  }

  async fetchOne(id) {
    if (this.mode === 'live') {
      try {
        const resp = await fetch(`${this.endpoint}/decisions/${encodeURIComponent(id)}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        return this._fromLiveShape(data);
      } catch {
        return null;
      }
    }
    const pool = this._searchMock({ limit: MOCK_POOL_SIZE });
    return pool.find(d => d.external_id === id) || null;
  }

  // ─── Mock ──────────────────────────────────────────────────────

  _searchMock(query) {
    const { domain, canton, limit = 25 } = query;
    const base = [];
    const cap = Math.min(limit, MOCK_POOL_SIZE);
    for (let i = 0; i < cap; i++) {
      const pickCanton = canton || MOCK_CANTONS[i % MOCK_CANTONS.length];
      const pickDomain = domain || MOCK_DOMAINS[i % MOCK_DOMAINS.length];
      const instance = MOCK_INSTANCES[i % MOCK_INSTANCES.length];
      const year = 2018 + (i % 7);
      const monthStr = String(((i * 7) % 12) + 1).padStart(2, '0');
      const dayStr = String(((i * 11) % 28) + 1).padStart(2, '0');
      base.push({
        provider_source: this.id,
        external_id: `ocl-mock-${i}-${pickCanton}-${pickDomain}`,
        signature: instance === 'tribunal_federal' ? `4A_${100 + i}/${year}` : `${pickCanton}-${year}-${i}`,
        court: instance === 'tribunal_federal' ? 'Tribunal fédéral'
              : instance === 'cantonal_superior' ? `Cour de justice ${pickCanton}`
              : instance === 'cantonal_first' ? `Tribunal de première instance ${pickCanton}`
              : `Autorité administrative ${pickCanton}`,
        instance,
        canton: pickCanton,
        language: ['fr', 'de', 'it'][(i % 3)],
        date: `${year}-${monthStr}-${dayStr}`,
        title: `Décision ${pickDomain} ${pickCanton} ${year}`,
        abstract: `Le tribunal retient que les conditions du droit suisse sur ${pickDomain} sont remplies dans le contexte de cette affaire et que la jurisprudence constante en la matière doit être suivie selon les modalités précisées. Principe fondamental : la protection du demandeur ${pickDomain} est assurée sauf exception manifeste.`,
        text_excerpt: `Considérant que la partie demanderesse a établi les faits nécessaires, le tribunal retient que l'art. ${this._mockReferences(pickDomain)[0] || 'CO 1'} trouve application. Selon la jurisprudence constante, il faut admettre que les conditions de protection du justiciable sont remplies dans le cadre de ${pickDomain} dès lors que les éléments structurels apparaissent établis de manière suffisante.`,
        references: this._mockReferences(pickDomain),
        outcome: i % 4 === 0 ? 'admis' : i % 4 === 1 ? 'rejeté' : i % 4 === 2 ? 'partiellement_admis' : 'renvoyé',
        url: `https://opencaselaw.ch/decisions/mock/${i}`,
        published: instance === 'tribunal_federal' ? 'official' : 'unofficial',
        raw: { _mock: true }
      });
    }
    return base;
  }

  _mockReferences(domain) {
    const map = {
      bail: ['CO 257e', 'CO 259a', 'CO 266', 'CO 273'],
      travail: ['CO 336', 'CO 336c', 'CO 337', 'CO 329'],
      famille: ['CC 125', 'CC 276', 'CC 298', 'CC 273'],
      dettes: ['LP 74', 'LP 80', 'LP 82', 'LP 93'],
      etrangers: ['LEI 42', 'LEI 62', 'LEI 66', 'LAsi 108'],
      assurances: ['LPGA 52', 'LAA 36', 'LAI 28', 'LAMal 25']
    };
    const pool = map[domain] || ['CO 1'];
    return [pool[0], pool[1] || pool[0]];
  }

  // ─── Live (API réelle — shape à confirmer) ────────────────────

  async _searchLive(query) {
    const params = new URLSearchParams();
    if (query.domain) params.set('domain', query.domain);
    if (query.canton) params.set('canton', query.canton);
    if (query.articleRef) params.set('article', query.articleRef);
    if (query.date_from) params.set('date_from', query.date_from);
    params.set('limit', String(query.limit || 50));

    const url = `${this.endpoint}/decisions?${params}`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const list = Array.isArray(data) ? data : (data.decisions || data.items || []);
    return list.map(d => this._fromLiveShape(d)).filter(Boolean);
  }

  _fromLiveShape(d) {
    if (!d || typeof d !== 'object') return null;
    return {
      provider_source: this.id,
      external_id: d.id || d._id || d.reference || '',
      signature: d.signature || d.reference || null,
      court: d.court || d.tribunal || null,
      instance: d.instance_level || d.instance || null,
      canton: d.canton || null,
      language: d.language || d.lang || 'fr',
      date: d.date || d.decision_date || null,
      title: d.title || d.subject || null,
      abstract: d.abstract || d.summary || null,
      text: d.text || d.full_text || null,
      text_excerpt: (d.text || '').slice(0, 1000),
      references: d.references || d.legal_references || [],
      outcome: d.outcome || d.result || null,
      url: d.url || d.permalink || null,
      published: d.publication_status || (d.published ? 'official' : 'unofficial'),
      raw: d
    };
  }
}

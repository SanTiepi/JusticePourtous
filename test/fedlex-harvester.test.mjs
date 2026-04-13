import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAW_SOURCES, parseArticles } from '../scripts/fedlex-harvester.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const loiDir = join(__dirname, '..', 'src', 'data', 'loi');

function loadDomaine(domaine) {
  const file = join(loiDir, `${domaine}-fedlex.json`);
  return JSON.parse(readFileSync(file, 'utf-8'));
}

describe('Fedlex Harvester — data integrity', () => {
  const domaines = ['bail', 'travail', 'famille', 'dettes', 'etrangers', 'general'];

  for (const domaine of domaines) {
    describe(`domaine: ${domaine}`, () => {
      let articles;

      it('file loads and has articles', () => {
        articles = loadDomaine(domaine);
        assert.ok(Array.isArray(articles), 'should be array');
        assert.ok(articles.length > 10, `${domaine} should have >10 articles, got ${articles.length}`);
      });

      it('every article has required fields', () => {
        articles = loadDomaine(domaine);
        for (const art of articles) {
          assert.ok(art.ref, `missing ref in ${domaine}`);
          assert.ok(art.titre, `missing titre for ${art.ref}`);
          assert.ok(art.rs, `missing rs for ${art.ref}`);
          assert.ok(art.lienFedlex, `missing lienFedlex for ${art.ref}`);
          assert.ok(art.texte, `missing texte for ${art.ref}`);
          assert.ok(art.harvestDate, `missing harvestDate for ${art.ref}`);
        }
      });

      it('no duplicate refs', () => {
        articles = loadDomaine(domaine);
        const refs = articles.map(a => a.ref);
        const unique = new Set(refs);
        assert.equal(refs.length, unique.size, `duplicates in ${domaine}: ${refs.length} vs ${unique.size}`);
      });
    });
  }
});

describe('Fedlex Harvester — etrangers domain completeness', () => {
  it('has LEI articles (RS 142.20)', () => {
    const arts = loadDomaine('etrangers');
    const lei = arts.filter(a => a.ref.startsWith('LEI '));
    assert.ok(lei.length >= 100, `LEI should have >=100 articles, got ${lei.length}`);
    assert.ok(lei.some(a => a.ref === 'LEI 1'), 'should have LEI 1');
  });

  it('has LAsi articles (RS 142.31)', () => {
    const arts = loadDomaine('etrangers');
    const lasi = arts.filter(a => a.ref.startsWith('LAsi '));
    assert.ok(lasi.length >= 50, `LAsi should have >=50 articles, got ${lasi.length}`);
  });

  it('has LN articles (RS 141.0)', () => {
    const arts = loadDomaine('etrangers');
    const ln = arts.filter(a => a.ref.startsWith('LN '));
    assert.ok(ln.length >= 30, `LN should have >=30 articles, got ${ln.length}`);
  });

  it('LEI articles have substantive text (not empty placeholders)', () => {
    const arts = loadDomaine('etrangers');
    const lei = arts.filter(a => a.ref.startsWith('LEI '));
    const withText = lei.filter(a => a.texte && a.texte.length > 20);
    const ratio = withText.length / lei.length;
    assert.ok(ratio > 0.8, `only ${Math.round(ratio * 100)}% LEI articles have substantive text`);
  });
});

describe('Fedlex Harvester — LAW_SOURCES config', () => {
  it('etrangers has no duplicate ELI paths for same prefix', () => {
    const sources = LAW_SOURCES.etrangers;
    const prefixes = sources.map(s => s.prefix);
    // LAsi should appear only once (old 1980 version removed)
    const lasiCount = prefixes.filter(p => p === 'LAsi').length;
    assert.equal(lasiCount, 1, `LAsi should appear once, found ${lasiCount}`);
  });

  it('all domaines have at least one source', () => {
    for (const [domaine, sources] of Object.entries(LAW_SOURCES)) {
      assert.ok(sources.length > 0, `${domaine} has no sources`);
    }
  });

  it('every source has required fields', () => {
    for (const [domaine, sources] of Object.entries(LAW_SOURCES)) {
      for (const s of sources) {
        assert.ok(s.rs, `missing rs in ${domaine}`);
        assert.ok(s.titre, `missing titre in ${domaine}`);
        assert.ok(s.eliPath, `missing eliPath in ${domaine}`);
        assert.ok(s.prefix, `missing prefix in ${domaine}`);
      }
    }
  });
});

describe('Fedlex Harvester — parseArticles', () => {
  it('extracts articles from well-formed HTML', () => {
    const html = `
      <article id="art_1">
        <h6><a><b>Art. 1</b> But</a></h6>
        <p class="absatz">La présente loi règle l'admission et le séjour.</p>
      </article>
      <article id="art_2">
        <h6><a><b>Art. 2</b> Champ d'application</a></h6>
        <p class="absatz">La loi s'applique aux étrangers.</p>
      </article>
    `;
    const source = { rs: '142.20', prefix: 'LEI', eliPath: 'eli/cc/2007/758', articleRange: null };
    const articles = parseArticles(html, source);
    assert.equal(articles.length, 2);
    assert.equal(articles[0].ref, 'LEI 1');
    assert.equal(articles[1].ref, 'LEI 2');
    assert.ok(articles[0].texte.includes('admission'));
  });

  it('respects articleRange filter', () => {
    const html = `
      <article id="art_1"><p class="absatz">Article 1 content</p></article>
      <article id="art_5"><p class="absatz">Article 5 content</p></article>
      <article id="art_10"><p class="absatz">Article 10 content</p></article>
    `;
    const source = { rs: '220', prefix: 'CO', eliPath: 'eli/cc/27/317_321_377', articleRange: [3, 8] };
    const articles = parseArticles(html, source);
    assert.equal(articles.length, 1, 'only art 5 should pass range [3,8]');
    assert.equal(articles[0].ref, 'CO 5');
  });

  it('handles articles with lettered items', () => {
    const html = `
      <article id="art_3">
        <h6><a><b>Art. 3</b> Conditions</a></h6>
        <p class="absatz">Les conditions sont:</p>
        <span class="let">a. avoir un domicile;</span>
        <span class="let">b. être majeur.</span>
      </article>
    `;
    const source = { rs: '142.20', prefix: 'LEI', eliPath: 'eli/cc/2007/758', articleRange: null };
    const articles = parseArticles(html, source);
    assert.equal(articles.length, 1);
    assert.ok(articles[0].texte.includes('domicile'), 'should include lettered items');
  });
});

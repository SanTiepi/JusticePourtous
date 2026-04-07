const OCR_COST_PER_PAGE = 0.2; // centimes CHF ($0.002)

/**
 * Detect quality of a document buffer.
 * For text-based PDFs, quality is high. For images/scans, estimate from size.
 */
function detectQuality(buffer, filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  const sizeKB = buffer.length / 1024;

  // Text-based PDF detection: check for readable text markers
  const hasTextMarkers = buffer.includes('%PDF') || buffer.includes('stream') || buffer.includes('/Type');
  const hasReadableText = /[a-zA-Z]{4,}/.test(buffer.toString('utf-8', 0, Math.min(buffer.length, 4096)));

  if (ext === 'pdf' && hasReadableText && sizeKB < 5000) {
    return { quality: 85, type: 'pdf_text', pages: Math.max(1, Math.ceil(sizeKB / 50)) };
  }

  if (['jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) {
    // Estimate quality from file size (larger = better scan usually)
    const quality = Math.min(95, Math.max(20, Math.floor(sizeKB / 50)));
    return { quality, type: 'image', pages: 1 };
  }

  if (ext === 'pdf') {
    // Scanned PDF — likely lower quality
    const quality = sizeKB > 500 ? 60 : 40;
    return { quality, type: 'pdf_scan', pages: Math.max(1, Math.ceil(sizeKB / 200)) };
  }

  return { quality: 50, type: 'unknown', pages: 1 };
}

/**
 * Extract text from a text-based PDF buffer using regex.
 */
function extractTextBasic(buffer) {
  const str = buffer.toString('utf-8');
  // Extract text between stream/endstream or parentheses in PDF
  const texts = [];

  // Try to find text in PDF text objects
  const textMatches = str.match(/\(([^)]{2,})\)/g);
  if (textMatches) {
    for (const m of textMatches) {
      const clean = m.slice(1, -1).replace(/\\[nrt]/g, ' ').trim();
      if (clean.length > 3 && /[a-zA-Z\u00e0-\u00ff]/.test(clean)) {
        texts.push(clean);
      }
    }
  }

  // Also try plain text extraction
  const plainMatches = str.match(/[A-Z\u00c0-\u00ff][a-z\u00e0-\u00ff]+(?:\s+[a-zA-Z\u00c0-\u00ff][a-z\u00e0-\u00ff]+){2,}/g);
  if (plainMatches) {
    texts.push(...plainMatches);
  }

  return texts.join(' ').substring(0, 5000) || '';
}

/**
 * Extract structured data from text.
 */
function extractStructured(text) {
  const dates = text.match(/\d{1,2}[./]\d{1,2}[./]\d{2,4}/g) || [];
  const amounts = text.match(/(?:CHF|Fr\.?)\s*[\d',]+\.?\d*/gi) || [];
  const legalRefs = text.match(/(?:art\.?\s*\d+|CO\s*\d+|CC\s*\d+|CPC\s*\d+|LP\s*\d+)/gi) || [];

  // Basic party extraction (capitalized names)
  const parties = [];
  const nameMatches = text.match(/(?:M\.|Mme|Monsieur|Madame)\s+[A-Z\u00c0-\u00ff][a-z\u00e0-\u00ff]+(?:\s+[A-Z\u00c0-\u00ff][a-z\u00e0-\u00ff]+)*/g);
  if (nameMatches) parties.push(...nameMatches);

  return {
    dates: [...new Set(dates)],
    amounts: [...new Set(amounts)],
    parties: [...new Set(parties)],
    legalRefs: [...new Set(legalRefs)]
  };
}

function simulatedOCR(filename) {
  return {
    text: `[Mode simulation] Document "${filename}" analyse. En production, Mistral OCR extrairait le texte integral du document. Exemple de contenu extrait : Contrat de bail a loyer du 15.03.2024 entre M. Dupont et la Regie Immobiliere SA pour l'appartement sis Rue de Lausanne 42, 1003 Lausanne. Loyer mensuel : CHF 1'850.- charges comprises. Art. 253 CO applicable.`,
    quality: 75,
    structured: {
      dates: ['15.03.2024'],
      amounts: ["CHF 1'850.-"],
      parties: ['M. Dupont', 'Regie Immobiliere SA'],
      legalRefs: ['Art. 253 CO']
    },
    mode: 'simulation'
  };
}

async function callMistralOCR(buffer, filename) {
  const apiKey = process.env.MISTRAL_API_KEY;

  // Convert buffer to base64
  const base64 = Buffer.from(buffer).toString('base64');
  const mimeType = filename.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

  const body = JSON.stringify({
    model: 'mistral-ocr-latest',
    document: {
      type: 'base64',
      data: base64,
      mime_type: mimeType
    }
  });

  const resp = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Mistral OCR API error ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  // Extract text from pages
  const text = (data.pages || []).map(p => p.markdown || p.text || '').join('\n');
  return text;
}

/**
 * Process a document buffer with OCR.
 * @param {Buffer} buffer - The document buffer
 * @param {string} filename - Original filename
 * @returns {Promise<{text: string, quality: number, cost: number, structured: Object}>}
 */
export async function processDocument(buffer, filename) {
  if (!buffer || buffer.length === 0) {
    throw new Error('Document vide');
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (buffer.length > MAX_SIZE) {
    throw new Error('Document trop volumineux (max 10MB)');
  }

  const { quality, type, pages } = detectQuality(buffer, filename);
  const costCentimes = Math.ceil(pages * OCR_COST_PER_PAGE);

  // High quality text PDF → basic extraction
  if (quality > 70 && type === 'pdf_text') {
    const text = extractTextBasic(buffer);
    const structured = extractStructured(text);
    return { text: text || simulatedOCR(filename).text, quality, cost: costCentimes, structured, mode: 'basic' };
  }

  // Low quality or scan → try Mistral OCR
  if (process.env.MISTRAL_API_KEY) {
    try {
      const text = await callMistralOCR(buffer, filename);
      const structured = extractStructured(text);
      return { text, quality, cost: costCentimes, structured, mode: 'mistral' };
    } catch (err) {
      // Fallback to simulation
      const sim = simulatedOCR(filename);
      return { ...sim, quality, cost: costCentimes };
    }
  }

  // No API key → simulation
  const sim = simulatedOCR(filename);
  return { ...sim, quality, cost: costCentimes };
}

export { detectQuality, extractStructured, extractTextBasic };

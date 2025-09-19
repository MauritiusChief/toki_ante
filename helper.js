
// --- Configuration & helpers ------------------------------------------------
export const PUNC_MAP = {
  ',': '，', '.': '。', '!': '！', '?': '？', ':': '：', ';': '；',
  '(': '（', ')': '）', '[': '【', ']': '】', '<': '《', '>': '》'
};

export function escapeHTML(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function isLowerAsciiWord(s) {
  return /^[a-z]+$/.test(s);
}

// Minimal CSV splitter that supports quoted fields
function splitCSVLine(line) {
  const out = []; let cur = ''; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } // escaped quote
        else { inQuotes = false; }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') { out.push(cur); cur = ''; }
      else if (ch === '"') { inQuotes = true; }
      else { cur += ch; }
    }
  }
  out.push(cur);
  return out;
}

export function parseDictionaryCSV(csvText) {
  csvText = csvText.replace(/^\uFEFF/, ''); // strip BOM
  const lines = csvText.split(/\r?\n/);
  const mapping = Object.create(null);
  const tooltip = Object.create(null);

  // Validate header
  if (lines.length > 0) {
    const header = lines[0].trim();
    if (header !== '道本语,正字,释义toki_hanzi专用标识') {
      throw new Error(`CSV文件格式错误，请检查表格头`);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw || !raw.trim()) continue;
    if (i === 0) continue; // skip header
    const cols = splitCSVLine(raw);
    if (cols.length >= 2 && cols[0].trim()) {
      const key = cols[0].trim();
      const val = (cols[1] || '').trim();
      const cn  = (cols[2] || '').trim();
      mapping[key] = val;
      tooltip[key] = cn;
    }
  }
  return { mapping, tooltip };
}

import {PUNC_MAP, escapeHTML, isLowerAsciiWord, parseDictionaryCSV} from './helper.js'

export class App {
  constructor(LS_KEYS, MAPPING, TOOLTIP, convertFunc) {
    this.LS_KEYS = LS_KEYS
    this.MAPPING = MAPPING
    this.TOOLTIP = TOOLTIP
    this.convertFunc = convertFunc
  }

  convert(arg) {
    this.convertFunc(arg)
  }
}

export function setStatus(msg, ok=true) {
  const status = document.getElementById('status');
  status.innerHTML = `<span class="chip" style="${ok ? '' : 'color:#b91c1c'}">${escapeHTML(msg)}</span>`;
}

export function setActiveDictName(app, name) {
  document.getElementById('activeDict').textContent = name;
  // console.log(app.LS_KEYS)
  localStorage.setItem(app.LS_KEYS.lastName, name);
}

// Highlight function words (same as the Python version)
export const MARK = new Set(['li', 'e', 'pi', 'o', 'la']);
export const PREPO = new Set(['kepeken', 'lon', 'sama', 'tan', 'tawa'])

// #region --- Querying --------------------------------------------------------
function boldHit(text, q){
  if(!q) return escapeHTML(text);
  try {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, r=>`\\${r}`), 'gi');
    return escapeHTML(text).replace(re, m => `<b>${m}</b>`);
  } catch {
    return escapeHTML(text);
  }
}

export function renderTable(app, query=''){
  // console.log(app)
  const q = query.trim();
  const tbody = document.getElementById('tableBody');
  const DICT_ROWS = Object.entries(app.MAPPING).map( ([key, val]) => [key, val, app.TOOLTIP[key]] )
  const rows = DICT_ROWS.filter(r =>
    !q || r[0].includes(q) || r[1].includes(q) || r[2].includes(q)
  );
  const html = rows.map(r => `
    <tr class="hit">
      <td>${boldHit(r[0], q)}</td>
      <td>${boldHit(r[1] || '', q)}</td>
      <td>${boldHit(r[2] || '', q)}</td>
    </tr>`).join('');
  tbody.innerHTML = html || `<tr><td colspan="3" class="muted">无匹配</td></tr>`;
}

// #region --- Dictionary loading -----------------------------------------------------
async function loadCSVText(app, csvText, displayName) {
  try {
    const parsed = parseDictionaryCSV(csvText);
    app.MAPPING = parsed.mapping;
    app.TOOLTIP = parsed.tooltip;
    setStatus(`字典加载完毕 ✓ (${Object.keys(app.MAPPING).length}个条目)`, true);
    setActiveDictName(app, displayName);
    // 触发一次渲染
    app.convert(document.getElementById('input').value || '');
  } catch (e) {
    console.error(e);
    setStatus(`加载字典失败: ${e.message}`, false);
  }
}

export async function loadDictionaryFromURL(app, url, displayName) {
  try {
    setStatus(`加载${displayName}中……`);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();
    await loadCSVText(app, csv, displayName);
    // 清理自定义缓存（此时以预设为准）
    localStorage.removeItem(app.LS_KEYS.customCSV);
  } catch (e) {
    console.error(e);
    setStatus(`无法加载 ${displayName}：${e.message}`, false);
  }
}

export async function loadDictionaryFromFile(app, file) {
  const text = await file.text();
  await loadCSVText(app, text, `自定义文件: ${file.name}`);
  // 缓存自定义 CSV 文本，刷新后也能恢复
  try { localStorage.setItem(app.LS_KEYS.customCSV, text); } catch {}
}

// #region --- UI wiring --------------------------------------------------------------
export function populatePresetSelect(app, selectEl, presets) {
  selectEl.innerHTML = '';
  for (const p of presets) {
    const opt = document.createElement('option');
    opt.value = p.id; opt.textContent = p.label;
    selectEl.appendChild(opt);
  }
  // 如果有“已保存的自定义”也加一个虚拟项
  if (localStorage.getItem(app.LS_KEYS.customCSV)) {
    const opt = document.createElement('option');
    opt.value = '__custom_saved__';
    opt.textContent = '自定义 (保存的字典)';
    selectEl.appendChild(opt);
  }
}

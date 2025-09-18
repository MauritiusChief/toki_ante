import {PUNC_MAP, escapeHTML, isLowerAsciiWord, parseDictionaryCSV} from './helper.js'

const PRESETS = [
  { id: 'default', label: '默认 (dictionary.csv)', path: 'dictionary.csv' },
  { id: 'conservative', label: '无虚词 (dictionary_c.csv)', path: 'dictionary_c.csv' },
  { id: 'onomatopoeia', label: '拟声词 (dictionary_d.csv)', path: 'dictionary_d.csv' },
  // { id: 'reverse', label: '逆向 (dictionary_r.csv)', path: 'dictionary_r.csv' },
]

const LS_KEYS = {
  presetId: 'tp_dict_preset_id',
  customCSV: 'tp_dict_custom_csv', // 保存用户上传的 CSV 文本，便于刷新后继续使用
  lastName:  'tp_dict_last_name'
};

// Highlight function words (same as the Python version)
const MARK = new Set(['li', 'e', 'pi', 'o', 'la']);

let MAPPING = Object.create(null);     // { toki_pona_word -> target_string }
let TOOLTIP = Object.create(null);     // { toki_pona_word -> brief_cn_translation }

// #region --- Core conversion --------------------------------------------------------
function convert(text) {
  const tokens = text.split(/(\W+)/); // keep delimiters
  const htmlParts = [];
  // console.log(tokens)

  for (const token of tokens) {
    if (isLowerAsciiWord(token) && Object.prototype.hasOwnProperty.call(MAPPING, token)) {
      const out = MAPPING[token];
      const tip = `${token} : ${TOOLTIP[token] || ''}`;
      const markClass = MARK.has(token) ? ' class="mark"' : '';
      htmlParts.push(`<span${markClass} title="${escapeHTML(tip)}">${escapeHTML(out)}</span>`);
    } else {
      // Apply punctuation map char-by-char
      let converted = Array.from(token).map(ch => PUNC_MAP[ch] ?? ch).join('');
      converted = escapeHTML(converted).replaceAll('\n', '\n<br>');
      htmlParts.push(converted);
    }
  }
  document.getElementById('result').innerHTML = htmlParts.join('');
}

function setStatus(msg, ok=true) {
  const status = document.getElementById('status');
  status.innerHTML = `<span class="chip" style="${ok ? '' : 'color:#b91c1c'}">${escapeHTML(msg)}</span>`;
}
function setActiveDictName(name) {
  document.getElementById('activeDict').textContent = name;
  localStorage.setItem(LS_KEYS.lastName, name);
}

// #region --- Dictionary loading -----------------------------------------------------
async function loadCSVText(csvText, displayName) {
  try {
    const parsed = parseDictionaryCSV(csvText);
    MAPPING = parsed.mapping;
    TOOLTIP = parsed.tooltip;
    setStatus(`字典加载完毕 ✓ (${Object.keys(MAPPING).length}个条目)`, true);
    setActiveDictName(displayName);
    // 触发一次渲染
    convert(document.getElementById('input').value || '');
  } catch (e) {
    console.error(e);
    setStatus(`加载字典失败: ${e.message}`, false);
  }
}

async function loadDictionaryFromURL(url, displayName) {
  try {
    setStatus(`加载${displayName}中……`);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();
    await loadCSVText(csv, displayName);
    // 清理自定义缓存（此时以预设为准）
    localStorage.removeItem(LS_KEYS.customCSV);
  } catch (e) {
    console.error(e);
    setStatus(`无法加载 ${displayName}：${e.message}`, false);
  }
}

async function loadDictionaryFromFile(file) {
  const text = await file.text();
  await loadCSVText(text, `自定义文件: ${file.name}`);
  // 缓存自定义 CSV 文本，刷新后也能恢复
  try { localStorage.setItem(LS_KEYS.customCSV, text); } catch {}
}

// #region --- UI wiring --------------------------------------------------------------
function populatePresetSelect(selectEl) {
  selectEl.innerHTML = '';
  for (const p of PRESETS) {
    const opt = document.createElement('option');
    opt.value = p.id; opt.textContent = p.label;
    selectEl.appendChild(opt);
  }
  // 如果有“已保存的自定义”也加一个虚拟项
  if (localStorage.getItem(LS_KEYS.customCSV)) {
    const opt = document.createElement('option');
    opt.value = '__custom_saved__';
    opt.textContent = '自定义 (保存的字典)';
    selectEl.appendChild(opt);
  }
}

async function init() {
  const select = document.getElementById('dictSelect');
  const upload = document.getElementById('dictUpload');
  const inputEl = document.getElementById('input');

  populatePresetSelect(select);

  // 绑定事件：选择预设
  select.addEventListener('change', async (e) => {
    const val = e.target.value;
    if (val === '__custom_saved__') {
      const csv = localStorage.getItem(LS_KEYS.customCSV);
      if (csv) await loadCSVText(csv, '自定义 (已保存)');
      else setStatus('无已存储自定义字典。', false);
      localStorage.setItem(LS_KEYS.presetId, val);
      return;
    }
    const preset = PRESETS.find(p => p.id === val) || PRESETS[0];
    localStorage.setItem(LS_KEYS.presetId, preset.id);
    await loadDictionaryFromURL(preset.path, preset.label);
  });

  // 绑定事件：上传文件
  upload.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await loadDictionaryFromFile(file);
    // 确保下拉里出现“Custom (saved)”选项并选中
    populatePresetSelect(select);
    select.value = '__custom_saved__';
    localStorage.setItem(LS_KEYS.presetId, '__custom_saved__');
  });

  // 输入联动
  inputEl.addEventListener('input', (e) => convert(e.target.value));
  convert(inputEl.value || '');

  // 恢复上次选择
  const lastPresetId = localStorage.getItem(LS_KEYS.presetId);
  if (lastPresetId === '__custom_saved__' && localStorage.getItem(LS_KEYS.customCSV)) {
    select.value = '__custom_saved__';
    await loadCSVText(localStorage.getItem(LS_KEYS.customCSV), '自定义 (已保存)');
  } else {
    const preset = PRESETS.find(p => p.id === lastPresetId) || PRESETS[0];
    select.value = preset.id;
    await loadDictionaryFromURL(preset.path, preset.label);
  }

  // 显示上一次名字（可选）
  const lastName = localStorage.getItem(LS_KEYS.lastName);
  if (lastName) setActiveDictName(lastName);
}

init();

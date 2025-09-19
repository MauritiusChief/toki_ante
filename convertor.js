import {PUNC_MAP, escapeHTML, isLowerAsciiWord, parseDictionaryCSV} from './helper.js'
import {App, setActiveDictName, setStatus, renderTable, loadDictionaryFromURL, loadDictionaryFromFile, populatePresetSelect, MARK, PREPO} from './shared.js';

const LS_KEYS = {
  presetId: 'tp_dict_preset_id',
  customCSV: 'tp_dict_custom_csv', // 保存用户上传的 CSV 文本，便于刷新后继续使用
  lastName:  'tp_dict_last_name'
};

const PRESETS = [
  { id: 'default', label: '默认 (dictionary.csv)', path: 'dictionary.csv' },
  { id: 'conservative', label: '无虚词 (dictionary_c.csv)', path: 'dictionary_c.csv' },
  { id: 'onomatopoeia', label: '拟声词 (dictionary_d.csv)', path: 'dictionary_d.csv' },
  // { id: 'reverse', label: '逆向 (dictionary_r.csv)', path: 'dictionary_r.csv' },
]

let MAPPING = Object.create(null);     // { toki_pona_word -> target_string }
let TOOLTIP = Object.create(null);     // { toki_pona_word -> brief_cn_translation }

// #region --- Core conversion --------------------------------------------------------
function convert(text) {
  const tokens = text.split(/(\W+)/); // keep delimiters
  const htmlParts = [];
  // console.log(tokens)

  for (const token of tokens) {
    if (isLowerAsciiWord(token) && Object.prototype.hasOwnProperty.call(convertorApp.MAPPING, token)) {
      const out = convertorApp.MAPPING[token];
      const tip = `${token} : ${convertorApp.TOOLTIP[token] || ''}`;
      const markClass = MARK.has(token) ? ' class="mark"' : '';
      const prepoClass = PREPO.has(token) ? ' class="prepo"' : '';
      htmlParts.push(`<span${markClass}${prepoClass} title="${escapeHTML(tip)}">${escapeHTML(out)}</span>`);
    } else {
      // Apply punctuation map char-by-char
      let converted = Array.from(token).map(ch => PUNC_MAP[ch] ?? ch).join('');
      converted = escapeHTML(converted).replaceAll('\n', '\n<br>');
      htmlParts.push(converted);
    }
  }
  // console.log(htmlParts)
  document.getElementById('result').innerHTML = htmlParts.join('');
}

let convertorApp = new App(LS_KEYS, MAPPING, TOOLTIP, convert)

async function init() {
  const select = document.getElementById('dictSelect');
  const upload = document.getElementById('dictUpload');
  const inputEl = document.getElementById('input');
  const search = document.getElementById('search');

  populatePresetSelect(convertorApp, select, PRESETS);

  // 绑定事件：选择预设
  select.addEventListener('change', async (e) => {
    const val = e.target.value;
    if (val === '__custom_saved__') {
      const csv = localStorage.getItem(convertorApp.LS_KEYS.customCSV);
      if (csv) await loadCSVText(csv, '自定义 (已保存)');
      else setStatus('无已存储自定义字典。', false);
      localStorage.setItem(convertorApp.LS_KEYS.presetId, val);
      return;
    }
    const preset = PRESETS.find(p => p.id === val) || PRESETS[0];
    localStorage.setItem(convertorApp.LS_KEYS.presetId, preset.id);
    await loadDictionaryFromURL(convertorApp, preset.path, preset.label);
  });

  // 绑定事件：上传文件
  upload.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await loadDictionaryFromFile(file);
    // 确保下拉里出现“Custom (saved)”选项并选中
    populatePresetSelect(convertorApp, select, PRESETS);
    select.value = '__custom_saved__';
    localStorage.setItem(convertorApp.LS_KEYS.presetId, '__custom_saved__');
  });

  // 输入联动
  inputEl.addEventListener('input', (e) => convert(e.target.value));
  // 搜索联动
  search.addEventListener('input', (e) => renderTable(convertorApp, e.target.value));
  convert(inputEl.value || '');

  // 恢复上次选择
  const lastPresetId = localStorage.getItem(convertorApp.LS_KEYS.presetId);
  if (lastPresetId === '__custom_saved__' && localStorage.getItem(convertorApp.LS_KEYS.customCSV)) {
    select.value = '__custom_saved__';
    await loadCSVText(localStorage.getItem(convertorApp.LS_KEYS.customCSV), '自定义 (已保存)');
  } else {
    const preset = PRESETS.find(p => p.id === lastPresetId) || PRESETS[0];
    select.value = preset.id;
    await loadDictionaryFromURL(convertorApp, preset.path, preset.label);
  }

  // 显示上一次名字（可选）
  const lastName = localStorage.getItem(convertorApp.LS_KEYS.lastName);
  if (lastName) setActiveDictName(convertorApp, lastName);
}

init();

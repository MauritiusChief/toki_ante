import {REV_PUNC_MAP, escapeHTML, isLowerAsciiWord, parseDictionaryCSV} from './helper.js'
import {App, setActiveDictName, setStatus, renderTable, loadDictionaryFromURL, loadDictionaryFromFile, populatePresetSelect, MARK, PREPO} from './shared.js';

const LS_KEYS = {
  presetId: 'tp_dict_preset_id',
  customCSV: 'tp_dict_custom_csv', // 保存用户上传的 CSV 文本，便于刷新后继续使用
  lastName:  'tp_dict_last_name'
};

let MAPPING = Object.create(null);     // { toki_pona_word -> target_string }
let TOOLTIP = Object.create(null);     // { toki_pona_word -> brief_cn_translation }

const PRESETS = [
  { id: 'friendly', label: '友好 (dictionary_f.csv)', path: 'dictionary_f.csv' },
  { id: 'default', label: '默认 (dictionary.csv)', path: 'dictionary.csv' },
]

// #region --- Core conversion --------------------------------------------------------
function convert(text) {
  function isHan(ch) {
    // 覆盖中日韩统一表意文字的常用块；若你需要扩展到扩展A/B区可再补充范围
    return /[\u4E00-\u9FFF]/.test(ch);
  }
  const tokens = [];
  // 分解为token
  for (let i = 0; i < text.length; ) {
    const ch = text[i];
    // 连续英文字母作为一个 token（与原版“单词界限”一致）
    if (/[A-Za-z]/.test(ch)) {
      let j = i + 1;
      while (j < text.length && /[A-Za-z]/.test(text[j])) j++;
      tokens.push(text.slice(i, j));
      i = j;
      continue;
    }
    // 汉字按单字符拆分
    if (isHan(ch)) {
      tokens.push(ch);
      i++
      continue;
    }
    // 其它字符（数字、空白、标点等）逐字符推进
    tokens.push(ch);
    i++
  }
  // console.log(tokens)
  const htmlParts = [];
  for (const rawToken of tokens) {
    // 2.1 英文字母：沿用原版逻辑，直接查TOOLTIP
    if (writorApp.MAPPING[rawToken.toLowerCase()]) {
      const lower = rawToken.toLowerCase()
      const tip = writorApp.TOOLTIP[lower] || lower;
      const markClass = MARK.has(lower) ? ' class="mark"' : '';
      const prepoClass = PREPO.has(lower) ? ' class="prepo"' : '';
      htmlParts.push(
        `<span${markClass}${prepoClass} title="${escapeHTML(tip)}">${escapeHTML(lower)}</span>`
      );
      continue;
    }
    // 2.2 单个汉字：在 MAPPING 的“第二列”（显示/翻译列）里做包含匹配
    if (rawToken.length === 1 && isHan(rawToken)) {
      let matchedToki = null;
      for (const toki of Object.keys(writorApp.MAPPING)) {
        const value = writorApp.MAPPING[toki] || '';
        if (value && value.includes(rawToken)) {
          matchedToki = toki;
          break; // 命中首个即可；如需更复杂优先级可在此处自定义
        }
      }
      if (matchedToki) {
        const tip = writorApp.TOOLTIP[matchedToki] || matchedToki;
        const markClass = MARK.has(matchedToki) ? ' class="mark"' : '';
        const prepoClass = PREPO.has(matchedToki) ? ' class="prepo"' : '';
        htmlParts.push(
          `<span${markClass}${prepoClass} title="${escapeHTML(tip)}">${escapeHTML(matchedToki)}</span> `
        );
        continue;
      }
    }
    // 2.3 其它情况 标点映射转义和换行
    let converted = Array.from(rawToken).map(ch => REV_PUNC_MAP[ch] ?? ch).join('');
    converted = escapeHTML(converted).replaceAll('\n', '\n<br>');
    htmlParts.push(converted);
  }

  document.getElementById('result').innerHTML = htmlParts.join('');
}

let writorApp = new App(LS_KEYS, MAPPING, TOOLTIP, convert)

async function init() {
  const select = document.getElementById('dictSelect');
  const upload = document.getElementById('dictUpload');
  const inputEl = document.getElementById('input');
  const search = document.getElementById('search');

  populatePresetSelect(writorApp, select, PRESETS);

  // 绑定事件：选择预设
  select.addEventListener('change', async (e) => {
    const val = e.target.value;
    if (val === '__custom_saved__') {
      const csv = localStorage.getItem(writorApp.LS_KEYS.customCSV);
      if (csv) await loadCSVText(csv, '自定义 (已保存)');
      else setStatus('无已存储自定义字典。', false);
      localStorage.setItem(writorApp.LS_KEYS.presetId, val);
      return;
    }
    const preset = PRESETS.find(p => p.id === val) || PRESETS[0];
    localStorage.setItem(writorApp.LS_KEYS.presetId, preset.id);
    await loadDictionaryFromURL(preset.path, preset.label);
  });

  // 绑定事件：上传文件
  upload.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await loadDictionaryFromFile(file);
    // 确保下拉里出现“Custom (saved)”选项并选中
    populatePresetSelect(writorApp, select, PRESETS);
    select.value = '__custom_saved__';
    localStorage.setItem(writorApp.LS_KEYS.presetId, '__custom_saved__');
  });

  // 输入联动
  inputEl.addEventListener('input', (e) => convert(e.target.value));
  // 搜索联动
  search.addEventListener('input', (e) => renderTable(e.target.value));
  convert(inputEl.value || '');

  // 恢复上次选择
  const lastPresetId = localStorage.getItem(writorApp.LS_KEYS.presetId);
  if (lastPresetId === '__custom_saved__' && localStorage.getItem(writorApp.LS_KEYS.customCSV)) {
    select.value = '__custom_saved__';
    await loadCSVText(localStorage.getItem(writorApp.LS_KEYS.customCSV), '自定义 (已保存)');
  } else {
    const preset = PRESETS.find(p => p.id === lastPresetId) || PRESETS[0];
    select.value = preset.id;
    await loadDictionaryFromURL(writorApp, preset.path, preset.label);
  }

  // 显示上一次名字（可选）
  const lastName = localStorage.getItem(writorApp.LS_KEYS.lastName);
  if (lastName) setActiveDictName(writorApp, lastName);
}

init();
import {PUNC_MAP, escapeHTML, isLowerAsciiWord, parseDictionaryCSV} from './helper.js'

export const LS_KEYS = {
  presetId: 'tp_dict_preset_id',
  customCSV: 'tp_dict_custom_csv', // 保存用户上传的 CSV 文本，便于刷新后继续使用
  lastName:  'tp_dict_last_name'
};

export function setStatus(msg, ok=true) {
  const status = document.getElementById('status');
  status.innerHTML = `<span class="chip" style="${ok ? '' : 'color:#b91c1c'}">${escapeHTML(msg)}</span>`;
}

export function setActiveDictName(name) {
  document.getElementById('activeDict').textContent = name;
  localStorage.setItem(LS_KEYS.lastName, name);
}
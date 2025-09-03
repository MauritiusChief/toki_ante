import csv
import re
import html

def load_mapping(csv_file):
    """
    读取道本语转换表
    返回两个映射:
      mapping: {道本语: 正字}
      tooltip: {道本语: 中文简译}  (如果中文简译为空，则为空字符串)
    """
    mapping = {}
    tooltip = {}
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader, None)  # 如果第一行是表头就保留；若无表头可注释掉
        for row in reader:
            if len(row) >= 2 and row[0].strip():
                daoben = row[0].strip()
                hanzi = row[1].strip()
                cn = row[2].strip() if len(row) >= 3 else ""
                mapping[daoben] = hanzi
                tooltip[daoben] = cn
    return mapping, tooltip

def convert_text(input_file, output_txt, output_html, mapping, tooltip):
    with open(input_file, 'r', encoding='utf-8') as fin:
        text = fin.read()

    # 定义标点符号映射
    punc_map = {
        ',': '，',
        '.': '。',
        '!': '！',
        '?': '？',
        ':': '：',
        ';': '；',
        '(': '（',
        ')': '）',
        '[': '【',
        ']': '】',
        '<': '《',
        '>': '》'
    }
    # 虚词
    mark = ['li', 'e', 'pi', 'o', 'la']

    tokens = re.split(r'(\W+)', text)
    # print(tokens)

    converted_tokens = []
    html_tokens = []

    for token in tokens:
        if token.islower() and token in mapping:
            # 转换为正字
            converted_tokens.append(mapping[token])

            # HTML部分：加title提示（道本语+中文简译）
            tip = f"{token} : {tooltip.get(token, '')}"
            mark_token = ''
            if token in mark: mark_token = 'class="mark" '
            html_tokens.append(f'<span {mark_token}title="{html.escape(tip)}">{html.escape(mapping[token])}</span>')
        else:
            # 处理标点符号和特殊字符
            converted_punc = ''.join(punc_map.get(char, char) for char in token)
            converted_tokens.append(converted_punc)
            # html用的换行
            html_punc = html.escape(converted_punc)
            html_punc = html_punc.replace('\n', '\n<br>')
            html_tokens.append(html_punc)

    # 写入TXT
    with open(output_txt, 'w', encoding='utf-8') as fout:
        fout.write(''.join(converted_tokens))

    # 写入HTML
    html_content = f"""<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>道本语转换结果</title>
<style>
body {{
    line-height: 1.6;
    margin: 100px;
}}
span {{
    cursor: help;
    border-bottom: 1px dotted #888;
}}
.mark {{
    color: #999;
}}
</style>
</head>
<body>
{''.join(html_tokens)}
</body>
</html>
"""
    with open(output_html, 'w', encoding='utf-8') as fout:
        fout.write(html_content)

if __name__ == "__main__":
    # root_path = "toki_hanzi/"
    root_path = ""
    csv_file = root_path+"dictionary.csv"     # 道本语字典CSV
    input_file = root_path+"input.txt"     # 道本语文本
    output_txt = root_path+"output.txt"
    output_html = root_path+"output.html"

    mapping, tooltip = load_mapping(csv_file)
    convert_text(input_file, output_txt, output_html, mapping, tooltip)

    print("转换完成！TXT与HTML已生成。")

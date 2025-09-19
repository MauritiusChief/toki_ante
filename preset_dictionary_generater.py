import csv
from pathlib import Path

# 原始 CSV 文件路径
input_file = Path("dictionary.csv")

# 修改计划
changes_c = {
    "outfile": "dictionary_c.csv",
    "edits": {
        "e": "e",
        "la": "la",
        "li": "li",
        "o": "o",
        "pi": "pi"
    }
}
changes_d = {
    "outfile": "dictionary_d.csv",
    "edits": {
        "e": "唉",
        "la": "啦",
        "li": "哩",
        "o": "哦",
        "pi": "噼"
    }
}
changes_f = {
    "outfile": "dictionary_f.csv",
    "edits": {
        "ala": "无不非否",
        "e": "把将",
        "ijo": "什物",
        "ike": "坏歹",
        "kalama": "声音",
        "kama": "来至到",
        "kasi": "草木",
        "ken": "可能",
        "kili": "果蔬",
        "kin": "亦也",
        "kiwen": "石硬",
        "laso": "蓝兰",
        "lawa": "首头",
        "li": "者兮",
        "loje": "红丹",
        "luka": "手五",
        "lukin": "看见",
        "mi": "吾我",
        "o": "乎请",
        "pali": "工作做造",
        "pan": "米面",
        "pana": "出予",
        "pona": "良好",
        "sewi": "上天",
        "sike": "年轮",
        "sina": "你尔",
        "sitelen": "图书",
        "taso": "但惟",
        "toki": "语言话",
        "tawa": "向往",
        "utala": "战斗",
        "weka": "离去"
    }
}

changes = [changes_c, changes_d, changes_f]

# 读取原始 CSV 内容
with input_file.open("r", encoding="utf-8-sig", newline="") as f:
    reader = list(csv.reader(f))

header = reader[0]  # 表头
rows = reader[1:]   # 内容行

# 对每个修改计划生成一个新的 CSV 文件
for change in changes:
    output_name = change["outfile"]
    edits:dict = change["edits"]
    new_rows = []
    for row in rows:
        if row and row[0] in edits.keys():
            # 替换第二列
            row = row.copy()
            if len(row) > 1:
                row[1] = edits[row[0]]
        new_rows.append(row)

    with open(output_name, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(new_rows)

    print(f"已生成 {output_name}")

print("全部完成！")

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
    "edits": {}
}
with open("edits_f.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        key, value = row[0].strip(), row[1].strip()
        changes_f["edits"][key] = value

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

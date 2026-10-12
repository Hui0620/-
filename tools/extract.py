# -*- coding: utf-8 -*-
"""从 index.js 中提取手语词库数据"""
import re, json

src = open('index.js', encoding='utf-8').read()

# 定位词库数组 $r=[
m = re.search(r'\$r=\[', src)
print('array starts at:', m.start() if m else None)

# 逐条提取词条（非贪婪，词条之间以 },{id: 分隔）
pattern = re.compile(
    r'\{id:`([a-zA-Z_0-9]+)`,word:`([^`]+)`,pinyin:`([^`]+)`,aliases:\[([^\]]*)\],category:`([a-z]+)`,description:`([^`]*)`,tips:\[([^\]]*)\],handshape:`([^`]*)`(,twoHanded:!0|,twoHanded:!1)?,location:`([^`]*)`,movement:`([^`]*)`(,recognizable:!0)?\}'
)
entries = pattern.findall(src)
print('total entries found:', len(entries))

result = []
for eid, w, p, al, c, desc, tips, hs, th, loc, mv, rec in entries:
    aliases = re.findall(r'`([^`]*)`', al)
    tip_list = re.findall(r'`([^`]*)`', tips)
    result.append({
        'id': eid, 'word': w, 'pinyin': p, 'aliases': aliases,
        'category': c, 'description': desc, 'tips': tip_list,
        'handshape': hs, 'twoHanded': th == ',twoHanded:!0',
        'location': loc, 'movement': mv, 'recognizable': rec == ',recognizable:!0',
    })

cats = {}
for e in result:
    cats.setdefault(e['category'], []).append(e['word'])
for c, ws in cats.items():
    print(f'--- {c} ({len(ws)}): ' + ', '.join(ws))

# 检查是否有漏掉的词条：统计 word: 出现次数
all_words = re.findall(r'word:`([^`]+)`', src)
print('total word: occurrences:', len(all_words))
if len(all_words) != len(result):
    # 找出没匹配上的
    matched = {e['word'] for e in result}
    missing = [w for w in all_words if w not in matched]
    print('MISSING:', missing)

json.dump(result, open('existing_vocab.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('saved to existing_vocab.json')

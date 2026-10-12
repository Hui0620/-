# -*- coding: utf-8 -*-
"""查看 family/emotion/traffic/time 分类词条样式"""
import json

vocab = json.load(open('existing_vocab.json', encoding='utf-8'))
for cat in ['family', 'emotion', 'traffic', 'time', 'medical']:
    print(f'======== {cat} ========')
    for e in vocab:
        if e['category'] == cat:
            print(json.dumps(e, ensure_ascii=False, indent=None))
    print()

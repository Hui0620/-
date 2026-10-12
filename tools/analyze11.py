# -*- coding: utf-8 -*-
"""查找 ti Map 的 get 调用（语音匹配）"""
import re

src = open('index.js', encoding='utf-8').read()

for m in re.finditer(r'\bti\.get\(', src):
    i = m.start()
    print(f'--- @{i} ---')
    print(src[max(0,i-800):i+600])
    print()
